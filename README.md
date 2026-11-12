# Jobs around Arden, NC

Static listing of open roles within about a 45-minute drive of Arden, NC, built
with the [Astryx design system](https://astryx.atmeta.com) and published on
GitHub Pages.

Live: https://jacoblbagent.github.io/arden-jobs/

## Pages

| File | Contents |
|------|----------|
| `docs/index.html` | All roles (565) |
| `docs/entry-level.html` | Entry level only (321) |

Each file is self-contained: inlined CSS, no network requests. The filter row
links between the two files because the renderer strips script. One inline
script is added after render (see `scripts/table-sort.js`) so the column headers
sort: click a header for ascending, again for descending, a third time to return
to the rendered "newest first" order.

The entry level page also carries a Location filter, added after render from
`scripts/location-filter.{js,css}`: one select built from the Location cells,
sorted by number of roles. Listings that name several towns ("Asheville ·
Arden") match either one, so per-town counts can add up to more than the page
total. Filtering and sorting compose: a filtered row set stays filtered while
the columns sort. `scripts/inject-location-filter.py` lists which pages get it;
add a filename there to put the filter on another view.

## Rebuilding

```bash
bash scripts/build-docs.sh
git add -A && git commit -m "Rebuild pages" && git push
```

`scripts/build-docs.sh` renders `src/page.tsx` and `src/entry-level.tsx` into
`docs/`, which GitHub Pages serves from `main`.
The renderer refuses to write into a path excluded by `.gitignore`, so `docs/`
stays tracked.

## Data

`jobs.json` holds the deduped listings and `src/jobsData.ts` is the generated
module the pages import. Level comes from LinkedIn's own seniority field; where LinkedIn
reports Not Applicable or nothing, the job title decides. Titles that show rank above
entry level (manager, director, supervisor, lead, senior, foreman, journeyman) or a licensed
or credentialed role (physician, dentist, pharmacist, dietitian, physical therapist, BCBA,
registered nurse, licensed practical nurse, veterinarian, veterinary technician, CDL driver,
medical lab technician) are
listed as not entry level regardless of LinkedIn's field. The level is not shown in the
tables; it only decides which roles appear on the entry level page. Listings were collected on
November 11, 2026.
