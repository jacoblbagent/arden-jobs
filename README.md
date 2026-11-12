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
`scripts/location-filter.{js,css}`: a multi-select built from the Location cells,
sorted by number of roles, with Arden, Fletcher and Mills River checked on first
paint. Checkbox changes apply instantly; Default restores that opening set and
All clears the filter, and an empty selection reads as unfiltered. Listings that
name several towns ("Asheville · Arden") match any one of their towns, so
per-town counts can add up to more than the page total. Filtering and sorting
compose: a filtered row set stays filtered while the columns sort.
`scripts/inject-location-filter.py` lists which pages get it.

Each listing carries its requirements as a sub-row underneath it, added after
render by `scripts/inject-requirements.py` from `src/requirements.json`. The
sub-row spans the table and hangs off the row above with a connector rule, so it
reads as that listing's detail rather than a second listing. It is marked
`data-expansion-panel`, the attribute the table's striping already skips, which
keeps the zebra intact; the sort and filter scripts treat a sub-row as part of
the row above, so a sorted or filtered table never separates the two.
`scripts/requirements.css` holds the styling.

Clicking a listing's row folds its requirements away, and clicking it again
brings them back. The row's title cell carries a chevron that turns to point at
the fold, and the row takes a tab stop so Enter or Space toggles it too. Links
and the favorites star keep their own clicks. The closed set is kept in
localStorage under `arden-jobs.collapsed`, keyed by listing id, so a folded row
stays folded through a reload, a sort, a filter, and a rebuild. That state is a
class rather than the `hidden` attribute, which the filters already own on the
sub-rows, so the two compose. `scripts/collapse-requirements.js` holds the code
and `scripts/inject-collapse-requirements.py` inlines it.

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

`src/requirements.json` holds each listing's requirements, keyed by job id, with
`req` (up to eight items) and `total` (how many the posting carried, so a list cut
at the cap says so). The items are the posting's own bullet list under a
requirements or qualifications heading, with basic and preferred qualifications
merged; benefits, pay, duty lists and trailing company boilerplate are dropped.
A posting that lists none stores an empty list and the page says so.

`scripts/collect-requirements.py` produces that file: it fetches each posting,
caches the page under `~/.hermes/cache/scratch/arden/`, and reduces it to the
requirements list. `--rebuild` re-extracts the cached pages after a change to the
filters, so retuning costs no requests.
