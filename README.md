# SPOTTED

Save what you crave. Find it nearby.

## Status

Fondasi lokal Next.js App Router + React + TypeScript tersedia. `/explore` menampilkan 37 tempat Jakarta dari pembacaan halaman Google Maps publik: foto tempat, rating, jumlah ulasan dan jam buka yang tersedia. Search/kategori/rating/sort berbasis URL memakai data nyata ini. Google Places API berbayar dan akun belum diaktifkan.

Detail restoran tersedia di `/restaurant/kedai-ramen-sore`, dengan galeri, Menu, Google Reviews, TikTok, dan Save yang tersinkron dengan Explore selama kunjungan. Lihat [implementasi detail dan hasil QA](docs/10-restaurant-detail-implementation.md).

`/map` memakai Leaflet/OpenStreetMap yang bisa digeser dan di-zoom, dengan 37 pin tempat nyata, pin GPS/manual yang bisa digeser, serta radius 1/3/5/10 km. Lihat [pin pribadi dan radius](docs/20-personal-map-radius.md). `/wishlist` dan `/wishlist?view=map` masih memakai prototype nearby sebelumnya. Lihat [map interaktif dan data review](docs/17-headless-reviews-interactive-map.md).

`/profile` menyediakan preferensi sementara, `/filters` menyaring data Google di Explore dan fixtures pada jalur Map. Klik pin membuka nama/rating dan link detail. Lihat [Profile, selected-place previews, Filters dan QA](docs/12-profile-previews-filters.md).

`/import` menghubungkan link TikTok ke restoran contoh, `/login` menyediakan sign-in simulasi, dan `/import/success` menampilkan hasil save selama sesi. Lihat [Import, sign-in preview dan QA](docs/13-import-login-preview.md).

`/login/sent` menyediakan konfirmasi/resend simulasi, `/saved/[placeId]` menampilkan hasil save dari detail, dan `/sort` mengurutkan hasil pencarian. Lihat [Email Sent, Saved, Sort dan QA](docs/14-email-saved-sorting.md).

`/catalog` mengarah ke Explore; tidak ada UI pilot/metadata OSM. `/api/catalog` menyediakan snapshot Google schemaVersion2. Detail `/restaurant/osm-<id>` mengikuti layout editorial Figma dan menampilkan Overview, jam mingguan, lima review Google per tempat dan Get Directions. Lihat [data Google dan hasil verifikasi](docs/16-google-explore-data.md). [Pilot OSM awal](docs/15-jakarta-data-pilot.md) disimpan sebagai riwayat;32 dari40 seed cocok dengan cabang Google dan lolos pemeriksaan foto. Lima tempat tambahan diverifikasi pada 26 Oktober 2026; lihat [perluasan data Jakarta](docs/18-jakarta-data-expansion.md). TikTok existing tidak ditambah data baru.

Yang disiapkan:

- Tailwind CSS dan token warna dari catatan design handoff; font final mengikuti screen canonical nanti.
- Konfigurasi shadcn/ui dan helper `cn`; komponen ditambahkan hanya saat dipakai.
- Struktur fitur, server/client Supabase helpers, serta TanStack Query provider.
- Validasi environment saat Next memuat konfigurasi; kredensial kosong berarti belum terhubung.
- Vitest, Playwright desktop Chromium dan Mobile Safari/WebKit, serta GitHub Actions CI.
- Konfigurasi Supabase lokal dan folders migration/test, tanpa schema produk.

## Menjalankan lokal

Gunakan Node.js 24 dan npm. Dependency versi exact dikunci di `package-lock.json`.

Script dev/build memakai opsi Webpack yang didukung Next.js. Turbopack pada lingkungan setup ini gagal membuka IPC port internal; ini pilihan tooling lokal, bukan perubahan arsitektur aplikasi.

```sh
nvm use
npm ci
cp .env.example .env.local
npm run dev
```

Lewati `cp` bila `.env.local` sudah ada supaya kredensial tidak tertimpa. Buka [localhost:3000](http://localhost:3000); root akan menuju `/explore`. App shell tidak memerlukan akun atau API key. Health endpoint [localhost:3000/api/health](http://localhost:3000/api/health) hanya menyatakan proses aplikasi hidup, bukan konektivitas database/provider.

## Environment dan integrasi

`.env.local` diabaikan Git; `.env.example` hanya berisi nama variabel/default aman. `NEXT_PUBLIC_*` masuk bundle browser dan tidak boleh menyimpan server secrets.

Supabase client baru dapat dipakai ketika URL dan publishable key diisi bersama. Untuk stack lokal, lihat [supabase/README.md](supabase/README.md). Untuk project cloud yang sudah ada, gunakan kredensial development/staging milik project itu. Jangan arahkan preview ke database production.

Google Places API, TikTok preview, dan PostHog belum dihubungkan. Peta jalan memakai tile OpenStreetMap tanpa API key. `PAID_APIS_ENABLED=false` dan daily call limit 0 adalah default. Mengubah flag ini tidak otomatis mengimplementasikan atau menjalankan API: adapter, distributed limit enforcement, dan provider smoke test adalah pekerjaan fitur berikutnya. Jangan menganggap environment guard sebagai billing cap yang sudah aktif.

Belum ada project Vercel/Supabase cloud yang dibuat atau di-link. Saat hosting disiapkan, verifikasi tujuan team/project terlebih dahulu; jika memakai `vercel env pull .env.local`, backup file lokal yang sudah ada karena perintah tersebut dapat menimpanya. Setup lokal ini tidak memerlukan linkage Vercel.

## Perintah verifikasi

```sh
npm run check
npm run build
npx playwright install chromium webkit
npm run test:e2e
```

Playwright menjalankan hasil production build pada `127.0.0.1:3100`, jadi jalankan build terlebih dahulu. Port ini harus tersedia. Browser tests memeriksa Explore, filter/search, preview wishlist, dialog/fokus keyboard, aset/layout, health/no-store, 404 dan client errors; tidak memanggil API berbayar. Proyek `mobile-safari` memakai emulasi iPhone/WebKit, bukan bukti pengujian perangkat iPhone fisik.

`npm run lint`, `npm run typecheck`, `npm run test`, `npm run format:check` bisa dijalankan terpisah. `npm run format` merapikan source/config baru; dokumen blueprint utama dikecualikan agar tidak berubah hanya karena setup tooling.

CI yang disiapkan menjalankan check, production build, dan E2E tanpa secret/provider eksternal. Workflow baru berjalan setelah source berada di repository GitHub; belum ada push atau deployment pada setup ini.

## Struktur dan batas modul

```text
src/app/                 routes, layout, providers dan route handlers
src/features/            explore, search, restaurants, maps, wishlist, tiktok, auth, profile
src/components/ui/       primitives dan helper shadcn
src/components/layout/   app shell bersama saat implementasi UI
src/config/              environment schemas dan configuration
src/lib/                 Supabase dan Query infrastructure
src/styles/              global CSS dan token awal
supabase/                konfigurasi lokal; migrations/tests belum berisi domain schema
tests/                   unit, route integration, browser E2E
docs/                    blueprint dan catatan implementasi
```

ESLint membatasi import alias dari shared infrastructure/UI ke features/routes dan mencegah restaurants mengimpor wishlist/maps/TikTok. Aturan ini melengkapi review; belum merupakan dependency graph checker untuk relative imports. Gunakan `@/` untuk import lintas modul. `server-only` menjaga server helper tidak masuk client bundle. Belum ada admin/service-role client.

## Tahap berikutnya

Lanjutkan satu vertical slice: **Explore → Detail → Login → Save → Wishlist**. Node Explore sudah dipilih pengguna; referensi screen lain masih perlu ditetapkan. Sebelum remove/delete data persisten, pastikan lifecycle link; sebelum paid API aktif setujui budget/terms dan implementasikan enforcement. Auth callback, cookie-refresh proxy, database types/RLS/migrations dan live provider checks belum dibuat.

Blueprint lengkap: [docs/README.md](docs/README.md). Catatan hasil setup dan batas verifikasi: [docs/08-foundation-setup.md](docs/08-foundation-setup.md).
