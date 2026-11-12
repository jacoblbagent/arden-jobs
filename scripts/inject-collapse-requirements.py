#!/usr/bin/env python3
"""Inline the row-click collapse script into the jobs page.

Same shape as the location filter and favorites: the Astryx renderer writes no
script, so the toggle is added after the fact from
scripts/collapse-requirements.js, which keeps the code reviewable. The marker
makes a second run a no-op. Its CSS rides in scripts/requirements.css, injected
with the sub-rows it styles.

Must run after inject-requirements.py: without sub-rows there is nothing to
fold, and the script exits on its own.
"""

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / "docs"
MARKER = "data-arden-jobs-collapse"
PAGES = ["index.html"]

js = (ROOT / "scripts" / "collapse-requirements.js").read_text(encoding="utf-8")

if "</script" in js:
    raise SystemExit("scripts/collapse-requirements.js must not contain </script")

payload = f'<script {MARKER}="js">\n{js}</script>\n'

for name in PAGES:
    page = DOCS / name
    html = page.read_text(encoding="utf-8")
    if MARKER in html:
        print(f"skipped (already has row collapse): {page.name}")
        continue
    if html.count("</body>") != 1:
        raise SystemExit(f"{page.name}: expected exactly one </body>")
    page.write_text(html.replace("</body>", payload + "</body>"), encoding="utf-8")
    print(f"injected row collapse: {page.name}")
