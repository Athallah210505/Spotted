# Discovery data repair: Google facts and business links

1 November 2026. User example: Ketoprak Cobek Pak Yono, Karang Tengah Raya No. 37, Lebak Bulus. Existing SPOTTED UI direction retained; Anti Slop DURING, ENERGY 2 / RHYTHM 2 / MOTION 2. No paid API, billing, stealth, proxy rotation, account login or runtime scraping was added.

## Cause and resulting behavior

The broad discovery layer held Overture source points and names, rather than Google listing details. Its ratings were explicitly NULL. The importer enriched only core records, so a discovery candidate had no supported path to become a detailed record. The fallback Google Maps link also searched a latitude/longitude pair, opening a bare coordinate pin. Generic category values were reused as cuisine, producing text such as `Jenis makanan: restaurant`. English weekday/AM-PM captures could not be interpreted by the Indonesian opening-hours UI.

The builder now promotes a source-backed discovery candidate into the existing core schema after checking identity, original source name, confidence, administrative bounds and a Google point within 100 m. GERS provenance is attached to that same ID; the discovery branch of `all_food_places` excludes it, preserving the overall record count and existing detail URL. Candidates that need manual branch/name review remain unpublished as Google matches.

Source-backed Google photos, review snippets, structured hours and menu-photo references are consumed by the generic card/detail components, without requiring the complete 104-place Google snapshot contract. Each fact can remain absent independently. Known business names and addresses are included in fallback Maps searches. Coordinate-only searches remain available for points that genuinely have no business identity. Raw categories receive readable labels, and generic categories are not presented as cuisine. Opening hours are normalized while the original source text remains in `rawHours` when changed. A source index prevents the additional provenance join from slowing every catalog read.

## Retrieved evidence and limits

Ordinary Scrapling headless retrieval returned HTTP 200 for the exact Pak Yono listing. The earlier block marker is retained as historical evidence; this batch did not bypass a challenge. A second normal capture of the same listing supplied additional authors. The two captures identify the same business, address and Google CID, and preserve individual review URLs and timestamps.

Pak Yono now has rating **4.7**, **945** Google ratings, seven days of **06.30–15.00** hours, a local storefront photo, two photos of the menu/banner and five snippets from different Google reviewers. The banner shows food choices rather than a complete current price list. The business description is backed by the [Indonesia Travel food guide](https://www.indonesia.travel/id/id/travel-ideas/gastronomy/don-t-leave-indonesia-before-you-get-a-taste-of-these-12-favorite-local-foods). Its store and menu/banner images were visually inspected.

A bounded queue of **73 records across 18 districts** was checked, with at most one follow-up per record: **35** matched, including **1** closed listing; **34** unresolved; **3** requiring manual branch/name review; **1** outside the match radius. No missing name, score, author, price or review was invented. Thirty-three matched records remain partial; only Pak Yono adds a newly complete five-author snapshot. This does not complete the other roughly 25,000 source records.

The batch downloaded **41 business photos** (35 new discovery matches and six earlier core references) and **6 menu-choice photos**. Downloads accept only public Google image hosts, reject avatar paths/redirects and oversized or non-image responses, write atomically, and retain URL/SHA-256 evidence. Some photographed closed listings remain archived in the database and are excluded from browse. Other photos were source-matched but not all were individually visually reviewed.

## Delivered data

The database still contains **25,907 combined source records**: the core now has **2,258** records and **302** GERS links remove known discovery overlap. Totals are **582** Google matches, **576** ratings, **471** structured hours, **566** review snippets and **129** locally stored business-photo references. There are **24** potential duplicate pairs; this is not a unique-business census. Unnamed records remain 46 and core addresses missing remain 1,061.

The raw HTML stays in `/tmp/spotted-discovery-repair`. The committed `discovery-review-queue.json` and `discovery-google-enrichment.json` retain the actual queue, per-record status, source URLs and observation times. Do not replace them with fabricated complete rows. The existing Google-only `/api/catalog` remains a separate legacy endpoint; Explore/Map consume the full catalog.

```sh
# Re-parse only the existing capture cache; no network access.
.venv/bin/python scripts/data/complete_food_database.py --captures /tmp/spotted-discovery-repair --seed research/jaksel-jakbar-2026-10-28/discovery-review-queue.json --output research/jaksel-jakbar-2026-10-28/discovery-google-enrichment.json

# Materialize verified references if refreshing evidence; no billing.
.venv/bin/python scripts/data/materialize_food_photos.py --input research/jaksel-jakbar-2026-10-28/discovery-google-enrichment.json --input research/jaksel-jakbar-2026-10-28/google-enrichment.json
python3 scripts/data/build_food_database.py --raw-dir /tmp/spotted-food-database-raw
python3 research/jaksel-jakbar-2026-10-28/validate.py
```

A new collection run must retain the collector's stop-on-block behavior. Re-parsing captures preserves downloaded media and separately cited descriptions for the same listing identity, or identical name/point/Maps-URL/photo evidence when CID is missing, while retaining their original provenance. Incomplete capture failures retain an existing matching snapshot without giving its facts a newer observation date. Changed listing identities do not inherit those assets. The app caches the database per process; restart it after a database rebuild.

## Verification

PASS: 42 Python tests, 39 application unit/integration tests, production build/TypeScript, changed-file ESLint and formatting. The database validator compares CSV/JSON/SQLite, verifies integrity/foreign keys, per-field provenance, canonical weekdays and local-photo hashes. All 46 scoped browser cases passed across Chromium and mobile WebKit. The Pak Yono regression checks actual image decoding, rating/count, normalized hours, named business Maps identity, five attributed reviews and both menu images. Screenshots and source images were inspected. Physical device GPS was not retested; this change concerns data and its rendering.
