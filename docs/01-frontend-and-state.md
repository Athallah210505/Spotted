# 01 · Frontend, Figma Mapping & State

## 1. Production folder structure (rencana, belum dibuat)

```text
src/
  app/
    layout.tsx                    # server shell, client provider island
    (browse)/
      explore/page.tsx
      search/page.tsx
      map/page.tsx
      restaurant/[placeId]/page.tsx
    (personal)/
      wishlist/page.tsx
      import/page.tsx
      profile/page.tsx
      profile/privacy/page.tsx
      profile/account/page.tsx
    auth/login/page.tsx
    auth/callback/route.ts
    terms/page.tsx
    privacy/page.tsx
    page.tsx                      # redirect /explore
    error.tsx
    not-found.tsx
    manifest.ts
    api/                          # endpoint tree sesuai 02
  features/
    restaurants/
      contracts.ts                # DTO, attribution, nullable fields
      restaurant-card.tsx
      restaurant-detail.tsx
      places.server.ts            # domain orchestration
    search/
      search-controls.tsx
      search-results.tsx
      search-state.ts             # URL parser / canonical serializer
      ranking.ts
      search.server.ts
    explore/explore-feed.tsx
    maps/
      map-view.tsx
      map-canvas.tsx
      marker-state.ts
      distance.ts
      location-provider.tsx
    wishlist/
      wishlist-view.tsx
      save-button.tsx
      queries.ts
      schema.ts
      wishlist.server.ts
    tiktok/
      import-flow.tsx
      url.ts
      schema.ts
      tiktok.server.ts
    auth/session.server.ts
    auth/login-form.tsx
    profile/profile-form.tsx
    profile/profile.server.ts
  components/ui/                  # business-agnostic primitives
  components/layout/              # AppShell, BottomNavigation
  lib/
    google/places.server.ts        # HTTP adapter + fixed masks
    google/photos.server.ts
    tiktok/oembed.server.ts
    supabase/server.ts
    supabase/browser.ts
    supabase/admin.server.ts       # deletion / provider infra only
    supabase/database.types.ts     # generated from schema
    http/errors.ts
    http/limits.server.ts
    analytics/events.ts
  config/cities.ts                 # sourced city bounds/centroids
  config/categories.ts
  config/env.server.ts
  styles/globals.css
  proxy.ts                        # auth cookie refresh per supported Next version
supabase/migrations/              # saat implementasi disetujui
supabase/tests/
tests/unit/
tests/integration/
tests/e2e/
public/                           # authorized assets, manifest icons, offline shell
docs/
```

Schema input berada di fitur pemiliknya; type hasil provider tidak menjadi type domain. Constants yang hanya dipakai satu fitur tetap di fitur. `lib/http` untuk HTTP saja, bukan utility dumping ground. Tidak membuat global `types/` berisi semua hal. File server mengimpor `server-only` saat implementasi.

Import direction: `app → features → lib/config`; `features → components/ui`; `components/ui` tidak mengimpor fitur. `lib` tidak mengimpor `features`. Cross-feature import hanya leaf contract/component yang tercantum di atas: search/explore/maps/wishlist boleh memakai restaurant DTO/cards; restaurants tidak mengimpor wishlist atau maps. Page composition menginjeksi SaveButton ke card/detail agar tidak terjadi restaurants ↔ wishlist. Import flow memakai search dan wishlist server operations; operations tersebut tidak mengimpor tiktok. Hindari barrel export yang mencampur client/server. ESLint restricted imports menegakkan boundary.

## 2. Screen-to-route mapping

Semua node di tabel berada pada [Figma page 3:2](https://www.figma.com/design/Sxg2J06MrgCE0ywAviBDNu/SPOTTED?node-id=3-2). Set `5:*` sementara; duplicate `2029:*` harus diputuskan owner (lihat evidence).

| Figma node / screen | Route dan frontend module | Rendering / interaksi |
|---|---|---|
| `5:6` Explore | `/explore` · explore + restaurants | Server shell/first manual-city feed; Client search, category, save islands |
| `5:121` Search | `/search?...&view=list` · search | Server shell; shared client results/query across list/map |
| `10:1178`, `10:1226` SearchMapResults/Preview | `/search?...&view=map` | Same normalized search/query key; dynamic map; sheet local |
| `5:206`, `10:1417`, `10:1473` Detail/photos | `/restaurant/[placeId]` | Server overview streamed; Client carousel max 3 initial photos, save and tabs |
| `5:1033` Reviews, `5:1074` Videos | same detail URL | Tab local; review and embeds fetched only when opened |
| `5:278`, `5:695`, `5:776`, `10:1358` Map/Preview/Nearby/Refreshed | `/map?...` · maps + search | Client MapCanvas; regular map uses same search-state parser |
| `5:373`, `5:456`, `15:1210`, `15:1234`, `9:1351` Wishlist list/map/radii | `/wishlist?view=list|map` | Server auth resolution; client private query; radius from profile |
| `5:539`, `5:574`, `5:960`, `5:1002` Import/Confirm/Save/Success | `/import` · tiktok | One client step flow, not four application routes; login required |
| `5:620`, `9:1297` Profile/EditProfile | `/profile` | Server user/profile bootstrap; Client validated form |
| `9:1261`, `9:1286`, `9:1309`, `9:1318` Privacy/Account/Delete/Deleted | `/profile/privacy`, `/profile/account` | Fixed privacy policy; delete confirmation dialog; success returns guest Explore |
| `5:932`, `5:1119`, `9:1325` Login/EmailSent/AuthError | `/auth/login`, `/auth/callback` | Client email entry/status; server PKCE/code callback |
| `5:855`, `5:1181` Filters/Sort | Search/map overlay | Local draft filters, apply atomically to URL; no new route needed |
| `9:1132`, `9:1344` Location/Tangsel | Location sheet on current route | Manual city/area or explicit GPS request |
| `5:1144`, `9:1161`, `9:1171`, `9:1180` Saved/SaveError/Remove/Removed | Local state/dialog/toast | Shared mutation state; no fake success route |
| `9:1253` Directions | External navigation chooser/fallback | No routing engine; user action opens target maps URL |

Guest `/wishlist` renders WishlistGuest, bukan private fetch yang gagal lalu mengaku kosong. Guest `/profile` menawarkan login. Guest `/import` redirects ke login dengan relative `next=/import`.

## 3. Hierarki component sesuai elemen aktual

```text
AppShell (server)
  BottomNavigation (client active-route island)
  QueryProvider + LocationProvider (client, state sempit)
  ExplorePage
    SearchField → LocationSelector → Brand / headline
    CategoryRail → DiscoverySection → RestaurantCard + injected SaveButton
    NearbyWishlistSection → CompactRestaurantCard
  SearchPage
    SearchField / FilterSheet / SortSheet / ViewSwitch / ActiveFilterChips
    SearchResults → RestaurantCard | MapView
  RestaurantDetailPage
    RestaurantGallery / GoogleRating / RestaurantOverview / HalalEvidence
    RestaurantTabs → MenuTab | GoogleReviewsTab | TikTokTab
    RestaurantActions → SaveButton + DirectionsLink
  MapPage / SearchMapView / WishlistMapView
    MapControls / MapCanvas / SearchThisAreaButton
    RestaurantMarker / CurrentLocationMarker / RadiusCircle
    RestaurantPreviewSheet → CompactRestaurantCard + SaveButton
  WishlistPage
    SavedCount / ViewSwitch / RadiusSelector / WishlistList | WishlistMap
  ImportPage
    TikTokUrlField / PreviewOrFallback / RestaurantSearch / Confirm / SaveResult
  ProfilePage
    DisplayNameField / PreferredCity / RadiusSelector / Privacy / AccountActions
```

Shared Figma instances teramati: SearchField, LocationSelector, RestaurantCard, CompactRestaurantCard, GoogleRating, Badge, Tabs, ViewSwitch, BottomNavigation, Toast. Category rail dan page headers boleh berupa komposisi sederhana, tidak harus component framework baru. Font, shadows, safe area, sticky search dan photo geometry berasal dari set canonical; shadcn primitives diberi token yang sama. Jangan render jam status `9:41`, label fixture, atau schematic map sebagai data production.

## 4. Feature-to-architecture matrix

Semua baris P0, kecuali public contribution yang belum dipastikan. Module owner engineering adalah rekomendasi peran, bukan nama anggota tim.

| PRD / user dan tujuan | Frontend, trigger dan data | Backend / DB / provider | Auth, states, editable, QA dan metric |
|---|---|---|---|
| FR-01 Food Explorer menemukan kandidat | Explore; city/category/search; card DTO | search service; curated join; Places | Public; loading/empty/provider error; city/category/sort editable; city refresh QA; explore→detail |
| FR-03 Casual hunter mempersempit pilihan | Search controls; normalized query + location | validated search; filter/rank candidates | Public, Saved Only login; unknown≠negative; chip/reset/list-map QA; search task completion |
| FR-02 Explorer mengecek restoran | detail gallery/tabs; place ID | detail service; curated metadata + approved videos; Places | Public overview, private links owner only; per-tab missing/error; only Save editable; detail/directions QA; detail→save/directions |
| FR-04 Explorer mencari di peta | map/preview; bounds/selected ID | search service; no pan-trigger requests | Public; SDK loading/failure/location denied; viewport editable; search-area QA; map→detail |
| FR-05 Account owner mengingat tempat | shared SaveButton/list/map; IDs, radius, coords | wishlist operations; saved_places + coordinate cache | Login; rollback/empty/partial coordinates; add/remove/radius editable; RLS+race QA; wishlist revisit |
| FR-06 Account owner menghubungkan rekomendasi | URL→preview→manual confirmation | oEmbed adapter + atomic import RPC; saved links | Login; invalid/unavailable/duplicate/retry; URL/place editable before save; SSRF+atomicity QA; import completion |
| FR-07 Guest/account owner menyinkronkan akun | auth/profile/privacy | Supabase Auth, profiles, deletion service | Browse public; auth required personal; email errors/session expiry; name/city/radius editable; isolation QA; activation/retention |
| FR-08 Explorer berangkat | DirectionsLink; target ID/current place info | safe external URL construction; no DB write | Public; external fallback; target not editable; destination QA; directions click-through |

Design menyiapkan state sesuai inventory, attribution slot, accessible selected/nearby marker, keyboard/focus behavior. Engineering mengimplementasikan kontrak, semua fallback, persistence, rate limits dan QA baris terkait. Metrics tidak menganggap directions click sebagai bukti kunjungan fisik.

## 5. Single source of truth state

| Kategori | Owner | Persistence dan rule |
|---|---|---|
| Places candidates/detail/reviews | TanStack Query in-memory session | Tidak dipersist ke disk; provider responses no-store; clear on session end. Dedup request saat aktif; tidak menambahkan TTL cache provider tanpa policy approval |
| Wishlist membership | Query `['wishlist', userId]` | Server saved_places authoritative; satu complete ID snapshot di client; paginated card hydration terpisah |
| Profile/preferences | Query `['profile', userId]` + profiles | Radius defaults 5; authenticated preference tidak diduplikasi di localStorage |
| Personal TikTok links | Query `['links', userId, placeId]` | DB private; clear saat logout/identity berubah |
| Search/filter/sort/view/manual city | URL parser dan serializer | `q,city,category,rating,radius,price,open,halal,saved,sort,view`; defaults omitted; canonical key excludes view |
| Current GPS / manual map area center | Ephemeral LocationProvider | No GPS in URL, analytics, localStorage, DB; map area shared in current app session |
| Marker selection, tabs, sheet, draft forms | Closest React component | No separate global store; close invalid selected place after result replacement |
| Guest city/radius default | LocalStorage preference only | No place content or location coords; explicit profile settings override after login, no silent merge |

Search URL cukup mereproduksi city/filter, bukan GPS origin. Reload current-location query meminta pemulihan lokasi lewat user action; UI tidak berpura-pura radius lama masih valid. Manual map coordinates juga ephemeral untuk menghindari lokasi pribadi tersebar melalui link; browser Back dapat memakai session location state, hard reload kembali ke manual city fallback dengan pemberitahuan.

## 6. Search/map synchronization

`SearchState` dinormalisasi satu fungsi di client dan server. `view` hanya mengganti renderer. Shared query key: `['places', canonicalSearchWithoutView, areaRevision, language]`. `areaRevision` berubah hanya saat city/area/GPS yang dipakai dikonfirmasi atau Search This Area ditekan, bukan ketika kamera bergerak. Request body membawa lokasi ephemeral; URL menyimpan filters saja. Saved Only query juga memakai userId agar tidak lintas akun.

Apply filters mengganti URL sekali; Cancel membuang draft. Query input debounce 400 ms, Enter langsung commit, typing memakai replace agar history tidak penuh. Sort mengurutkan snapshot kandidat yang sama. Abort request lama dan abaikan response dengan revision lama. List/Map switching tidak fetch ulang selama snapshot masih aktif; session content dibuang ketika search context ditinggalkan sesuai kebijakan integrasi.

## 7. Wishlist mutation dan rollback

1. Semua surface membaca membership dari query wishlist yang sama; card DTO tidak memiliki copy `isSaved` yang bisa stale.
2. Guest Save membawa pending place ID dan relative return URL ke login (sessionStorage, expiry 15 menit; tanpa GPS). Setelah login berhasil, jalankan idempotent save untuk intent eksplisit tersebut lalu hapus pending intent. Cancel/expired link tidak melakukan save.
3. Authenticated Save/Remove menonaktifkan mutation tempat yang sama di seluruh surface selama in flight; beda tempat tetap boleh bersamaan.
4. Cancel membership refetch, snapshot membership **hanya tempat itu**, optimistic update satu membership map, render semua cards/markers langsung.
5. Server idempotent insert/delete. Success merge hasil tempat itu; failure restore hanya entry itu dan tampilkan toast dengan Retry. Jangan rollback seluruh wishlist sehingga menimpa perubahan lain.
6. Jika timeout menghasilkan hasil tak pasti, refetch authoritative membership sebelum retry. Mutations tidak otomatis diulang oleh transport.
7. Invalidate private links untuk place terkait setelah import/remove, serta saved-filter projection. Public search/detail data tidak perlu fetch ulang hanya untuk mengganti bookmark.
8. On logout/401: cancel private requests, clear private Query cache, pending mutations, embeds dan intent; remove identity PostHog. Tab lain sync membership melalui refetch-on-focus dan auth events; tidak perlu realtime subscriptions MVP.

Optimistic update memakai lifecycle cache/mutation yang didukung [TanStack Query](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates).

## 8. Rendering, PWA, dan accessibility

Server rendering: shell, first manual-city result, detail overview, policy pages. Client: maps/GPS, search controls, tabs, auth form, optimistic save. SSR result menghidrasi query dengan key yang sama, hindari duplicate initial fetch. Jangan server-fetch current GPS yang belum ada.

Map SDK/clusterer dan TikTok embed dimuat dinamis saat view/tab dibuka; `ssr:false` ditempatkan di Client wrapper. Skeleton berukuran stabil; Suspense per data region; error review tidak menjatuhkan detail. Detail API call dan curated metadata dapat parallel, bukan self-HTTP waterfall.

PWA: manifest, HTTPS, icon yang disetujui, installability sesuai browser. Optional service worker hanya shell/static assets dan offline fallback; `/api`, auth, provider images/content, dan private data network-only. Tidak menjanjikan offline wishlist/map atau queued writes. Offline Save mengembalikan rollback dan pesan koneksi.

Sheet/dialog punya heading, focus trap, Escape dan return focus. Tabs keyboard; selected/nearby memakai label/shape selain warna. Marker keyboard-selectable dan daftar adalah alternatif peta. Motion terbatas dan reduced-motion; controls minimal target sentuh 44 px; safe area dan sticky actions tidak menutup attribution. Verifikasi di 375/390/430 px serta text zoom 200% saat implementasi.
