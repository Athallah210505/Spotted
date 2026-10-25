# Headless reviews and interactive Map

25 October 2026. Continues the Explore/detail work in [Google data in Explore](16-google-explore-data.md).

## Current functionality

- Explore's white identity panel follows the photo's width and edges.
- Detail starts its Menu content with a factual Overview based on the published category and Jakarta area. This is not an invented owner description.
- Each of the 32 matched places now has five distinct Google reviews: 160 total. Each entry retains its author link, individual score and a short original excerpt. The repeated “Cuplikan ulasan Google” caption is removed.
- `/map` uses Leaflet 1.9.4 with OpenStreetMap road tiles: drag, pinch/keyboard zoom, explicit zoom buttons, 32 actual venue coordinates and selected-marker links to internal detail. Back from detail returns to Map, including after changing detail tabs. Area suggestions, schematic streets and radius cards are removed from this route.
- “Gunakan lokasi saya” requests browser geolocation only after a tap. Success centers the map and draws the location/accuracy; denied, unavailable and timeout states retain manual map navigation and support another attempt. Coordinates are not stored or added to URLs. This is a single current-position fix, not continuous tracking.

## Headless collection

The user requested a reusable skill before further scraping. `firecrawl-scrapling` is installed locally at `~/.codex/skills/firecrawl-scrapling/SKILL.md`; it is available through `$firecrawl-scrapling`. Its helper performs one Firecrawl v2 scrape without opening a browser window, sends no API key by default, and supports an existing self-hosted endpoint. Skill frontmatter validation and mocked helper success/failure/auth checks passed.

Firecrawl anonymous access successfully retrieved TUKU's public page and three public review entries. Scrapling's ordinary dynamic MCP session ran with `headless: true` and fetched public English-language pages, combined with existing verified Indonesian-language captures. Different language views exposed different authors; entries were deduplicated by contributor source. Lara Djonggrang's initial query returned two businesses, so the observed direct business link was checked against the published coordinates before inclusion. Owner responses are excluded. Neither login nor challenge bypass was used; no paid key or billing was activated. The abandoned visible-browser collector was removed and its progress data was not published.

`scripts/data/enrich_google_reviews.py` merges the inspected captures with the existing snapshot. It checks branch name/source or a direct branch link within 50 m, requires five unique written reviews for every published place, and replaces the snapshot atomically. An incomplete refresh leaves the previous snapshot intact. Raw source captures stay in `/tmp`, outside Git. The earlier baseline importer preserves enriched reviews when an older page contains fewer entries.

## Verification

- 31 Node tests and 16 Python parser/refresh tests.
- 72 browser cases checked across desktop and mobile engine profiles: 70 passed in the full run; the two import cases passed on a focused rerun after correcting their map destination. Coverage includes real pan/zoom behavior; opt-in emulated geolocation; denied/timeout/retry; tile failure/retry; safe marker-to-detail navigation; five reviews; aligned Explore card/photo bounds; existing Save, Wishlist, import and profile flows.
- Automated map tests intercept tiles with a local image. They do not pan/zoom against the community tile servers or use the user's real location.
- TypeScript, ESLint, changed-file formatting and production build passed. Native device GPS was not tested.

## Limits

Google data is a manually refreshed snapshot of 32 Jakarta places, not whole-city coverage or a live Places API. Review excerpts remain short; full reviews are available through the Google source links. Menu information is unchanged. `/wishlist?view=map` retains the previous prototype; the main `/map` route is the interactive map requested here. The prototype TikTok import's “Find it on the map” now returns to its saved-place Wishlist preview so it does not claim an illustrative imported restaurant is a real Google venue. Location accuracy and availability depend on the device and browser permission.

Road tiles require network access. Attribution remains visible and normal browser caching is retained. There is no offline prefetch or bulk tile download. Community OSM tiles have no availability guarantee; use a suitable production provider if traffic grows. References: [Leaflet quick start](https://leafletjs.com/examples/quick-start/), [OSM tile policy](https://operations.osmfoundation.org/policies/tiles/), [Firecrawl scrape](https://docs.firecrawl.dev/features/scrape), [Scrapling MCP](https://scrapling.readthedocs.io/en/latest/ai/mcp-server.html).
