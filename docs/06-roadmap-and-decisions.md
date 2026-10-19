# 06 · Roadmap, ADRs & Coding Readiness

## 1. Dependency-aware implementation roadmap

Semua effort di bawah adalah **perkiraan awal person-days**, belum komitmen sprint/delivery. Asumsi satu full-stack engineer, designer/PM/QA tersedia sebagian waktu. Tidak menjumlahkan pekerjaan paralel sebagai durasi kalender pasti. PRD sprint1–6 merupakan planning intent; penataan berikut memajukan auth/RLS untuk mencegah wishlist menjadi integrasi keamanan di akhir.

| Stage / horizon | Owner / estimasi | Dependencies | Deliverables & tasks | Acceptance criteria / Definition of Done | Risiko utama |
|---|---|---|---|---|---|
| 0 · Architecture review / Now | PM + tech lead + designer;1–2d | Blueprint, PRD, Figma | Pilih canonical screens; sign off open business rules, budgets, auth, terms | Semua blocking decision punya keputusan/owner; scope P0 jelas; persetujuan mulai implementasi terpisah | Berangkat dari screen/terms salah |
| 1 · Foundation + bounded integration spike / Now | Full-stack;3–5d | Stage0 approved | Next/TS/Tailwind; folders/import rules; env validation; test harness; separate env plan; confirm Google masks/keys/photo/oEmbed/auth mechanics with capped live calls | Build/typecheck pass; no secret client bundle; one sample place+preview verified; budget model based on measured unit calls | Provider constraints/cost membuat architecture perlu amendment |
| 2 · Auth, DB, security skeleton / Now | Full-stack;4–6d |1 | Migrations/RLS/grants/profile; login/logout; typed DB; mutation guards; atomic save/import primitive; deletion-proof design | A/B/anon security suite passes; session persistence; duplicate save safe; existing JWT after deletion denied | Cookie/redirect behavior pada mobile |
| 3 · Shared UI & core discovery / Next | Full-stack + designer;5–8d |1;2 for Save | Approved tokens/primitives/shell; Places adapter/contracts; Explore/Search/filter/rank; nullable DTO; skeleton/errors | City/category/query/filter/reset work; bounded calls; ranking tests; visual baseline canonical | Search coverage and unknown fields |
| 4 · Detail and external actions / Next | Full-stack;3–5d |3 | Gallery≤3, overview/menu evidence, lazy review/video tabs, attribution, Save island, directions | Correct branch destination; no mock menu in production; missing fields and tab failures isolated | Higher review/photo tier and attribution |
| 5 · Map + wishlist complete vertical flow / Next | Full-stack + QA;5–8d |2,3,4 | Maps JS adapter; explicit area search; same search state; list/map; coordinate hydration/cache expiry; radius/motion; membership rollback | No pan-trigger requests; Save sync all surfaces;1/3/5/10km boundaries; denied GPS/manual; partial hydration honest | Fan-out cost, GPS precision, render load |
| 6 · TikTok import + profile completion / Next | Full-stack;3–5d |2,3,5 | URL resolver/oEmbed fallback; confirmation; atomic link save; own-video section; profile/preferences/privacy/delete flow | Invalid/short/deleted videos covered; duplicate retry safe; no implicit publication; account deletion verified | SSRF edge cases, embed restrictions |
| 7 · Production readiness + closed beta / Later within MVP | Full-stack + QA + PM;4–7d |All above | Real devices, a11y/perf/cost evidence; telemetry; quota kill-switch; migration/restore drill; policies/SMTP; release approval | All P0 journeys pass; budgets/alerts effective; no cross-user leaks; performance measured and exceptions accepted by owner | Lab vs real usage, auth delivery, undercounted analytics |

Total engineering rough order27–44 person-days excluding Stage0 and stakeholder waiting. Scope/effort revised after bounded integration spike; a six-sprint target is feasible only if staffing and uncertainty support it. Do not compress security testing to preserve an arbitrary date.

Now = decisions/foundation/identity; Next = complete MVP user loop; Later = beta hardening then evidence-led P1. Stage7 does not authorize deployment now.

## 2. Architecture Decision Records

All ADRs **Proposed** pending review; easy-to-reverse choices may be accepted together, provider/data retention decisions need explicit owner acknowledgment.

| ADR | Context | Decision | Alternatives | Rationale / consequences |
|---|---|---|---|---|
| ADR-001 · Framework | Mobile PWA + BFF needed | Next.js App Router TS | React SPA + separate backend | One deploy, SSR and route handlers; maintain server/client boundaries |
| ADR-002 · Structure | Small founding team with8 product domains | Feature-based modular monolith | Layered monolith, microservices | Local changes, low operations; enforce import rules rather than network boundaries |
| ADR-003 · Server state | Membership changes across6 surfaces | TanStack Query + shared wishlist key | Manual Context fetch/SWR/Zustand | Less custom race/rollback code; package justified; no persisted provider cache |
| ADR-004 · Provider integration | Paid API, secrets, policy | BFF fixed Places adapter + minimal masks | Direct unrestricted browser Places calls, copied catalog | Central budget/security; adds server latency; browser Maps key separate |
| ADR-005 · Wishlist DB | Persistent private data + duplicate races | Supabase rows/RLS, unique(user,place) | LocalStorage, own auth DB | Account isolation and persistence; security tests mandatory |
| ADR-006 · Nearby | Straight-line foreground feature | Client Haversine; optional expiring restaurant coords | Routes API, PostGIS+stored GPS, repeated live lookup every radius | No GPS history/routing cost; coordinate misses remain paid and partial |
| ADR-007 · Search/map state | Filters must survive renderer switch | URL normalized search + ephemeral origin/context | Duplicated React stores, GPS in URL | Consistency and privacy; shared URL cannot reproduce precise GPS origin |
| ADR-008 · Auth | Guest browsing + personal actions | Supabase email magic-link SSR recommended | Password, multiple OAuth providers | Aligns Figma account text, fewer flows; needs email delivery and callback testing |
| ADR-009 · TikTok | Manual confirmation, no scrape/AI | Official preview + fallback, transactional private link save | Scraping, auto recognition, search API | Meets P0; deleted preview can remain link-only; public moderation separate |
| ADR-010 · Data ownership | Google content restrictions | IDs persist; limited coord cache conditional; curated data with provenance | Full restaurant catalog cache | Limits storage/cost options; source/licence recheck before launch |
| ADR-011 · MVP schema | Model has visited, scope P1 | Omit visited state UI/API/column for MVP | Reserve want_to_go/visited column | Smallest P0; future additive migration; needs PM reconciliation |
| ADR-012 · Private-link lifecycle | Removing saved place leaves link ambiguity | Cascade private links after explicit confirmation | Retain orphan links/recoverable trash | Referential consistency, no orphan UI; destructive business rule awaiting owner |
| ADR-013 · Directions | PRD permits Google or Apple Maps | Google Maps universal URL MVP | Routing engine, alternate map export | Correct destination/fallback, fewer provider-policy questions |
| ADR-014 · Public videos | PRD requires moderated public content; submission UI undefined | Approved admin-curated records; no public contribution UI MVP | New moderation dashboard/public form | Satisfies display/empty state without feature expansion; operator ownership needed |
| ADR-015 · Operations | One frontend/BFF + managed DB | Vercel + Supabase separate envs, logs + PostHog | Containers/Kubernetes/custom tracing stack | Low operations; quota/backup/region plan still must be chosen |

Reversal cost: adding optional UI primitive or changing ranking threshold is low with tests; auth provider migration, provider data ownership and deleted private links are harder to reverse. Do not ship one-way deletion behavior before copy/rule approval.

## 3. Open decisions with owner and due milestone

Dates belum disepakati, jadi due adalah gate yang dapat dieksekusi, bukan tanggal fiktif.

| ID / priority | Type / keputusan yang diperlukan | Recommendation | Proposed owner | Due |
|---|---|---|---|---|
| Q01 P0 | Blocking visual: set5:* vs2029:* | Set5:* sementara; designer tandai canonical node set | Product + Design | Before visual implementation |
| Q02 P0 | Blocking production: billing country/account terms | Verify actual billing region; conditional coordinate cache | Founder/tech lead | Before provider persistence |
| Q03 P0 | Blocking cost: monthly budget, call caps, photo/details allowance | Measure spike, approve SKU allocation, enforce hard caps | Founder + tech lead | Before live beta/API unrestricted use |
| Q04 P0 | Blocking destructive lifecycle: remove place deletes links? | Cascade with explicit confirmation; no Undo without design | PM | Before remove mutation |
| Q05 P0 | Blocking account deletion: reauth and contributions retention | One-use recent-auth proof; remove own contributions too | PM + tech lead | Before deletion active |
| Q06 P0 | Blocking product+resources: wishlist volume | Beta cap500 proposed, visible limit if accepted; otherwise complete pagination | PM | Before wishlist implementation |
| Q07 P0 | Blocking auth config: email link, domain, SMTP, expiry | One magic-link path, verified stable callback URLs | PM + tech lead | Before auth live test |
| Q08 P0 | Blocking content provenance/admin ownership | Named curator, legitimate menu/halal source; defaultNot Verified | PM/content operator | Before curated data launch |
| Q09 P0 | Blocking privacy/release: consent, minors, policies, telemetry region/retention | Explicit event allowlist, replay off; review actual data flows | Product + privacy/legal owner | Before production analytics/embed |
| Q10 P1 | Non-blocking schema mismatch: visited | P1; omit column/UI now | PM | Before schema signoff |
| Q11 P1 | Non-blocking language/name | English UI per Figma; display name1–50, no avatar upload | PM + designer | Before profile QA |
| Q12 P1 | Non-blocking category/city granularity | Fixed city/area presets + query; bounded keyword categories | PM + engineer | Stage1 spike exit |
| Q13 P1 | Non-blocking motion/performance sampling |3 cycles≤2.4s/max3 animated; real-device cohort metrics | Design + QA | Stage5/7 |
| Q14 P1 | Public submission scope ambiguity | Admin-curated public feed/empty only; request approval for user submit later | PM | Before video-tab scope freeze |
| Q15 P2 | Future | P1/P2 based on retention evidence; no social/AI/background tracking now | PM | Post-beta review |

None of these gaps prevented documenting the architecture. They prevent claiming final design parity or production configuration approval. Engineering can start only after user approval of this blueprint and applicable stage gates.

## 4. Coding readiness checklist

### Blueprint review complete

- [x] PRD FR-01–08 read and mapped to modules/API/data/tests.
- [x] Actual Figma page/screens/component names inspected read-only.
- [x] Duplicate screen sets and visited scope mismatch documented.
- [x] Architecture/stack/folders/import boundaries chosen as proposals.
- [x] API validation/errors/rate/no-store and private atomic writes specified.
- [x] Schema/uniqueness/FK/indexes/RLS/ownership defined.
- [x] Map/search/nearby/unknown-data/motion and cost fan-out explained.
- [x] Tests, environment separation, deployment and rollback planned.

### Required before affected implementation / launch

- [ ] Product/tech lead approve blueprint; decide Q01–Q14 by their milestone.
- [ ] Canonical Figma screenshots/tokens/components export legally authorized.
- [ ] Stable compatible package versions selected and locked during Stage1.
- [ ] Budget/quotas/limits approved, Google APIs/map ID enabled, keys restricted.
- [ ] Supabase environments, Auth redirects/SMTP, email-link and deletion proof verified.
- [ ] DB migrations/RLS and atomic functions implemented and real security suite passes.
- [ ] Coordinate retention/backup policy validated or persistent cache disabled.
- [ ] Official TikTok short-link and embed behavior verified under capped live smoke.
- [ ] Privacy/Terms, content sources and moderation owner ready; analytics/embed policy agreed.
- [ ] Real mobile core journeys, performance, quota fallback and account deletion tested.
- [ ] Named release/operator ownership, alerts, backup/restore and rollback evidence ready.

## 5. Architecture review outcome

**Simplicity:** one codebase/deployment, no global UI store/ORM/microservices. **Completeness:** P0 discovery→save→nearby→directions and manual import covered. **Maintainability:** import direction, typed contracts and shared rules specified. **Cost:** provider calls visible and bounded, no illegal blanket cache assumed. **Security:** RLS/ownership/URL validation and destructive-action recovery planned. **Scalability:** stateless BFF plus indexed owner queries suitable as starting architecture; no unmeasured capacity promise.

**Readiness verdict:** ready for architecture review and targeted decisions; not yet a claim of complete Figma visual approval, implemented security, measured performance, or production readiness.
