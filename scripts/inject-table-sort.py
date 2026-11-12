#!/usr/bin/env python3
"""Inline the sortable-header script into the rendered pages.

The Astryx renderer produces a page with no script at all, so sorting is added
after the fact: this inserts one <style> and one <script> just before </body>.
Both come from scripts/table-sort.{css,js}, which keeps the code reviewable
instead of living in a shell heredoc. Re-running is safe; the render rewrites
each page from source, and the marker below makes a second injection a no-op.
"""

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / "docs"
MARKER = "data-arden-jobs-sort"

css = (ROOT / "scripts" / "table-sort.css").read_text(encoding="utf-8")
js = (ROOT / "scripts" / "table-sort.js").read_text(encoding="utf-8")

for guard in ("</script", "</style"):
    if guard in js or guard in css:
        raise SystemExit(f"scripts/table-sort.* must not contain {guard}")

payload = (
    f'<style {MARKER}="css">\n{css}</style>\n'
    f'<script {MARKER}="js">\n{js}</script>\n'
)

for page in sorted(DOCS.glob("*.html")):
    html = page.read_text(encoding="utf-8")
    if MARKER in html:
        print(f"skipped (already sortable): {page.name}")
        continue
    if html.count("</body>") != 1:
        raise SystemExit(f"{page.name}: expected exactly one </body>")
    page.write_text(html.replace("</body>", payload + "</body>"), encoding="utf-8")
    print(f"injected sort script: {page.name}")
