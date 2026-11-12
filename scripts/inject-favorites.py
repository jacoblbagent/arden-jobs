#!/usr/bin/env python3
"""Inline the favorites script into the jobs page.

Same shape as the location filter: the Astryx renderer writes no script, so the
star buttons and the "Favorites" checkbox are added after the fact from
scripts/favorites.{css,js}, which keeps the code reviewable. The marker makes a
second run a no-op.

PAGES lists which rendered pages get favorites. This must run after
inject-location-filter.py: the checkbox joins that filter's row when it exists.
"""

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / "docs"
MARKER = "data-arden-jobs-favorites"
PAGES = ["index.html"]

css = (ROOT / "scripts" / "favorites.css").read_text(encoding="utf-8")
js = (ROOT / "scripts" / "favorites.js").read_text(encoding="utf-8")

for guard in ("</script", "</style"):
    if guard in js or guard in css:
        raise SystemExit(f"scripts/favorites.* must not contain {guard}")

payload = (
    f'<style {MARKER}="css">\n{css}</style>\n'
    f'<script {MARKER}="js">\n{js}</script>\n'
)

for name in PAGES:
    page = DOCS / name
    html = page.read_text(encoding="utf-8")
    if MARKER in html:
        print(f"skipped (already has favorites): {page.name}")
        continue
    if html.count("</body>") != 1:
        raise SystemExit(f"{page.name}: expected exactly one </body>")
    page.write_text(html.replace("</body>", payload + "</body>"), encoding="utf-8")
    print(f"injected favorites: {page.name}")
