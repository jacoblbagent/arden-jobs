#!/usr/bin/env bash
# Render the two Astryx pages straight into docs/, which is the published
# artifact: GitHub Pages serves main:/docs at
# https://jacoblbagent.github.io/arden-jobs/ and the tailnet Caddy site serves
# the same folder. One output directory, no copy step.
#
# The Astryx renderer refuses to write into a path excluded by .gitignore, so
# docs/ stays tracked and the old dist/ folder is ignored and unused.
set -euo pipefail
cd "$(dirname "$0")/.."

mkdir -p docs
for page in page:index entry-level:entry-level; do
  src="src/${page%%:*}.tsx"
  out="docs/${page##*:}.html"
  npx @astryxdesign/cli experimental render "$src" --out "$out"
done

touch docs/.nojekyll

# The renderer writes no script, so the sortable headers are inlined after the
# fact from scripts/table-sort.{js,css}. Everything else in the page is untouched.
python3 scripts/inject-table-sort.py
python3 scripts/inject-location-filter.py

echo "docs/ rebuilt: $(ls docs/*.html | wc -l) pages"
