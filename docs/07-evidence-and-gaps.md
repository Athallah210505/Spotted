# 07 · Evidence & Source Reconciliation

Reviewed19 October2026, Asia/Jakarta. Sources below were read for this blueprint; policies/SDK behavior need recheck at implementation/launch because they can change.

## 1. Primary product evidence

| Source | Read method / observed evidence | Authority |
|---|---|---|
| [SPOTTED PRD MVP v1.0](https://docs.google.com/document/d/1VJaKLT11DS6usxYOgmtSrPM7rQiYVRBRA_L2OGOsimo/edit) | Google Drive fetch full document; version1.0 Draft for Development,18 October2026; FR01–08, scope, schema, targets | Behavior/functionality source of truth |
| [Approved visual file/page](https://www.figma.com/design/Sxg2J06MrgCE0ywAviBDNu/SPOTTED?node-id=3-2) | Figma MCP get_metadata page3:2; get_screenshot5:6,2029:1503,5:456; read-only Plugin API texts of filters/profile/privacy/account/delete/import/confirmation/videos | Visual composition, not proof of live data behavior |
| [Design handoff](../SPOTTED-design-handoff.md) | Local file read; links to PRD/original v1, assumptions and fixture/prototype limitations | Supporting context, lower precedence than actual PRD/v2 |
| [v2 progress](../SPOTTED-visual-polish-v2-progress.md) | Local file read; applied vs still-under-review changes and original duplicate context | Explains why canonical set may differ; not proof every polish task complete |
| User attachment "Software Architecture & Technical System Design" | Full task brief read;18 phases/final deliverables/explicit no implementation or deployment | Scope of this task |

Tidak ada operasi tulis/edit pada Figma. Plugin API script hanya membaca node/text yang sudah ada. Browser prototype click-through, visual QA setiap frame, Code Connect export dan actual API integration tidak dilakukan.

## 2. Reconciliation log

| Observation | Conflict / impact | Blueprint treatment |
|---|---|---|
| Two Figma sections have same name `03 / Screen Designs · Illustrative data`:9:1090 and2029:1499 | Explore5:6 has floating plaque/taller image/warm canvas;2029:1503 shows prior card structure. Both on page3:2 | Use5:* provisionally; owner chooses canonical; don't silently mix layouts |
| Local v2 note says polish/responsive QA still under review | File labelled approved in brief but progress note incomplete | Architecture supports existing screens; do not claim finished visual QA |
| PRD schema status `want_to_go,visited`, scope listsVisited P1 | Adding visited toggle now expands P0 | Omit status MVP as explicit proposal/Q10 |
| PRD model lacks FK lifecycle for saved links | Removing save could orphan private import | Composite FK + proposed cascade, Q04 signoff before build |
| PRD profile says privacy settings; Figma Privacy text explicitly fixed private/no background toggle | A generic privacy preferences model would add controls | Fixed policy + location choice; no sharing/background toggle |
| PRD public video submissions require moderation but no P0 submission/admin UI | New public contribution workflow would add screens | Approved admin-curated records/empty tab; own links private; Q14 |
| Google data needed for nearby but PRD only persists ID | Full catalog storage would conflict with provider ownership | Optional expiring coordinate-only cache with billing/backup gate; live on-demand fallback |
| Figma menu/card names/prices/ratings are illustrative | Fixture values cannot become production truth | Live Places + sourced curation; legal menu link or empty |
| Figma account explicitly email link; PRD Auth method unspecified | Need engineering decision | Recommend email link; Q07 config decision |
| North Star includes saved-wishlist revisit, tracking list omits generic wishlist_viewed | Cannot calculate one qualifying action reliably | Proposed explicit wishlist_viewed event |
| PRD directions allows Google or Apple Maps; Google source policy constrains use with other maps | Automatic Apple coordinates from Google requires review | Google Maps URL default satisfies OR requirement; Apple only with compliant independent data |
| Nearby/current location vs manual city centroid | UI could wrongly say "near you" for city-center distances | Label origin explicitly; no fabricated current GPS |

## 3. Figma supporting states inventory

Loading/empty/error/quota:9:1092,9:1100,9:1107,9:1115. Location denied/manual:9:1122,9:1132. Wishlist empty/guest/save failure/remove/removed:9:1143,9:1152,9:1161,9:1171,9:1180. TikTok invalid/loading/unavailable/no restaurant/duplicate:9:1190,9:1199,9:1207,9:1217,9:1227. Detail missing/reviews failure/directions:9:1234,9:1244,9:1253. Privacy/account/edit/delete/deleted/auth failure:9:1261,9:1286,9:1297,9:1309,9:1318,9:1325. No nearby/Tangsel/radius10:9:1334,9:1344,9:1351. Search map/preview/refreshed:10:1178,10:1226,10:1358. Detail photos2/3:10:1417,10:1473. Wishlist radius1/3:15:1210,15:1234. These are UI states, not justification for separate backend services/routes.

Additional required engineering states not proven as dedicated Figma frames: partial coordinate resolution, stale session during optimistic save, budget cap during progressive hydration, recent-auth delete challenge, offline write failure, out-of-launch GPS, and closed/moved Place ID. Designer should validate these using existing state patterns without expanding navigation; no Figma modifications performed.

## 4. Official technical sources

| Topic | Primary source | Used for |
|---|---|---|
| Rendering | [Next.js Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components) | Server shell plus browser interactivity islands |
| Optimistic state | [TanStack Query optimistic updates](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates) | Cache mutation/rollback/invalidation |
| Google content | [Places policies](https://developers.google.com/maps/documentation/places/web-service/policies) | Attribution, content persistence restrictions |
| Coordinate exception | [Maps current service-specific terms](https://cloud.google.com/maps-platform/terms/maps-service-terms) | Non-EEA Places §14.3; billing-region gate |
| Search method | [Text Search](https://developers.google.com/maps/documentation/places/web-service/text-search), [Nearby Search](https://developers.google.com/maps/documentation/places/web-service/nearby-search) | Distinct request parameters/area/candidate limits |
| Field selection/cost | [Choose fields](https://developers.google.com/maps/documentation/places/web-service/choose-fields), [Usage and billing](https://developers.google.com/maps/documentation/places/web-service/usage-and-billing) | Fixed minimal masks and SKU-aware budget |
| Photos | [Place Photos](https://developers.google.com/maps/documentation/places/web-service/place-photos) | Resource expiry, attribution, live media flow |
| Directions | [Maps URLs](https://developers.google.com/maps/documentation/urls/get-started) | External correct-destination navigation |
| TikTok | [Official Embed Videos](https://developers.tiktok.com/docs/en/embed-videos) | Official preview/embed and unavailable-content fallback |
| Auth SSR | [Supabase server-side clients](https://supabase.com/docs/guides/auth/server-side/nextjs) | Supported SSR client/session verification |
| Database authorization | [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) | Grants, owner policies, security testing |
| Auth deletion | [Supabase deleteUser](https://supabase.com/docs/reference/javascript/auth-admin-deleteuser) | Server-side admin account deletion boundary |
| Edge limits | [Vercel WAF rate limiting](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting) | Distributed edge limit capability; plan availability to verify |

PostHog privacy documentation fetch did not return readable content through web tool. Collection settings here are **proposed application constraints**, not verified claims about account/plan features; exception capture, data region/retention, consent, URL scrubbing and disable-autocapture behavior require configuration verification. Current package version compatibility, pricing and plan entitlement were not finalized.

## 5. Deliverable verification

Blueprint documents reviewed for FR01–08 coverage, internal links, endpoint/schema naming, proposed-vs-confirmed distinction, no application implementation, and no fabricated performance/cost results. Editable diagram XML is structurally validated: kedua file menghasilkan0 errors/0 warnings. draw.io CLI gagal berjalan di sandbox (exit134 saat version check); sesuai fallback skill, diagram diserahkan sebagai XML editable dan Mermaid inline. Export PNG/SVG/PDF dan visual QA hasil render belum dilakukan. Runtime tests, migrations, security tests, live credentials, provider invoices, deployment and browser implementation QA remain future work as explicitly scoped.
