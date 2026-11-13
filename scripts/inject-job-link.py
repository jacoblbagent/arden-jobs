#!/usr/bin/env python3
"""Inline the posting-link button styles into the jobs page.

The button itself is markup: src/JobsPage.tsx renders one <a> per listing beside
the role text, so the href is there for every injector that reads the posting id
off it. Astryx's renderer drops <style>, so the rules that draw that anchor as a
tinted icon button are added here from scripts/job-link.css. The marker makes a
second run a no-op.
"""

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / "docs"
MARKER = "data-arden-jobs-job-link"
PAGES = ["index.html"]

css = (ROOT / "scripts" / "job-link.css").read_text(encoding="utf-8")
if "</style" in css:
    raise SystemExit("scripts/job-link.css must not contain </style")

payload = f'<style {MARKER}="css">\n{css}</style>\n'

for name in PAGES:
    page = DOCS / name
    html = page.read_text(encoding="utf-8")
    if MARKER in html:
        print(f"skipped (already has the posting link button): {page.name}")
        continue
    if html.count("</body>") != 1:
        raise SystemExit(f"{page.name}: expected exactly one </body>")
    page.write_text(html.replace("</body>", payload + "</body>"), encoding="utf-8")
    print(f"injected posting link button: {page.name}")
