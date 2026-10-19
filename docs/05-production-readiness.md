# 05 · Security, Cost, Performance, Testing & Operations

## 1. Authentication and session security

Browse Explore/Search/Map/Detail without login. Email magic link is recommended by Figma account text; PRD permits Supabase Auth without choosing method. One idempotent onboarding path sets profile defaults. PKCE/code exchange runs server-side; fixed redirect allowlist; relative return paths only. Session persists via official Supabase SSR cookie handling, secure cookie attributes appropriate to SDK, HTTPS production, server verification at each private boundary. Cookie refresh proxy is session plumbing, not sole authorization.

Do not blindly prescribe HttpOnly for cookies the browser SDK needs; follow supported SSR configuration and avoid copying tokens into localStorage/custom state. Private response no-store, never shared CDN cache. Auth errors generic; rate limits/resend and email deliverability configured before beta. Logout clears private queries, aborts in-flight requests, resets analytics; account deletion requires proof of recent interactive auth (recommended10min), exact confirmation, and backend hard delete. User A may not pass B's user ID in any route/body to access data.

Supabase publishable key is browser-safe **only with correct RLS/grants**. Secret/admin client tetap server-only, hanya dipakai account-deletion/operator dan private provider-cache/budget operations. Pisahkan fungsi infrastructure dari user data operations; jangan menerima nama tabel/query arbitrary atau meneruskan admin client ke wishlist/profile service. Bila memungkinkan gunakan role/RPC credential yang lebih terbatas. Environment validation mencegah secret masuk bundle. User-editable metadata tidak pernah menjadi sumber admin role.

## 2. Abuse/security controls

| Threat | Prevention | Verification |
|---|---|---|
| Cross-account wishlist/links | Verified user, own RLS, composite FK, column grants | Real A/B/anon DB tests and API tests |
| Search/photo cost amplification | Distributed per-IP/user limits, fan-out reservation, global daily counters, Google quotas | Reject large batch and repeated photo token requests; budget failure fail closed |
| SSRF through TikTok/menu/photo URLs | Fixed provider endpoints, host/path allowlist, bounded resolver, signed photo resources | Internal-IP/redirect/DNS/port/userinfo cases |
| XSS via provider captions/reviews | Escaped text, safe links, no raw embed HTML, CSP | Malicious text fixtures and CSP report checks |
| CSRF on cookie-auth writes | Same-origin Origin checks + supported CSRF mechanism for missing Origin; no wildcard credentials CORS | Cross-origin POST/DELETE blocked; callback allowlist |
| Leaked GPS/query/secret in logs | Redacted body/cookies/token/query; private GPS POST body; explicit event properties | Inspect browser requests, logs and analytics payload |
| Moderator privilege spoof | Server-owned role/allowlist, admin-only grants | user_metadata admin flag cannot approve |
| Stale auth after deletion | Fresh verification + DB own-row constraints/user-existence; cache clear | Old JWT cannot reinsert profile or personal data |

CSP starts report-only in staging with explicit allowlist for Google Maps APIs/assets, Supabase, TikTok official embed, PostHog. Tighten after real network inventory; do not invent a broad `https:` allowlist. Permissions-Policy restrict geolocation to self; Referrer-Policy limits personal URLs; HSTS on production; external links use safe target handling. Third-party scripts lazy and covered by Privacy Policy/consent decisions. Do not send raw email, TikTok URL, search phrase, GPS, cookie or author content to exception telemetry.

## 3. API cost envelope

Before beta, owner sets monthly acceptable spend B and per-service allocations. Compute from **current console SKU prices/free thresholds**, not an assumed flat Google credit. Formula: `monthly cost≈Σ max(0,billableUnits_s−eligibleFreeUnits_s)*unitPrice_s + hosting + DB + email + analytics`. Tiered rates require summing pricing bands. Paid-unit volume includes map initializations, candidate searches, overview/review details, photos, coordinate misses and card hydration; quote each separately.

Beta load-model example, **assumptions not forecasts**:50 testers×3 sessions/week×4 weeks=600 sessions;2 candidate requests/session=1200 search calls;2 detail opens/session=1200 details;20% review opens=240 review requests; photo units depend on actual displayed cards, lazy loading and retries. If50 users save20 places, a coordinate cold load can require up to1000 lookups across accounts before shared valid-cache reuse. Returning users can still cause expensive name/rating card hydration because coordinate caching does not authorize other content caching. Budget spike measures this dominant cost.

Controls: candidate cap20; photo lazy loading one image/card; max3 initial gallery photos; no review fetch on cards; one discovery candidate request reused across sections;400ms search debounce; no auto pan search; in-flight dedup; no speculative paid route prefetch; batch20 hydration/concurrency4; no polling; coords reused within legal cache. Clustering improves rendering, **does not reduce already-issued Places requests**. Rate limits alone do not cap dollars; hard provider/app budget is mandatory. Billing alerts notify but do not stop spend.

Configure Google per-API quotas and app daily SKU/action caps; warning thresholds recommended50/80/100% of planned allowance, chosen in console-supported periods. At cap, fail provider calls closed with quota state, preserve own saved IDs and removal/profile access. Kill switch disables discovery hydration without taking auth/wishlist DB down. Monitor calls/action, retries, failure rate, projected spend, coordinate hit ratio, photo volume. Never log content to measure cost.

## 4. Performance targets and measurement

| Target confirmed PRD | How measured | Design response |
|---|---|---|
| LCP<2.5s | Lighthouse lab plus field p75 proposal on iPhone Safari/Android Chrome; state device/network cohort | Stream SSR, fixed image dimensions, lazy map/video, optimize authorized own assets |
| Search<3s normal conditions | Action commit→result visible, report p50/p75/p95, cold/warm provider separately; specify whether400ms debounce included | One provider call + batch curation, abort stale, no details waterfall |
| Save feedback<500ms | Tap→optimistic paint under normal main-thread load; separate server ack | One shared query membership update |
| Map responsive | Record long tasks/frame traces pan/select; proposed p95 input response<100ms on test devices | Stable markers, bounded pins, conditional clustering |
| Crash-free sessions>99% | Define session crash as uncaught fatal client exception; observed sessions and sample uncertainty | error boundaries + exception telemetry; no success claim from mocked tests |

These are goals; no application benchmark has run. Define reproducible representative midrange Android + iPhone, normal mobile network profile, at least20 measured runs for lab trends; do not present tiny beta percentages as statistically conclusive. Analytics blocked by consent/ad-block means crash-free is measured subset only.

## 5. Error/state handling matrix

| Condition | User-visible outcome | Retry / logging |
|---|---|---|
| Search loading/empty/error | Skeleton; no matches+reset; distinct failed search+Retry | Abort stale; one bounded transient read retry |
| Provider quota/budget | Data temporarily unavailable; private saved IDs retained | No automatic retry storm; alert operator |
| Maps SDK failure | Map unavailable, continue List View | Retry SDK on user action; sanitized error |
| GPS denied/timeout | Manual city/area selector; existing data still usable | User-triggered retry only; no repeated browser prompt |
| Missing photo/menu/halal/reviews | Placeholder/official link if known/Not Verified/no reviews | Unknown never converted into zero or non-halal |
| Place closed/removed | Closed label or unresolved saved entry, allow remove/open source where possible | Never silently delete saved row |
| Save/remove fails | Rollback changed membership; toast+Retry | Unknown result reconciled before next mutation |
| TikTok invalid/unavailable/duplicate | Field error / Watch on TikTok fallback / existing link success | Unavailable preview doesn't block manual confirmation |
| Auth expired/error | Login recovery, clear private data; preserve safe intent once | No credentials in logs |
| Offline/network/DB down | Explicit unavailable, no false success/empty | No offline write queue; retry user-driven |
| Partial coordinate hydration | N nearby, X unverified locations; unresolved items still saved | Batch Retry within budget |

Use route error boundaries for fatal render errors, per-query errors for recoverable regions. Structured logs: request ID, route template, error class, provider operation, latency, status, field-mask identifier, call units; exclude payload/identity by default. Vercel logs + PostHog approved exception capture suffice initially if capabilities verified; no extra Sentry install without monitoring gap evidence. Report crash-free target as unmeasurable until capture is verified. Alert beta operator on sustained provider quota/5xx, auth failures, DB errors and spend; owner/channel must be named before launch.

## 6. Test architecture and release gates

Tests are **planned**, not executed in this architecture task. Vitest for pure logic/contracts; local Supabase real PostgreSQL for constraints/RLS/atomic functions; Playwright for browser journeys. Mock paid APIs for deterministic CI. A small manually approved live smoke checks credentials, masks, attributions, oEmbed and map behavior in staging with strict call budget. Mock success cannot prove provider integration works.

| Layer | Minimum meaningful coverage |
|---|---|
| Unit | Haversine inclusive boundaries/unknown; ranking m100/unrated/ties/empty C; filter parser invalid/duplicate/default; null price/halal/open; marker precedence; TikTok URL/redirect validation; provider error/DTO transforms |
| DB integration | Duplicate concurrent save; A/B/anon isolation every CRUD; composite ownership FK; atomic import rollback/retry; public approved-only and hidden submitter; user cannot edit moderation/owner; cache expiry; concurrent budget cap |
| API integration | AuthRequired/403/404; malformed/oversized body; Zod unknown keys; field-mask allowlist; provider quota/timeout; batch ownership; CSRF; hard budgets for SSR+API; signed photo token+expired resource; account delete retries |
| Browser E2E | Guest Explore→Search→Detail; all combined filters/reset; list/map identical snapshot after switch; explicit SearchThisArea; Save guest→login→one save; all surfaces update+rollback; wishlist logout/login; radius1/3/5/10; GPS denied/manual/out-of-area; TikTok canonical+short link/unavailable+duplicate+branch confirmation; directions exact destination; deletion |
| UX/mobile | Real Safari iPhone and Android Chrome; keyboard/focus/screen reader spot-check; reduced-motion static highlight;200% text zoom; viewport375/390/430; offline/slow network; attribution not covered by sheet |

Regression focus: two concurrent saves at different places with one failure; removing place while saved-only filter active; session changes during request; filter changes during map refresh; old response after logout; unknown coordinates cannot claim0 nearby; Google ID moved to duplicate existing save. ID migration updates all own references transactionally after verifying canonical mapping; collision merges membership and links, no silent overwrite.

## 7. Analytics and product validation

North Star confirmed: **Weekly Active Discoverers**, unique weekly users performing save, saved-wishlist revisit, or directions action. Add explicit `wishlist_viewed` event (recommended instrumentation gap in PRD event list); emit only when saved content is actually loaded, not on skeleton/guest prompt. Week timezone Asia/Jakarta; dedup identified account and guest device identity where lawful/consented, no fingerprinting. Report guest and signed-in cohorts separately to avoid claiming cross-device uniqueness.

Events confirmed PRD: explore_viewed, city_changed, category_selected, restaurant_searched, restaurant_opened, map_opened, map_marker_selected, wishlist_added, wishlist_removed, nearby_wishlist_viewed, directions_clicked, tiktok_import_started/completed. Props allowlist: city enum, category enum, view, source_surface, radius enum, result_count, failure_class, duration bucket. Avoid raw search/TikTok URLs/place IDs in analytics unless necessary and explicitly reviewed. Record wishlist/import success after server acknowledgment; UI optimistic paint isn't durable conversion. Import started denominator one deliberate flow start per attempt, completed one committed link; retries/duplicates not new conversions.

AARRR: discovery acquisition/activation; first save and import activation; revisit/nearby retention; referral/revenue out of MVP. HEART: adoption(first3 saves), retention(D7), task success(import completion), happiness optional beta feedback. Confirmed beta hypotheses:30–50 testers;≥50% save≥3 places;≥70% import completion;D7≥20%; revisit and directions CTR baseline only. Track consent coverage and confidence intervals before acting on small-sample rates.

## 8. Environments, secrets and deployment plan

| Environment | Configuration / data |
|---|---|
| Local | Local Supabase, synthetic fixtures, mocked providers by default; optional separate dev Google key |
| Preview/staging | Separate Supabase project/Google restricted key+quota; stable staging domain for auth allowlist; previews cannot touch production DB |
| Production | Dedicated project/keys/budget, reviewed domains/email delivery, backups and operator alerts |

| Variable (proposed) | Visibility / purpose |
|---|---|
| NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY | Browser; project identifier/auth client |
| SUPABASE_SECRET_KEY | Server only; isolated admin deletion/operator and private provider-cache/budget calls; never normal personal queries |
| GOOGLE_PLACES_API_KEY | Server only; Places New, separate env key |
| NEXT_PUBLIC_GOOGLE_MAPS_API_KEY / NEXT_PUBLIC_GOOGLE_MAP_ID | Browser; HTTP referrer + Maps JS API restriction |
| NEXT_PUBLIC_POSTHOG_KEY / NEXT_PUBLIC_POSTHOG_HOST | Browser; separate projects/envs; collection choices reviewed |
| APP_ORIGIN / PHOTO_TOKEN_SIGNING_SECRET | Server; callback/origin allowlist and token signature |
| PROVIDER_DAILY_CALL_LIMITS / PAID_APIS_ENABLED | Server validated config; explicit budget/kill switch |

Do not add unused OAuth/email secrets. SMTP configured in Supabase dashboard under authorized operator work later. API restriction on server key must match actual available Vercel egress; cannot claim static-IP restriction on dynamic serverless egress. If static egress unavailable, enforce API restriction + rotation + app budget/WAF and document accepted exposure. Browser key intentionally visible, referrer restrictions must include only authorized hosts, not broad wildcard preview domains.

CI: typecheck + lint + unit + local DB integration + deterministic core Playwright → build → preview; no real paid search in every CI run. Promote after staging evidence/security/cost gates and product approval. Migrations applied once from controlled pipeline before compatible application version; previews must not independently migrate shared production. Use backward-compatible expand→migrate→contract changes.

Rollback: restore previous application deployment/config; leave additive schema intact. Disable faulty paid integration via kill switch. Database restore is separate reviewed operation, never auto-run destructive down migration. Backup restore drill before beta where data persistence is promised; document RPO/RTO based on chosen Supabase plan, not invented SLA. No Kubernetes/Docker orchestration required. No service/project configuration is performed by this blueprint.
