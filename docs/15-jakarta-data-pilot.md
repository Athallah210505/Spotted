# Jakarta data pilot

25 Oktober 2026. Implementasi pilihan pengguna: OpenStreetMap sebagai seed dan Scrapling untuk enrichment website terpilih, tanpa layanan/API berbayar. Pilot dapat dilihat melalui Explore → **Lihat pilot data Jakarta (OSM)** → `/catalog`; JSON publik ada di `/api/catalog`.

## Current functionality and evidence

Homepage `/explore` kini menampilkan dua kartu tempat nyata sebelum bagian preview: Cafe Batavia dan Gulai Tikungan Blok M. Foto Wikimedia, credit, license dan batas konteks sumber tersimpan di `catalog-media.ts` serta `public/catalog/README.md`. Foto Cafe Batavia adalah arsip bangunan; foto Gultik mewakili kuliner kawasan, bukan penjual tertentu. Kartu mengikuti foto dengan identity panel yang overlap, yellow CTA dan typography SPOTTED existing (ENERGY1/RHYTHM1/MOTION1). Foto berfungsi mengenali tempat, bukan bukti kondisi/menu saat ini. Search/filter preview existing tetap terpisah; katalog memiliki pencarian data nyata.

Koreksi alur: foto dan isi kartu homepage membuka `/restaurant/osm-<node-id>` dalam aplikasi, default ke **Overview**. Katalog juga memiliki link detail untuk seluruh40 titik. Detail menyediakan Overview (alamat/cuisine/jam buka), Menu (link sumber jika tersedia), Reviews (rating dan link sumber atau empty state), serta tombol Google Maps. Tab tersimpan di URL, unknown tab kembali ke Overview, unknown place memberi404, dan Back kembali ke Explore atau katalog sesuai entry. Preview restaurant routes existing tetap memakai data contoh sebelumnya.

Cafe Batavia menampilkan rating **4.8/5 dari38 reviews di Chope**, sesuai halaman sumber yang diakses25 Oktober2026: [Chope Cafe Batavia](https://www.chope.co/jakarta-restaurants/restaurant/cafe-batavia-jakarta-kota-tua-taman-sari?lang=en_US). Ini snapshot halaman sumber, bukan rating Google/live; jumlah dan nilainya bisa berubah. Tidak menyalin teks review. Rating terpisah di `catalogRatings`, dengan provider, sourceUrl dan checkedAt. Gultik dan tempat lainnya yang belum memiliki sumber rating tampil N/A/Belum ada rating, bukan nol. `/api/catalog` menambahkan nullable `sourceRating` dan `detailUrl` tanpa mengubah snapshot OSM.

Seluruh40 titik di API memiliki Google Maps URL berdasarkan koordinat OSM, memakai Maps URLs `api=1`; tombol pembuka Maps kini ada di halaman detail. Ini membuka pin lokasi, bukan klaim Google Place ID atau Google listing yang sudah dicocokkan. Tidak ada Google API key/paid request. Sumber: [Google Maps URLs](https://developers.google.com/maps/documentation/urls/get-started). Snapshot tanpa foto tetap tampil tanpa mengarang gambar. Importer tidak menimpa manifest foto/rating yang direview manual.

Snapshot berisi **40 named OSM nodes**,10 per area: Blok M, Menteng, Kelapa Gading dan Kota Tua. Empat kotak sampel sekitar1km² didefinisikan dalam importer. Dari104 named food nodes yang tersedia pada ekstrak tersebut, dipilih berdasarkan jumlah tag address/cuisine/hours/website yang terisi lalu ID.11/40 memiliki tag alamat yang mungkin parsial;6/40 memiliki website. Ini bukan jumlah restoran Jakarta atau klaim coverage kota.

Overpass publik tidak berhasil diakses pada pengambilan awal (406/timeout/504). Seed nyata diambil dari empat small map extracts melalui [OSM API](https://wiki.openstreetmap.org/wiki/API_v0.6#Retrieving_map_data_by_bounding_box:_GET_/api/0.6/map), bukan hasil pencarian Google atau nama buatan. OSM API bukan backend discovery untuk traffic aplikasi: importer dijalankan manual untuk pilot kecil; halaman hanya membaca snapshot. Untuk refresh besar, gunakan regional extracts atau penyedia yang sesuai kebijakan/beban, bukan tile-by-tile scraping lewat endpoint editing.

Cafe Batavia (`node/4245907143`) memiliki website sumber `https://cafebatavia.com/`. Scrapling0.5 parser berhasil mengekstrak judul **Batavia** dan tautan **#section-menu** dari HTML yang benar-benar diambil. Tidak ada item/harga menu yang diekstrak atau ditebak. Robots.txt mengembalikan404 dan homepage200; kedua status serta checkedAt disimpan. Ini bukan pernyataan izin tanpa batas atau merchant verification. Metadata factual saja; tidak menyalin foto, review atau seluruh artikel/menu.

TUKU memberi429 pada percobaan inspeksi manual. Tidak di-retry atau dibypass; website itu tetap hanya link yang tercantum di OSM dan tidak diberi enrichment palsu. Fetcher dalam kode memiliki satu target website yang direview, tidak otomatis mengikuti semua URL OSM, tidak mengikuti redirects, memeriksa robots, dan berhenti pada denial/rate limit. Tidak menggunakan paid proxy, captcha solver, Firecrawl cloud atau LLM extraction.

## Data contract

Setiap tempat menyimpan OSM ID, name, amenity, sample area, coordinates, sourceUrl, fetchedAt, osmEditedAt, serta nullable address/cuisine/openingHours/website. Metadata website terpisah berisi sourceUrl, checkedAt, status, HTTP/robots status dan hasil ekstraksi. OSM edit date bukan tanggal verifikasi usaha. Missing fields tampil **Belum tersedia**; rating/review Google, foto ilustratif dan halal status tidak ditambahkan.

Validasi importer mencakup named nodes, permitted amenity, numeric finite coordinates di dalam bbox, ID dedup, public HTTP(S) URLs tanpa credentials/private hosts, serta batas10 per area. Zod memvalidasi snapshot, source identity, unique IDs, counts dan bounds sebelum data dipakai aplikasi/API. Source data bukan HTML executable. Nama serupa tetap bisa merupakan cabang berbeda; hanya identitas OSM yang di-dedup.

Data OSM-derived snapshot tersedia dengan atribusi dan ODbL-1.0: [OpenStreetMap copyright](https://www.openstreetmap.org/copyright). Public JSON mempertahankan metadata license/attribution. Hak atas data pihak ketiga mengikuti sumbernya; menggunakan Scrapling tidak mengubah hak tersebut. Private user data tetap terpisah dari katalog publik.

## Running and refreshing

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r scripts/data/requirements.txt
.venv/bin/python -m unittest discover -s scripts/data -p 'test_*.py'
.venv/bin/python scripts/data/import_catalog.py --enrich
npm run dev
```

Perintah menggunakan virtualenv Mac/Linux. Windows dapat memakai interpreter virtualenv yang setara. Tidak perlu browser dependencies Scrapling karena pilot hanya memakai parser HTML dan urllib untuk HTTP biasa. Satu run online mengambil empat OSM bbox, kemudian robots/homepage website yang di-whitelist jika `--enrich` dipilih. Tidak ada scheduler atau fetch eksternal pada CI/page load.

Untuk memakai ekstrak yang sudah diunduh, sediakan `blok-m.json`, `menteng.json`, `kelapa-gading.json`, `kota-tua.json` dalam folder dan jalankan `--input-dir /path/to/folder --enrich`. Preserve file modification times dari waktu download karena digunakan untuk fetchedAt. Raw extract tidak dimasukkan ke Git; hanya normalized fields yang dibutuhkan. Output diganti atomically setelah semua area valid; network/parse/empty-area failure mempertahankan snapshot lama. Website failure dicatat tanpa membuat metadata pengganti.

Snapshot sumber: `src/features/catalog/data/jakarta-pilot.json`. Tidak ada Supabase project/table baru: file versioned cukup untuk review pilot. Persistent catalogue/schema/RLS baru dipilih setelah sumber, coverage dan refresh policy disetujui.

## Verification

Koreksi alur detail:27 unit/integration tests dan30 focused browser tests lulus (Chromium/WebKit), termasuk route guard OSM, Overview → Menu → Reviews, popup Maps dari detail, empty states dan regresi halaman detail preview. Lint, typecheck, production build dan scoped formatting juga lulus.

Rating/detail update: browser coverage memeriksa decoded local photo, credit/license, source rating, click foto dan isi kartu menuju Overview dalam tab yang sama, Menu/Reviews URL + reload, source menu, missing rating/menu/review,404, Back ke halaman asal,40 detail links, metadata JSON, Maps popup dari detail dengan external response yang di-stub, failed-image fallback,375/430/1280px overflow, serta regresi Explore dan detail preview. `test-results/home-real-place-*.png` dan `real-overview-*.png` menjadi bukti tampilan. Pembukaan Google Maps native app pada perangkat fisik belum diuji.

Story: Explore entry → server-rendered catalogue/filter URL → validated snapshot → source links/public JSON. Next Form mempertahankan preview Wishlist context ketika mencari data; tidak melakukan full reload pada navigasi client normal.

| Boundary          | Evidence                                                                                                                                                   |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source → importer | Empat real OSM extracts,40 normalized places, documented bounds/source timestamps                                                                          |
| Website → parser  | Real Cafe Batavia HTML parsed by Scrapling; title/menu URL/HTTP statuses retained                                                                          |
| Importer failures | Offline Python tests for invalid points/URLs, cap/dedup, robots denial,429, missing robots, extraction and preserving existing snapshot on network failure |
| Data → app/API    | Zod schema and unit tests verify identity, coverage, invalid input and source URLs                                                                         |
| Browser → data    | Chromium/WebKit search, area/kind, empty/reset, JSON response, attribution and no provider requests                                                        |
| Usability         | Keyboard,375/390/430/1280, landscape844×390 and text2× checked; screenshots in `test-results/catalog-*.png`                                                |

Local source lint excludes pre-existing untracked `spotted-*.js` design scripts; those files are not modified or committed by this task. Formatting excludes generated data JSON and virtualenv. CI adds Python3.13 and offline importer tests; source/page checks need no provider credentials.

## Design and delivery gate

Direction follows the current SPOTTED editorial implementation: warm canvas, Inter,34px heading,24px gutters, yellow primary action and quality summary, white factual records. Dials ENERGY1/RHYTHM1/MOTION1; no new motion, artwork or icon/navigation assets. Record cards group provenance and nullable fields. The source attribution footer replaces the illustrative label only on this real-data page.

Anti Slop DURING: factuality PASS (source counts and nulls, no fabricated ratings or claims); specificity PASS (named sample areas and bounded selection); functional completeness PASS (filter/reset/source/JSON/Back outcomes); accessibility PASS (labels, keyboard/focus,44px actions and existing AA palette); responsiveness PASS (phone/desktop/landscape/text2×); scope PASS (data pilot and importer, no paid provider or account/database migration). Full rule checklist follows.

| Rule/check  | Result and evidence                                                                                                                      |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| R-02        | PASS: authored UI copy tanpa em dash; source names dipertahankan sebagai data.                                                           |
| R-03        | PASS: viewport phone, desktop, landscape dan text2× diperiksa.                                                                           |
| R-17        | PASS:40/11/6 berasal dari snapshot; tidak mengklaim total Jakarta.                                                                       |
| R-18        | PASS: tidak ada testimonial baru.                                                                                                        |
| R-23        | PASS: dua foto Wikimedia ditambahkan sesuai permintaan eksplisit pengguna, dengan source/license/credit; tidak membuat avatar/logo baru. |
| R-24        | PASS: entry, Back, filters, reset, OSM source, website source dan JSON punya tujuan valid.                                               |
| R-25        | PASS: existing ink/canvas dan muted/canvas memenuhi AA; blue links pada white dan ink/yellow memenuhi AA.                                |
| R-26        | PASS: semua filter, reset dan links memiliki outcome yang diperiksa.                                                                     |
| R-27        | PASS: loading, no results, missing field, unavailable website dan importer failure tersedia.                                             |
| R-28        | PASS: tidak menambahkan FAQ.                                                                                                             |
| R-32        | PASS: native labels/selects, Next Form, skip link, keyboard/focus dan44px actions.                                                       |
| R-33        | PASS: UI di JSX/CSS Modules; importer terpisah hanya menghasilkan data JSON.                                                             |
| R-34        | PASS: fixed light house theme, tanpa theme toggle tambahan.                                                                              |
| R-35        | PASS: build, source/API/browser boundaries dan screenshots diperiksa.                                                                    |
| R-36        | PASS: tidak mengklaim merchant verification, live menus, free unlimited server atau all-Jakarta coverage.                                |
| R-37        | PASS: design read mengikuti current editorial SPOTTED, ENERGY1/RHYTHM1/MOTION1.                                                          |
| R-38        | PASS: nama/koordinat/tags berasal dari source nyata; missing values tidak dibuat.                                                        |
| R-01        | PASS: tanpa gradient/glow.                                                                                                               |
| R-04        | PASS: house Back/locate icons mempertahankan fungsi navigation existing.                                                                 |
| R-06        | PASS: Inter/current house typography, hierarchy34/24/22/16/14/12.                                                                        |
| R-07        | PASS: tidak ada background grid dekoratif.                                                                                               |
| R-08        | PASS: tidak menambahkan arrows dekoratif.                                                                                                |
| R-09        | PASS: pilot label membedakan source dataset dari fixtures existing.                                                                      |
| R-10        | PASS: tanpa glassmorphism.                                                                                                               |
| R-12        | PASS: tidak menambah large shadows pada records.                                                                                         |
| R-13        | PASS: tanpa glow.                                                                                                                        |
| R-14        | PASS: quality summary, filters dan records punya komposisi sesuai jenis content.                                                         |
| R-19        | PASS: tidak ada animasi baru.                                                                                                            |
| R-22        | PASS: tidak menambahkan generic illustration.                                                                                            |
| Dials       | PASS:1/1/1 konsisten tanpa entrance/loop animation baru.                                                                                 |
| Focal point | PASS: data provenance dan completeness menjadi fokus sebelum daftar records.                                                             |
| Whitespace  | PASS: house24px gutters,16px gaps dan grouped source fields.                                                                             |
| Accent      | PASS: yellow untuk summary/submit; blue untuk source links.                                                                              |
| Identity    | PASS: SPOTTED typography/palette/controls, tanpa dashboard template tambahan.                                                            |
| Design read | PASS: current house direction dan bounded data-review purpose disebut sebelum UI.                                                        |
| C-1         | PASS: setiap element mendukung review source/coverage atau navigation.                                                                   |
| C-2         | PASS: semua controls berfungsi, tanpa placeholder action baru.                                                                           |
| C-3         | PASS: tidak menambah marketing sections.                                                                                                 |
| C-4         | PASS: unsupported filters, empty fields, bad URLs, bounds, cap, rate limit dan snapshot preservation ditangani.                          |
| C-5         | PASS: tanpa klaim hasil/security/customer yang direkayasa.                                                                               |
| R-05        | PASS: data-review page mengikuti content, tanpa hero marketing/template grid.                                                            |
| R-11        | PASS: pill controls dan16px record groups mengikuti house hierarchy.                                                                     |
| R-15        | PASS: CTA Lihat data, Reset pencarian dan Lihat titik OSM spesifik.                                                                      |
| R-16        | PASS: tanpa AI marketing buzzwords.                                                                                                      |
| R-20        | PASS: source/data purpose dan brand current SPOTTED terlihat.                                                                            |
| R-21        | PASS: light theme sesuai existing product.                                                                                               |
| R-29        | PASS: memakai semantic palette existing.                                                                                                 |
| R-30        | PASS: tidak menyalin template produk lain.                                                                                               |
| R-31        | PASS: alasan type, palette, spacing, records dan footer tertulis di design read.                                                         |

Physical-device QA, business existence/accuracy verification, merchant permission for broader extraction, full menus and city-wide coverage remain unverified.
