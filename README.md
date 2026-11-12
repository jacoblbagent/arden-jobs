# Jobs around Arden, NC

Static listing of entry level roles within about a 45-minute drive of Arden, NC,
built with the [Astryx design system](https://astryx.atmeta.com) and published on
GitHub Pages.

Live: https://jacoblbagent.github.io/arden-jobs/

## Page

| File | Contents |
|------|----------|
| `docs/index.html` | Entry level roles (290) |

The file is self-contained: inlined CSS, no network requests. One inline script
is added after render (see `scripts/table-sort.js`) so the column headers sort:
click a header for ascending, again for descending, a third time to return to
the rendered "newest first" order.

The page also carries a Location filter, added after render from
`scripts/location-filter.{js,css}`: one select built from the Location cells,
sorted by number of roles. Listings that name several towns ("Asheville ·
Arden") match either one, so per-town counts can add up to more than the page
total. Filtering and sorting compose: a filtered row set stays filtered while
the columns sort. `scripts/inject-location-filter.py` lists which pages get it.

## Rebuilding

```bash
bash scripts/build-docs.sh
git add -A && git commit -m "Rebuild pages" && git push
```

`scripts/build-docs.sh` renders `src/page.tsx` into `docs/`, which GitHub Pages
serves from `main`. The renderer refuses to write into a path excluded by
`.gitignore`, so `docs/` stays tracked.

## Data

`src/jobsData.ts` holds the listings the page renders; roles that are not entry
level are not in it. Level comes from LinkedIn's own seniority field; where
LinkedIn reports Not Applicable or nothing, the job title decides. Titles that
show rank above entry level (manager, director, supervisor, lead, senior,
foreman, journeyman) or a licensed or credentialed role (physician, dentist,
pharmacist, dietitian, physical therapist, BCBA, registered nurse, licensed
practical nurse, veterinarian, veterinary technician, CDL driver, medical lab
technician) are left out regardless of LinkedIn's field. The level is not shown
in the table. Listings were collected on November 11, 2026.

`jobs.json` is the raw collected dump, before the level split.
