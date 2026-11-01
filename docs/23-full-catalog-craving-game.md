# Full food catalog, clustered Map and craving game

1 November 2026. Ponytail FULL and Anti Slop DURING. Existing SPOTTED palette, typography and photo-led cards retained; ENERGY 2 / RHYTHM 2 / MOTION 2. No new dependency, paid API, billing, database mutation or external recommendation service.

## Catalog and layout

Explore previously read only the 104 published Google places. It now reads the collected SQLite database through `/api/places`, with 24 results per page and a Load More action. Search, category, rating, known opening hours, distance, saved-only and sorting use the same server dataset; the Filters page reads the same result total. Unknown price and halal facts are not treated as matching active filters. Those filters do not manufacture facts.

The research database still has 25,907 source records. Browse excludes 46 unnamed and 79 Google-closed records, then retains the 16 published places outside the research city boundaries, for **25,798 browse records**. This is not a count of verified unique businesses: unidentified overlaps across sources can remain. The 104 photographed places retain their existing images, bookmarks and attributed review detail. New records have compact text cards and internal Overview/Menu/Reviews pages. Missing ratings, menus, photos and reviews are not filled with invented values. Known conflicting discovery addresses are withheld from display.

Filters and Sort can wrap onto another row on narrow screens instead of escaping the container. The category/search toolbar remains sticky. Result counts reflect the whole filtered catalog, rather than only the current page. The database is loaded read-only on the server and cached in process; the browser receives pages, not the entire research JSON. Deployment file traces include the SQLite source for the API and detail route. The legacy `/api/catalog` remains the explicitly Google-only snapshot endpoint.

## Map

Map requests venues in its visible bounds from the same catalog. Screen-space grouping keeps marker anchors sufficiently separated; groups show a count instead of drawing every restaurant rating over its neighbors. Selecting a group zooms in by two levels. At maximum zoom, a scrollable popup lists the group's internal detail links, including venues that share an address. Individual pins open internal details. Group counts sum all venue records represented, not unique verified businesses.

Requests are cancelled when the view changes or Map unmounts. Failed venue loading retains the map and exposes retry without cancelling GPS tracking. The radius count uses the full catalog, rather than the old 104 places. Browser coordinates are sent to the application's own count endpoint for that calculation; no position database write is added. Live GPS permission, stop/restart, manual point selection, stale-callback protection and camera behavior from the previous change remain.

## Five-question game

Visitors open **Bingung makan apa?** from Explore. Five yes/no questions cover main meals, Indonesian food, East Asian food, coffee/cafes, and sweets. Left swipe answers no, right swipe yes; buttons and focused-card arrow keys provide alternatives. Vertical gestures do not answer a question. Progress, previous-question editing, dialog dismissal and restart are supported. Answers stay in mounted component memory and reset on reopening.

After five answers, the API ranks actual catalog records by matching known category/cuisine traits, breaking ties with the existing catalog ordering and rating. Unknown cuisine contributes neither a match nor a mismatch. Business names are not used to infer cuisine: for example, `Hayam Wuruk` does not establish that a bakery serves ayam. The UI shows five results, matched preferences and internal detail links. Contradictory answers yield closest matches rather than a claim that all preferences were satisfied. Empty, loading and retryable error states are explicit. The rule-based result is a preference suggestion, not a verified full-menu or dietary assessment.

Motion is bounded: card entrance, bookmark feedback and question opacity respect reduced-motion settings. Keyboard focus stays inside the existing dialog and returns to its launch button when dismissed. Success can later be measured as game completion followed by opening a venue detail; no analytics collection was added here.

## Verification

- PASS: production build/TypeScript and changed-file ESLint/Prettier; deployment traces contain SQLite.
- PASS: 38 unit/integration tests, including full database counts, non-repeating pagination, null ratings, bad API parameters, cluster conservation/separation, recommendation changes and unknown cuisine.
- PASS: 42 scoped browser cases across Chromium and mobile WebKit, including full-catalog search/detail, filters, pagination, swipes/buttons, previous answer/restart, recommendation failure/retry, 320–1280 px layouts, map clusters, GPS movement/cleanup and existing photo/review flows.
- Desktop/mobile screenshots inspected for Explore, grouped Map and game results. Map tests use local tiles; GPS uses simulated positions. Physical device GPS and new photography collection were not performed.

## Marker alignment follow-up

Client navigation from Explore could load Leaflet's `display: block` rule after the Map CSS, moving count labels to the marker corner. Map-scoped selectors now preserve centered grid layout regardless of stylesheet order and keep zoom controls at 44 px on touch devices. Regression coverage opens Map both directly and through Explore, checks text centers within one pixel, and preserves cluster spacing and zoom behavior on Chromium/mobile WebKit. The failing navigation case was reproduced before the CSS fix; four targeted cases passed afterward.
