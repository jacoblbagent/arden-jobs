#!/usr/bin/env python3
"""Insert each listing's requirements as a sub-row beneath its row.

The Astryx renderer emits one <tr> per listing and nothing else, so the
requirements are added after render: this walks the table body, finds the id at
the end of each listing link, and inserts a full-width row carrying that
listing's requirements plus the CSS that draws the connector.

The data comes from src/requirements.json, keyed by job id, collected from the
postings themselves by the collector noted in the README. Re-running is safe:
the marker below makes a second pass a no-op.
"""

import html as htmllib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / "docs"
DATA = ROOT / "src" / "requirements.json"
MARKER = "data-arden-jobs-req"

ROW = re.compile(r'<tr class="astryx-table-row[^"]*">.*?</tr>', re.S)
ID = re.compile(r'linkedin\.com/jobs/view/[^"]*-(\d+)"')


def cell_html(job_id, entry):
    """One listing's requirements block: a bullet list, or a plain line when the
    posting lists none. `total` is how many the posting actually carried, so a
    list cut at the display cap says so instead of looking complete."""
    items = entry.get("req") or []
    total = entry.get("total") or len(items)
    parts = [
        f'<tr class="req-row" data-expansion-panel="" {MARKER}-for="{job_id}">',
        '<td colspan="4" class="req-cell"><div class="req-branch">',
    ]
    if items:
        parts.append('<span class="req-label">Requirements</span>')
        parts.append('<ul class="req-list">')
        for item in items:
            is_certification = re.search(r"certification|certified", item, re.I)
            css_class = ' class="req-certification"' if is_certification else ""
            parts.append(f"<li{css_class}>{htmllib.escape(item, quote=False)}</li>")
        parts.append("</ul>")
        if total > len(items):
            parts.append(
                f'<p class="req-more">{total - len(items)} more on the posting</p>'
            )
    else:
        parts.append('<span class="req-label">Requirements</span>')
        parts.append('<p class="req-none">Not listed in the posting.</p>')
    parts.append("</div></td></tr>")
    return "".join(parts)


def main():
    data = json.loads(DATA.read_text(encoding="utf-8"))
    css = (ROOT / "scripts" / "requirements.css").read_text(encoding="utf-8")
    if "</style" in css:
        raise SystemExit("scripts/requirements.css must not contain </style")

    for page in sorted(DOCS.glob("*.html")):
        html = page.read_text(encoding="utf-8")
        if MARKER in html:
            print(f"skipped (already carries requirements): {page.name}")
            continue

        out, pos, placed, missing = [], 0, 0, []
        # Only the body's rows: the header row carries the same class.
        body_start = html.find("<tbody")
        body_end = html.find("</tbody>", body_start)
        if body_start < 0 or body_end < 0:
            raise SystemExit(f"{page.name}: no table body found")
        for match in ROW.finditer(html, body_start, body_end):
            row = match.group(0)
            job_id = None
            found = ID.search(row)
            if found:
                job_id = found.group(1)
            out.append(html[pos:match.end()])
            pos = match.end()
            entry = data.get(job_id) if job_id else None
            if entry is None:
                missing.append(job_id or row[:60])
                continue
            out.append(cell_html(job_id, entry))
            placed += 1
        out.append(html[pos:])
        html = "".join(out)

        style = f'<style {MARKER}="css">\n{css}</style>\n'
        if html.count("</body>") != 1:
            raise SystemExit(f"{page.name}: expected exactly one </body>")
        html = html.replace("</body>", style + "</body>")
        page.write_text(html, encoding="utf-8")
        print(f"inserted {placed} requirement rows: {page.name}")
        if missing:
            print(f"  no data for {len(missing)} rows: {', '.join(missing[:5])}")


if __name__ == "__main__":
    main()
