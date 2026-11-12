#!/usr/bin/env python3
"""Inline the location filter into the entry-level page.

The Astryx renderer produces pages with no script, so the filter is added after
the fact the same way the sortable headers are: one <style> and one <script>
just before </body>, read from scripts/location-filter.{css,js} so the code
stays reviewable. Re-running is a no-op thanks to the marker attribute.

PAGES lists which rendered pages get the filter. Only the entry-level view has
it for now; add a filename here to put it on another page.
"""

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / "docs"
MARKER = "data-arden-jobs-location"
PAGES = ["entry-level.html"]

css = (ROOT / "scripts" / "location-filter.css").read_text(encoding="utf-8")
js = (ROOT / "scripts" / "location-filter.js").read_text(encoding="utf-8")

for guard in ("</script", "</style"):
    if guard in js or guard in css:
        raise SystemExit(f"scripts/location-filter.* must not contain {guard}")

payload = (
    f'<style {MARKER}="css">\n{css}</style>\n'
    f'<script {MARKER}="js">\n{js}</script>\n'
)

for name in PAGES:
    page = DOCS / name
    html = page.read_text(encoding="utf-8")
    if MARKER in html:
        print(f"skipped (already filtered): {page.name}")
        continue
    if html.count("</body>") != 1:
        raise SystemExit(f"{page.name}: expected exactly one </body>")
    page.write_text(html.replace("</body>", payload + "</body>"), encoding="utf-8")
    print(f"injected location filter: {page.name}")
