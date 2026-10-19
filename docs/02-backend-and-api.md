# 02 · Backend & API Contracts

## 1. Request pipeline

Route Handler → body/query limits → runtime schema validation → session verification bila diperlukan → distributed rate/budget check → feature server function → Supabase user-JWT query atau approved provider adapter → DTO transform → typed response.

User ID selalu diturunkan dari verified session, tidak dari request body. Validasi authorization juga dilakukan di DB melalui RLS. Route Handler tipis; search/filter/ranking tidak ditulis ulang di handler atau React page. Server Components dapat memanggil server function langsung tetapi wajib memakai guard budget yang sama; SSR tidak menjadi jalur bypass provider quota.

Semua endpoint application `Cache-Control: private, no-store`; provider request memakai `fetch(...,{cache:'no-store'})`. Tidak memakai Next persistent fetch cache, CDN cache atau service-worker cache untuk data personal/provider. Auth endpoints yang mengubah cookies juga tidak dicache. Hanya static policy/assets boleh CDN.

`Content-Type: application/json`; `X-Request-Id` dibuat server dan dikembalikan. Mutations memerlukan same-origin Origin/CSRF validation dan session cookie. Batas body default 8 KiB, batch hydration 16 KiB; reject oversized body sebelum parse. Tidak meneruskan raw provider errors, credentials, cookie, atau oEmbed HTML ke client.

## 2. Common schemas dan errors

Ini adalah contract notation, bukan application implementation.

```text
Success<T> = { data: T, meta: { requestId: string, partial?: boolean,
  unresolvedCount?: integer, candidateScope?: string, hasMore?: boolean } }
Failure = { error: { code: ErrorCode, message: string,
  fieldErrors?: Record<string,string>, retryAfterSeconds?: integer },
  meta: { requestId: string } }

PlaceId = opaque nonempty string, <=255 characters, no slash/control/whitespace
City = jakarta | tangsel
Radius = 1 | 3 | 5 | 10
Category = all | coffee | matcha | japanese | korean | indonesian | western | dessert | brunch
Sort = recommended | highest_rated | most_reviewed | nearest
Price = FREE | INEXPENSIVE | MODERATE | EXPENSIVE | VERY_EXPENSIVE
Origin = { lat: finite [-90,90], lng: finite [-180,180] }
Area = { city: City, origin?: Origin,
  bounds?: {south:number,north:number,west:number,east:number} }

PlaceSummary = { id: PlaceId, name: string|null, coordinates: Origin|null,
  rating: number|null, ratingCount: integer|null, priceLevel: Price|null,
  cuisine: string|null, areaLabel: string|null, openNow: boolean|null,
  businessStatus: string|null, photos: PhotoDescriptor[],
  googleMapsUri: https-url|null, attribution: Attribution[],
  curated: {speciality:string|null, halalStatus: HalalStatus,
    halalSource:https-url|null, halalVerifiedAt:ISO|null} }
PhotoDescriptor = { token: short-lived signed opaque value,
  width:integer, height:integer, attribution:Attribution[] }
Attribution = { source: google_maps|author|restaurant|spotted,
  displayName:string, uri:https-url|null }
WishlistItem = { id:UUID, googlePlaceId:PlaceId, createdAt:ISO, updatedAt:ISO }
```

Nama tidak tersedia menampilkan "Restaurant information unavailable", bukan place ID sebagai nama restoran. `distanceM` dihitung client dari coordinate/origin; `null` jika tidak bisa dihitung. Private `isSaved` tidak dimasukkan public PlaceSummary. HTML/URLs provider di-escape/allowlist sebelum display. Array schemas dibatasi; unexpected provider shapes menjadi adapter error, bukan implicit zero/null success.

| HTTP | Error code | Makna dan UI |
|---|---|---|
| 400 | VALIDATION_ERROR | Input salah; tandai field; tidak retry otomatis |
| 401 | AUTH_REQUIRED / SESSION_EXPIRED | Login prompt; clear private state |
| 403 | FORBIDDEN / RECENT_AUTH_REQUIRED | Aksi tidak diizinkan atau verifikasi ulang diperlukan |
| 404 | NOT_FOUND | Resource tak ada/tidak dimiliki, jangan bocorkan owner lain |
| 409 | CONFLICT | Konfirmasi snapshot berubah; duplicate save/import normal bukan error |
| 429 | RATE_LIMITED / BUDGET_EXCEEDED | Retry-After; hentikan auto retry |
| 502 | PROVIDER_ERROR | Provider invalid/down; manual retry |
| 503 | TEMPORARILY_UNAVAILABLE / PROVIDER_QUOTA | Fallback, bukan empty results |
| 504 | PROVIDER_TIMEOUT | Retry manual, writes lakukan reconciliation |
| 500 | INTERNAL_ERROR | Generic error + request ID; log sanitized |

Limits di bawah adalah **recommended beta defaults**; harus disahkan bersama budget. IP limit di distributed edge/WAF; per-user/action dan provider fan-out budget di shared PostgreSQL counter/RPC server-only. Tidak mengandalkan in-process Map pada serverless. Setiap outgoing provider call mengonsumsi budget, bukan hanya setiap incoming HTTP request.

## 3. Search dan discovery endpoints

### POST `/api/places/search`

- Public kecuali `savedOnly=true`. POST dipilih agar GPS tidak masuk URL/access logs. Payload jangan dilog.
- Body: `{q?:string, category?:Category, area:Area, radiusKm?:Radius, minRating?:4|4.5, priceLevels?:Price[], openNow?:boolean, verifiedHalalOnly?:boolean, savedOnly?:boolean, sort?:Sort}`.
- `q` trim 0–120 chars; whitespace collapse; unknown keys reject. Defaults category all, sort recommended, radius 5 bila origin tersedia. Duplicate price enum dibuang; array max 5. Bounds finite, south<north, west<east dan dalam configured launch envelope; satu area revision tidak melompati valid area. Radius filter dan Nearest memerlukan origin; return 400 LOCATION_REQUIRED bila belum ada. City centroid dapat dipakai tetapi UI harus menjelaskan "from selected area", bukan "from you".
- Result `Success<{places:PlaceSummary[], candidateCount:integer, matchedCount:integer, rankingVersion:'weighted-v1', nextCursor:null}>`; maximum 20 candidates/request pada default beta. `candidateScope` menjelaskan scope/provider cap; count bukan total seluruh kota. `hasMore` hanya true jika provider mengindikasikan lebih banyak; tidak menjanjikan pagination MVP di luar snapshot.
- Backend pilih Text Search untuk query/keyword category, Nearby Search untuk area + mapped provider type tanpa query. Tidak memanggil kedua API untuk satu action tanpa alasan. Curated lookup satu batch `IN(placeIds)`, filter dan rank satu snapshot. Saved Only memakai ID wishlist lengkap, **tidak** intersection discovery candidates saja (lihat hydration).
- Rate: 20/min/IP, 20/min/user bila login; satu active query/client, concurrency provider max 4/request. Dependencies Places + public metadata, dan DB jika saved-only. Timeout overall 8 s; 504 pada upstream timeout.
- Empty `200 places:[]` hanya ketika search/filter benar-benar selesai tanpa kandidat cocok. Partial hydrate `meta.partial=true` dibedakan dari all-empty; response error jika tidak ada data akibat seluruh dependency gagal.

### POST `/api/discovery`

- Public. Body `{area:Area, category?:Category}`. Validasi sama dengan search.
- Response `{topRated:PlaceSummary[], nearYou:PlaceSummary[], categories:Category[], candidateCount:integer}`. Satu bounded candidate search default; section Top Rated dan Near You memakai snapshot sama dan sort berbeda. Category exploration adalah navigation, tidak otomatis satu provider call per chip. Personal nearby section fetch terpisah authenticated wishlist + location hydration.
- Rate 10/min/IP; provider mask search; no-store. Data tidak cukup untuk dua section boleh overlap, jangan fabricate uniqueness atau ranking kota.

### GET `/api/places/[placeId]`

- Public. Query `section=overview|reviews`, default overview; invalid section 400. Path memakai PlaceId dan URL encoding.
- Overview response `{place:PlaceSummary, address:string|null, openingHours:string[]|null, websiteUrl:https-url|null, menuUrl:https-url|null, menuSource:string|null}`. Maksimal tiga photo descriptors awal.
- Reviews response `{rating:number|null,ratingCount:integer|null,reviews:[{rating:number|null,text:string|null,authorName:string,authorUri:https-url|null,authorPhotoUri:https-url|null,publishedAt:ISO|null,attribution:Attribution[]}],googleMapsUri:https-url|null}`; review subset API, bukan seluruh ulasan. Review tab error tidak menghapus overview.
- Rate overview 30/min/IP; reviews 10/min/IP; each provider-call budget checked. Dependencies Place Details + curation; no-store; 404 untuk place invalid/not found, 503 quota, 504 timeout.

### GET `/api/places/[placeId]/photo?token=…&width=…`

- Public; token server-signed berisi allowed photo resource name + placeId + expiry 5 menit; tidak menerima raw remote URL atau arbitrary resource path. Width enum `320|640|960`; reject expired/wrong-place token 400. Token mengizinkan display, bukan cache license.
- Return image bytes, content-type provider yang diizinkan, `Cache-Control: private,no-store`; errors JSON bila image belum mulai dikirim. Jangan redirect ke URL dengan server key. Streaming/capped upstream max 5 MB dan 5 s; downstream abort membatalkan upstream.
- Rate 60/min/IP serta global photo budget. No image optimizer disk/CDN cache untuk Google photos. Attribution berada pada PhotoDescriptor dan tampil dekat image. [Photo names dapat kedaluwarsa dan tidak boleh dicache sebagai catalog](https://developers.google.com/maps/documentation/places/web-service/place-photos).

## 4. Wishlist dan profile endpoints

| Endpoint | Auth / input | Success response | Validation / error / dependency / limit |
|---|---|---|---|
| GET `/api/wishlist` | User; no query | `{items:WishlistItem[]}` complete ID membership, sorted created desc/id desc | DB own rows; 60/min/user; no provider hydration; no-store |
| POST `/api/wishlist` | User; `{googlePlaceId}` | `{item:WishlistItem, created:boolean}`; 201 created, 200 duplicate | Resolve ID live if not previously validated in current request context; no arbitrary name/coords accepted; DB unique ensures idempotence; 30/min/user + upstream budget |
| DELETE `/api/wishlist/[placeId]` | User; no body | `{removed:boolean,removedLinkCount:integer}` 200 even absent | Own row only; cascades private links per recommended lifecycle; DB transaction; 30/min/user |
| POST `/api/wishlist/hydrate` | User; `{placeIds:PlaceId[], mode:'coordinates'|'cards'}` | `{resolved:[{placeId,coordinates,expiresAt?,place?:PlaceSummary}],unresolved:[{placeId,reason:'not_found'|'quota'|'timeout'|'unavailable'}]}` | IDs unique max20/call, must all be owned else404; only server-resolved coords; global fan-out guard; 10/min/user; 4 concurrent upstream calls max; no-store; partial status metadata |
| GET `/api/profile` | User; no input | `{id,displayName,avatarUrl,preferredCity,nearbyRadiusKm,privacy:{wishlist:'private',links:'private',locationHistory:false}}` | Own row; idempotent lazy create if signup trigger missing; 60/min/user |
| PATCH `/api/profile` | User; `{displayName?,preferredCity?,nearbyRadiusKm?}` | Same profile DTO | Name 1–50 Unicode code points after trim/NFC normalization, city enum, radius enum; at least1 field; reject id/avatar/privacy edits; 20/min/user; DB |
| DELETE `/api/account` | User + recent auth; `{confirmation:'DELETE'}` | `{deleted:true}` | Origin/CSRF; Auth Admin hard delete + cascades; 3/hour/user; failure never show success; server privilege isolated |

Wishlist complete ID list awal direkomendasikan sampai 500 saved places/account untuk beta, **belum business limit yang disetujui**. Jangan silently truncate. Bila PM menolak limit, implementasikan paginated membership dan explicit loading completeness sebelum nearby total. Resource bounds ini blocker sebelum beta, bukan alasan menghilangkan data pengguna. Hydrate coords untuk seluruh ID secara progressive 20/batch; cards hanya visible page, default 20, tanpa N details pada initial Explore.

Raw saved-place inserts via DB tidak mempercayai coordinates/content dari client. BFF live-validation menghindari garbage IDs; constraints/RLS memastikan garbage tidak membuka data lain walaupun malicious user melewati BFF. Kegagalan Place ID resolution tidak menghapus saved row yang sudah ada.

## 5. TikTok endpoints dan atomic save

| Endpoint | Input / response | Rules |
|---|---|---|
| POST `/api/tiktok/preview` | User `{url:string}` → `{canonicalUrl:https-url,videoId:string|null,preview:{title:string|null,creatorName:string|null,creatorUrl:https-url|null,embedUrl:https-url|null}|null,status:'available'|'unavailable'}` | Max URL2048; valid host/path; official oEmbed only; 10/min/user, 20/min/IP; 5s timeout. Invalid URL400; validated-but-unavailable returns200 with fallback; no raw HTML |
| POST `/api/tiktok/imports` | User `{googlePlaceId,tiktokUrl,confirmed:true}` → `{place:WishlistItem,link:{id,googlePlaceId,url,createdAt},createdPlace:boolean,createdLink:boolean}` | Required explicit confirmation; normalize/resolve URL server-side again; place resolution; transaction described below; 10/min/user; 201 when link newly created else200 |
| GET `/api/places/[placeId]/videos` | Public; optional auth → `{publicVideos:[{id,url,creatorName?,source:'approved'}],personalLinks:[{id,url,createdAt}]}` | Own private links only, public approved URLs from table; no submitting user UUID in public DTO; 30/min/IP; public/private combined response always no-store |
| DELETE `/api/tiktok/links/[id]` | User UUID path → `{removed:boolean}` | Own link only, does not remove saved place; absent/non-owned returns same removed=false; 20/min/user; DB |

`save_import` DB function melakukan satu transaction: assert auth.uid, insert saved_place ON CONFLICT DO NOTHING; select own saved row; insert normalized link with `(user_id,google_place_id,tiktok_url)` uniqueness; return authoritative entries. Bila link gagal, seluruh transaction rollback, termasuk tempat yang baru dibuat. Function security-invoker dengan RLS; caller tidak memasok user_id. RPC mengulangi format URL guards dasar dan memerlukan confirmed boolean; provider/network validation tetap di BFF. Duplicate retry mengembalikan row sama, tidak overwrite personal data. Link + place existing tidak dipublikasikan.

Tidak menyediakan public submissions endpoint MVP sampai scope/owner moderasi disahkan. Public video table dapat diisi manual admin terotorisasi; pending/rejected tidak tampil. Kontrak moderation future terpisah dari import private.

## 6. Auth routes

- Login/sign-up memakai official Supabase Auth SDK flow email magic link, bukan custom credential API. Set redirect allowlist; response generic agar tidak membocorkan registered email. Resend cooldown 60 detik adalah default rekomendasi; provider rate limits tetap berlaku.
- GET `/auth/callback?code=…&next=…`: exchange PKCE/code, set refreshed cookies; only allowlisted relative next routes. Expired/invalid code → AuthError dengan resend; tidak melog code/token. New account profile dibuat idempotent.
- POST `/api/auth/logout`: verified same-origin request; Supabase signOut dan cookie clear; `{signedOut:true}`. 10/min/user; no-store. Clear query/analytics client meskipun provider outage, tetapi jelaskan kegagalan revoke global session bila terjadi.
- Verifikasi cookie/JWT dengan supported SSR auth method; jangan mempercayai `getSession()` client data sebagai authorization. Untuk delete pakai fresh user verification dan recent sign-in evidence, bukan token refresh time. [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/nextjs).

Recommended deletion proof: saat user meminta Delete, server membuat signed intent cookie HttpOnly/Secure/SameSite=Lax, bound user ID + random nonce + expiry10menit, lalu mengirim fresh magic link. Callback harus sukses menukar one-time code, memverifikasi user yang sama serta intent cookie, kemudian menerbitkan signed deletion-proof cookie berlaku5menit. DELETE memverifikasi session user via Auth server, Origin/CSRF, proof dan exact confirmation; nonce dikonsumsi atomik sekali melalui server-only counter primitive sebelum Auth Admin call. Jangan menerbitkan proof hanya dari query next; jangan menerima access-token refreshed timestamp sebagai reauthentication. Kegagalan deletion memerlukan proof baru untuk retry tetapi private data tetap terlihat sampai account benar-benar dihapus. Spike memverifikasi supported magic-link callback behavior, cookie dan email-link expiry; jika tidak dapat dibuktikan, destructive action tetap disabled sampai flow direvisi.

## 7. Endpoint-wide failure behavior

Provider credentials missing → startup configuration validation, bukan request fallback ke dummy data. Provider 429 mapped503 PROVIDER_QUOTA (bukan melaporkan user rate limit). App budget429 berbeda. GET-like reads boleh satu retry transient dengan jitter hanya bila budget mengizinkan; tidak retry 4xx/quota. Search requests yang canceled tidak mengubah visible result; previous result boleh tetap terlihat berlabel sedang diperbarui. DB failure menjaga UI rollback; tidak mengubahnya menjadi empty state.
