# Jobs around Arden, NC

Static listing of open roles within about a 45-minute drive of Arden, NC, built
with the [Astryx design system](https://astryx.atmeta.com) and published on
GitHub Pages.

Live: https://jacoblbagent.github.io/arden-jobs/

## Pages

| File | Contents |
|------|----------|
| `docs/index.html` | All roles (565) |
| `docs/entry-level.html` | Entry level only (376) |
| `docs/not-entry-level.html` | Above entry level (189) |

Each file is self-contained: inlined CSS, no scripts, no network requests. The
filter row links between the three files because the renderer strips script.

## Rebuilding

```bash
bash scripts/build-docs.sh
git add -A && git commit -m "Rebuild pages" && git push
```

`scripts/build-docs.sh` renders `src/page.tsx`, `src/entry-level.tsx` and
`src/not-entry-level.tsx` into `docs/`, which GitHub Pages serves from `main`.
The renderer refuses to write into a path excluded by `.gitignore`, so `docs/`
stays tracked.

## Data

`jobs.json` holds the deduped listings and `src/jobsData.ts` is the generated
module the pages import. Level comes from LinkedIn's own seniority field; where
LinkedIn reports Not Applicable or nothing, the job title decides and the Level
column says so. Listings were collected on November 11, 2026.
