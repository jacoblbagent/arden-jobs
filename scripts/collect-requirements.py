#!/usr/bin/env python3
"""Collect each listing's requirements from its LinkedIn posting page.

Reads the ids from src/jobsData.ts, fetches https://www.linkedin.com/jobs/view/<id>,
keeps the posting body out of the show-more-less-html block, splits it into
sections and keeps the bullets from the sections whose heading reads as
requirements (basic + preferred qualifications are merged). Each fetched page is
cached under pages/<id>.html and the reduced result in requirements.json, so a
re-run costs nothing and the extraction can be retuned offline.
"""

import html
import json
import os
import re
import subprocess
import sys
import time

UA = ("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) "
      "Chrome/131.0.0.0 Safari/537.36")
ROOT = os.path.expanduser("~/Code/arden-jobs")
BASE = os.path.expanduser("~/.hermes/cache/scratch/arden")
PAGES = os.path.join(BASE, "pages")
CACHE = os.path.join(BASE, "requirements.json")

# Headings that open a requirements block.
HEAD = re.compile(
    r"(requirement|qualification|what you.?ll need|what you need|what we.?re looking for|"
    r"we.?re looking for|who you are|about you|you have|you.?ll have|must have|must-haves|"
    r"minimum|basic qualif|preferred qualif|skills|experience|education|"
    r"physical demand|working condition|knowledge|abilities|desired|nice to have|"
    r"what it takes|the ideal candidate|ideal candidate|position requires)", re.I)

# Headings that mark a section that is not requirements.
STOP = re.compile(
    r"(benefit|compensation|pay range|salary|we offer|why (join|work)|about (us|the company|"
    r"you)|our (company|mission|culture|team)|equal opportunity|eoe|disclaimer|"
    r"how to apply|application process|perks|responsibilit|what you.?ll do|"
    r"the role|position summary|job summary|day to day|day-to-day|essential (dut|function)|"
    r"key dut|duties|overview|schedule|shift|hours|location|travel)", re.I)

# Words that make a bullet read as a requirement rather than a duty.
MARK = re.compile(
    r"\b(must|required|require[sd]?|ability|able to|minimum|at least|years? of|"
    r"degree|diploma|ged|certif\w*|licen\w*|proficien\w*|familiar\w*|knowledge of|"
    r"experience (in|with)|valid driver|background check|drug (test|screen)|"
    r"authorized to work|high school|associate'?s?|bachelor'?s?|skills? in)\b", re.I)

# Pay, perks and culture lines that sit inside a requirements list but are not
# requirements.
PERK = re.compile(
    r"(401\s?\(?k\)?|403\s?\(?b\)?|health insurance|dental|vision|paid time off|"
    r"\bPTO\b|tuition|student loan|stock purchase|employee (discount|stock|assistance|"
    r"benefits?)|referral|sign[- ]on bonus|retirement|pension|holiday|wellness|"
    r"flexible spending|life insurance|perks?|gym|free meals|uniform allowance|"
    r"career (growth|advancement)|opportunit(y|ies) for (growth|advancement)|"
    r"competitive (pay|wage|salary)|annual (bonus|incentive)|shift differential|"
    r"relocation|benefits?\b|eligibility for|learn more about)", re.I)

# Quotations and company boilerplate that trail a requirements list.
QUOTE = re.compile(
    r"(^[\u201c\"\u201d]|[\u201c\"\u201d]\s*[-\u2013\u2014]|\b(co-?founder|founder|ceo|"
    r"chief executive|president)\b|^note:|^about (us|the company)|^why (join|work))", re.I)

# Equal-opportunity and screening boilerplate.
EEO = re.compile(
    r"(equal opportunity|we are committed to (treating|providing)|regardless of race|"
    r"veteran status|e-?verify|drug[- ]free workplace|affirmative action)", re.I)

# A bullet that opens with one of these is a duty, unless it also carries a
# requirement marker further in.
DUTY = re.compile(
    r"^(maintains?|performs?|performing|scans?|assists?|provides?|ensures?|prepares?|"
    r"cooks?|cleans?|serves?|operates?|installs?|repairs?|troubleshoot\w*|coordinates?|"
    r"manages?|handles?|processes?|loads?|unloads?|picks?|packs?|delivers?|greets?|"
    r"answers?|responds?|schedules?|supports?|partners?|works? (with|as)|"
    r"reports?|monitors?|inspects?|drives?|builds?|assembles?|cuts?|paints?|welds?|"
    r"leads?|develops?|creates?|reviews?|trains?|attends?|participates?)\b", re.I)
DUTY_EXEMPT = re.compile(
    r"\b(must|ability|able to|years? of|degree|diploma|ged|certif\w*|licen\w*|"
    r"experience|knowledge|familiar\w*|proficien\w*|preferred|required)\b", re.I)

MAX_ITEMS = 8
MAX_LEN = 200


def fetch(url):
    r = subprocess.run(
        ["curl", "-s", "-A", UA,
         "-H", "Accept: text/html,application/xhtml+xml",
         "-H", "Accept-Language: en-US,en;q=0.9",
         "--max-time", "30", url],
        capture_output=True, text=True)
    return r.stdout


def body_html(page):
    i = page.find("show-more-less-html__markup")
    if i < 0:
        return ""
    i = page.find(">", i) + 1
    ends = [x for x in (page.find("</section>", i),
                        page.find("show-more-less-html__button", i),
                        page.find("description__job-criteria-list", i)) if x > 0]
    j = min(ends) if ends else len(page)
    markup = page[i:j]
    # The cut can land inside the show-more button's opening tag; drop the
    # fragment so no half a tag reaches the text.
    return re.sub(r"<[^>]*$", "", markup)


def blocks(markup):
    """Reduce the body to (text, kind) blocks; kind is 'h' for a heading-ish
    line, 'li' for a list item, 'p' for a paragraph."""
    s = markup
    s = re.sub(r"<li[^>]*>", "\n\x01LI\x02", s)
    s = re.sub(r"<h[1-6][^>]*>", "\n\x01H\x02", s)
    s = re.sub(r"</h[1-6]>", "\n", s)
    s = re.sub(r"<(br|/p|/div|/li|/tr)[^>]*>", "\n", s)
    s = re.sub(r"<p[^>]*>", "\n\x01P\x02", s)
    s = re.sub(r"</?(ul|ol|strong|b|em|span|section|table|tbody)[^>]*>", "", s)
    s = re.sub(r"<[^>]+>", "", s, flags=re.S)
    s = html.unescape(s)
    out = []
    for raw in s.split("\n"):
        kind = "p"
        if "\x01LI\x02" in raw:
            kind = "li"
        elif "\x01H\x02" in raw:
            kind = "h"
        text = raw.replace("\x01LI\x02", "").replace("\x01H\x02", "").replace("\x01P\x02", "")
        text = re.sub(r"\s+", " ", text).strip(" \u200b\u00a0")
        text = re.sub(r"^[•\-\*\u2022\u25cf\u00b7]\s*", "", text)
        if len(text) < 2:
            continue
        if kind == "p" and len(text) <= 70 and text.endswith(":") and not MARK.search(text):
            kind = "h"
        out.append((text, kind))
    return out


def is_heading(text, kind):
    return kind == "h" or (len(text) <= 60 and text.endswith(":") and not MARK.search(text))


def clean_item(text):
    text = re.sub(r"^(?:[•\-\*\u2022]\s*)", "", text)
    # A heading that ran into its first bullet ("Qualifications A current REAL
    # ID is required") is split here rather than shown as one line.
    text = re.sub(
        r"^(?:basic |preferred |minimum |required )?(?:qualifications?|requirements?)"
        r"\s*[:\-\u2013]?\s+(?=[A-Z0-9])",
        "", text, flags=re.I)
    text = re.sub(r"^(knowledge,? and skills required for the position are|"
                 r"knowledge, skills,? and abilities( required)?|skills and abilities required)"
                 r"\s*:?\s+", "", text, flags=re.I)
    # Job-criteria fragments that are not requirements.
    if re.match(r"^(no travel|travel required|full[- ]time|part[- ]time|day shift|"
                r"night shift|weekends|overtime|employment type|job function)\b", text, re.I):
        return ""
    text = re.sub(r"\s+", " ", text).strip()
    if len(text) > MAX_LEN:
        cut = text[:MAX_LEN]
        sp = cut.rfind(" ")
        text = (cut[:sp] if sp > 130 else cut).rstrip(",;:") + "\u2026"
    return text


def sections(bl):
    out, head, items = [], "", []
    for text, kind in bl:
        if is_heading(text, kind):
            if head or items:
                out.append((head, items))
            head, items = text, []
        else:
            items.append((text, kind))
    if head or items:
        out.append((head, items))
    return out


def usable(text):
    if len(text) < 12 or PERK.search(text) or QUOTE.search(text):
        return False
    # Sub-headings inside the list ("Knowledge of:", "Nice-to-Haves") are not
    # requirements of their own.
    if text.endswith(":"):
        return False
    if re.fullmatch(r"(nice[- ]to[- ]haves?|must[- ]haves?|preferred( qualifications?)?|"
                    r"knowledge|skills|abilities|education|experience|requirements?|"
                    r"qualifications?|bonus points?|plus(es)?|"
                    r"(required|preferred|minimum) (knowledge|skills|experience|education))",
                    text, re.I):
        return False
    if re.match(r"^powered by\b", text, re.I):
        return False
    # Calls to action that end a posting's requirement list.
    if re.match(r"^(ready to|learn more|apply (now|today)|click here|interested in|"
                r"join (our|the) team|take the next step|next step|how to apply|"
                r"don.?t see|what we offer)\b", text, re.I):
        return False
    if len(text) < 70 and text.endswith("?"):
        return False
    if EEO.search(text):
        return False
    if DUTY.search(text) and not DUTY_EXEMPT.search(text):
        return False
    return True


def requirements(markup):
    bl = blocks(markup)
    chosen = []

    for head, items in sections(bl):
        cand = [t for t, k in items if (k == "li" or (k == "p" and len(t) <= MAX_LEN)) and usable(t)]
        if len(cand) < 2:
            continue
        hits = sum(1 for t in cand if MARK.search(t))
        ratio = hits / len(cand)
        score = 3.0 * ratio
        if head:
            if STOP.search(head) and not HEAD.search(head):
                continue
            if HEAD.search(head):
                score += 3.0
            if re.search(r"(requirement|qualification|must|what you.?ll need|who you are|"
                         r"basic qualif|preferred qualif|education|skills)", head, re.I):
                score += 2.0
        if score >= 4.0:
            chosen.extend(cand)

    if not chosen:
        chosen = [t for t, k in bl if k == "li" and usable(t) and MARK.search(t)]
    if not chosen:
        joined = " ".join(t for t, k in bl)
        for sentence in re.split(r"(?<=[.!?])\s+", joined):
            if MARK.search(sentence) and usable(sentence):
                chosen.append(sentence)

    out, seen = [], set()
    for t in chosen:
        c = clean_item(t)
        key = re.sub(r"[^a-z0-9]+", "", c.lower())
        if key in seen or not usable(c):
            continue
        seen.add(key)
        out.append(c)
    return {"req": out[:MAX_ITEMS], "total": len(out)}


def main():
    os.makedirs(PAGES, exist_ok=True)
    src = open(os.path.join(ROOT, "src", "jobsData.ts"), encoding="utf-8").read()
    ids = re.findall(r'"id":\s*"(\d+)"', src)
    data = json.load(open(CACHE)) if os.path.exists(CACHE) else {}
    todo = [i for i in ids if i not in data]
    print("ids", len(ids), "todo", len(todo), flush=True)
    for n, jid in enumerate(todo, 1):
        path = os.path.join(PAGES, jid + ".html")
        if os.path.exists(path) and os.path.getsize(path) > 20000:
            page = open(path, encoding="utf-8").read()
        else:
            page = fetch("https://www.linkedin.com/jobs/view/" + jid)
            if "show-more-less-html__markup" not in page:
                time.sleep(5)
                page = fetch("https://www.linkedin.com/jobs/view/" + jid)
            open(path, "w", encoding="utf-8").write(page)
            time.sleep(2.0)
        markup = body_html(page)
        res = requirements(markup) if markup else {"req": [], "total": 0}
        data[jid] = {"ok": bool(markup), "req": res["req"], "total": res["total"]}
        if n % 20 == 0:
            json.dump(data, open(CACHE, "w"), indent=0)
            got = sum(1 for v in data.values() if v["req"])
            print(n, "fetched;", got, "of", len(data), "with requirements", flush=True)
    json.dump(data, open(CACHE, "w"), indent=0)
    got = sum(1 for v in data.values() if v["req"])
    print("DONE", len(data), "cached,", got, "with requirements")


def reextract():
    """Re-run the extraction over the cached pages, so the filters can be
    retuned without refetching anything."""
    data = json.load(open(CACHE))
    changed = 0
    for jid in list(data):
        path = os.path.join(PAGES, jid + ".html")
        if not os.path.exists(path):
            continue
        markup = body_html(open(path, encoding="utf-8").read())
        res = requirements(markup) if markup else {"req": [], "total": 0}
        if res["req"] != data[jid]["req"]:
            changed += 1
        data[jid] = {"ok": bool(markup), "req": res["req"], "total": res["total"]}
    json.dump(data, open(CACHE, "w"), indent=0)
    got = sum(1 for v in data.values() if v["req"])
    print("re-extracted", len(data), "pages;", changed, "changed;", got, "with requirements")


if __name__ == "__main__":
    if sys.argv[1:2] == ["--rebuild"]:
        reextract()
    else:
        main()
