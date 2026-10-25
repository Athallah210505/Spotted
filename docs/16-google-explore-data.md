# Google data in Explore

25 October 2026. Updated by [headless review collection and interactive map](17-headless-reviews-interactive-map.md). Current functionality replaces the technical catalogue UI with the existing SPOTTED Explore design. The user requested Google photos/ratings/reviews and readable opening hours, without pilot labels, coordinates, OSM IDs, website-source labels or archive captions in product cards. TikTok remains unchanged.

## Confirmed information

- 32 published Jakarta places, each with a downloaded venue photo, positive Google rating/review count and five attributed Google review excerpts of at most 15 words each. 26 have a weekly hours table in the retrieved page.

- Public Maps pages were read using a normal Scrapling dynamic browser session. No stealth/proxy/challenge bypass, Google API key or billed provider call was used. Existing paid API flags remain disabled. Browser sessions were closed after collection.
- Names, addresses, ratings/counts, hours, photo references and review authors/ratings came from those pages. TUKU Blok M:4.8/2450 reviews; Kambing Bakar Cairo Sambas:4.6; Cafe Batavia:4.5. The prior Chope value is no longer presented as a Google rating.
- 40 OSM seeds were considered. 32 listings matched names and nearby coordinates (maximum observed 123 m). Ambiguous/unmatched branches were excluded instead of assigning invented ratings/photos. This is not all Jakarta restaurants.

## Current functionality

Explore renders Google-backed cards directly, preserving house typography, photo/card overlay, blue ratings, bookmark, search/category rail and navigation. `/catalog` redirects to Explore. No pilot button, technical-source heading, OSM links, coordinates, raw opening-hours tags, archive/photo-author paragraphs or snapshot notes appear in this flow. Google Maps source links remain concise.

Cards open internal details with `restaurant-detail.module.css`: full-width hero, overlapping editorial panel, yellow rating, black active tab and fixed Save/Get Directions dock. Weekly hours expand in a native details/table, including TUKU's split Friday hours. Missing hours are omitted instead of fabricated. Menu links require an existing verified source URL. Reviews contain a brief Google excerpt, actual author/profile link, individual review score and link to all Google reviews. TikTok remains its existing empty state.

Search, category, Google rating, saved-only, weekly-schedule Open Now and sorting use published data. Distance/Nearest calculate straight-line distance from Blok M, not device GPS. Price/halal controls are not offered for Explore because these fields are not verified in this snapshot; legacy Map filters retain existing behavior. Filter state survives detail tabs and Back. Save/Remove uses existing in-memory state; full reload resets it. Map/Import prototype fixtures remain outside this update; it does not claim a live map/import provider integration.

## Data and refresh

- `src/features/catalog/data/google-places.json`: reviewed snapshot with source URLs/check times, coordinates for matching/directions, photo references/local paths, hours and short reviews. Raw Google HTML is not committed.
- `public/google-places/`:32 photos retrieved from the published references, about6MB total. No unrelated branch photos or generated replacements. Avatar URLs are rejected; corrected photos use content-versioned filenames to avoid stale image-cache entries.
- `google-data.ts`: Zod contract, Jakarta-time hours formatting, split/overnight schedules, filters and sorting. Unknown hours do not count as open.
- `/api/catalog`: public schemaVersion2, Google Maps source, no-store. Technical fields are available here for inspection but are not product copy.
- `scripts/data/inspect_google.py`: normalizes manually retrieved HTML; validates Maps URLs, names, nearby coordinates, image hosts and numeric ratings/counts. Optional `--download-photos` uses bounded responses/timeouts without retry/bypass. Offline refresh reuses matching photo assets; normalized output replaces the previous snapshot atomically. No valid records leaves it unchanged.

```sh
.venv/bin/python scripts/data/inspect_google.py /path/to/reviewed-pages.json --download-photos
.venv/bin/python -m unittest discover -s scripts/data -p 'test_*.py'
```

This is a point-in-time review, not automatic synchronization or a Places API integration. It is not an assertion of blanket reuse rights or future access guarantees. Source metadata remains available; a broader scheduled/provider integration needs its own access/storage/attribution policy. No paid Google project or Supabase change was made.

## Verification

31 Node unit/integration tests,13 offline Python tests and70 browser tests passed against the production build in Chromium and mobile WebKit. Coverage includes photo decoding,32 cards, absence of technical copy/demo venues, catalogue redirect, API fields, search/category/reset, Google rating filter counts/sorting, saved state, internal navigation/return query, weekly hours, review attribution, Maps destination, TikTok empty state, keyboard focus, image fallback and narrow/desktop/landscape layouts. Lint, typecheck, build and formatting passed. Browsing the snapshot makes no runtime provider requests.

`google-explore-*.png` and `google-detail-*.png` were reviewed against the existing editorial design. Physical-device/native Maps launch and scheduled freshness remain unverified.

## Design delivery gate

Anti Slop DURING retains the approved SPOTTED direction, ENERGY1/RHYTHM1/MOTION1.

| Rule/check | Result and evidence                                                                             |
| ---------- | ----------------------------------------------------------------------------------------------- |
| R-01       | PASS: no gradients added.                                                                       |
| R-02       | PASS: authored product copy contains no em dash.                                                |
| R-03       | PASS:375/430/1280px and landscape browser checks.                                               |
| R-04       | PASS: existing functional pin/search/bookmark/back icons reused.                                |
| R-05       | PASS: existing editorial feed/detail composition retained.                                      |
| R-06       | PASS: house Inter typography and existing heading hierarchy.                                    |
| R-07       | PASS: no decorative grid.                                                                       |
| R-08       | PASS: no decorative arrows added.                                                               |
| R-09       | PASS: no new promotional badges.                                                                |
| R-10       | PASS: no glass layers.                                                                          |
| R-11       | PASS: original photo/card/pill radii distinguish controls.                                      |
| R-12       | PASS: original card overlay shadow only.                                                        |
| R-13       | PASS: no glow.                                                                                  |
| R-14       | PASS: venue photo/identity grouping serves browsing.                                            |
| R-15       | PASS: search, card, Save and Directions are concrete controls.                                  |
| R-16       | PASS: no AI marketing copy.                                                                     |
| R-17       | PASS: all published ratings/counts come from matched Maps pages.                                |
| R-18       | PASS: Google author/excerpt preserved; no fictional reviews in this feed.                       |
| R-19       | PASS: no new animation.                                                                         |
| R-20       | PASS: existing SPOTTED masthead/card/detail identity.                                           |
| R-21       | PASS: existing light theme.                                                                     |
| R-22       | PASS: real venue photos, no generated illustration.                                             |
| R-23       | PASS: user explicitly requested Google photos;32 retrieved references.                          |
| R-24       | PASS: cards/detail/Back/Maps/source-review destinations tested.                                 |
| R-25       | PASS: existing house ink/canvas, blue/white and ink/yellow palette.                             |
| R-26       | PASS: search/filter/sort/bookmark/hours/directions have outcomes.                               |
| R-27       | PASS: empty results, image failure, missing hours and404 handled.                               |
| R-28       | PASS: no FAQ added.                                                                             |
| R-29       | PASS: existing semantic palette retained.                                                       |
| R-30       | PASS: no unrelated product template.                                                            |
| R-31       | PASS: approved house layout/CSS reused for the stated data change.                              |
| R-32       | PASS: native labels/details/table, focus handling and house tap sizes.                          |
| R-33       | PASS: JSX/CSS edited directly; importer only normalizes data.                                   |
| R-34       | PASS: no theme toggle introduced.                                                               |
| R-35       | PASS: production build and browser stories/screenshots verified.                                |
| R-36       | PASS: no claims of live updates, whole-city coverage or licensed API integration.               |
| R-37       | PASS: existing direction chosen before edits, dials1/1/1.                                       |
| R-38       | PASS: no invented photo/rating/review fields; unmatched records excluded.                       |
| C-1        | PASS: photos identify places; source copy removed to keep browsing primary.                     |
| C-2        | PASS: new controls exercised in browser tests.                                                  |
| C-3        | PASS: source-data UI replaced by venue cards, no filler sections.                               |
| C-4        | PASS: filter/empty/image-error/unknown-route states and mobile layouts checked.                 |
| C-5        | PASS: factual sources retained in data and review links.                                        |
| Liveliness | PASS:1/1/1, yellow masthead, actual venue photography, structural spacing and identity overlay. |
