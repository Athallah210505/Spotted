# Database kuliner Jakarta Selatan dan Jakarta Barat

Dikumpulkan 28 Oktober 2026. **2.223 record tempat/cabang** tersedia sebagai database lokal gratis. Cakupan query mencakup kedua batas kota dan seluruh 18 kecamatan; tidak memakai batas sampel 100 tempat.

| Wilayah         | Record |
| --------------- | -----: |
| Jakarta Selatan |  1.349 |
| Jakarta Barat   |    874 |
| Total           |  2.223 |

Satuan record adalah objek sumber atau cabang yang terverifikasi. Sebanyak **22 pasangan** memiliki nama sama dan jarak maksimal 75 m, sehingga perlu pemeriksaan duplikat sebelum jumlah ini dianggap sebagai jumlah bisnis unik.

## File siap digunakan

- [Database SQLite](food-database.sqlite): tabel tempat, sumber, ulasan, kandidat makanan, metadata, dan view antrean enrichment.
- [CSV tempat](places.csv): nama, kota, kecamatan, kategori, alamat, koordinat, jam buka, rating, URL Google Maps, referensi foto, status, dan waktu pengambilan.
- [JSON tempat](places.json), [metadata ringkasan](summary.json), [detail sumber](sources.json).
- [100 kandidat makanan dari riset sebelumnya](research-candidates.csv), termasuk hasil pencocokan Google dan hubungan ke record database bila cocok.
- [22 pasangan kemungkinan duplikat](possible-duplicates.json).
- [Schema SQLite](schema.sql), [query tempat](overpass-food.ql), [query kecamatan](overpass-districts.ql).

File SQLite dapat dibuka melalui DB Browser for SQLite atau `sqlite3`. File ini berisi data yang sudah diimpor; tidak memerlukan akun, server database, API key, atau billing. Supabase cloud belum diubah.

```sql
SELECT city, district, count(*) FROM places GROUP BY city, district;
SELECT name, address, google_rating FROM places
WHERE city = 'Jakarta Barat' AND name IS NOT NULL;
SELECT * FROM enrichment_queue WHERE city = 'Jakarta Selatan';
SELECT * FROM research_candidates WHERE google_match_status = 'closed';
```

## Sumber dan kelengkapan

Pengambilan utama menggunakan HTTP API publik Overpass dengan **2.156 objek OSM**: node serta bangunan/way, tanpa pemotongan per halaman atau pemilihan nama tertentu. Server mengembalikan jumlah total yang dicocokkan dengan jumlah objek diterima; respons error/parsial ditolak. Koordinat diperiksa terhadap geometri batas kota dan kecamatan, termasuk lubang polygon. Node memakai titik sumber; way memakai pusat bounding box sumber, yang belum tentu titik pintu masuk.

Kategori OSM yang dikumpulkan: `restaurant`, `cafe`, `fast_food`, `food_court`, `ice_cream`, `bakery`, `deli`, `confectionery`, `pastry`, `chocolate`, `coffee`, dan `tea`. Ini mencakup warung yang telah dipetakan dengan tag tersebut. Cakupan warung, pedagang keliling, dan bisnis yang belum dipetakan masih merupakan kesenjangan sumber.

Data Google dari katalog aplikasi dicocokkan dengan wilayah yang sama: **88 record dan 440 ulasan**. Sebanyak 21 record memakai identitas OSM yang sudah ada; 67 record menambah database. Sebanyak 16 record Google berada di luar Jaksel/Jakbar dan dikeluarkan dari dataset ini. Status dan tanggal sumber Google tetap berupa snapshot sebelumnya, tanpa pengambilan ulang Google massal dalam pekerjaan ini.

Field Google pada record lainnya tetap `NULL`. Ada **48 objek tanpa nama** dan **1.477 record tanpa alamat**; lokasi peta dan provenance tetap disimpan untuk pelengkapan. Nama bisnis, rating, ulasan, menu, harga, dan status buka tidak dibuat dari perkiraan. Field `opening_hours` mempertahankan sintaks tag OSM; jam mingguan Google tersimpan dalam payload sumber Google. Referensi foto belum diunduh ulang atau diperiksa ulang dalam pengumpulan ini.

`research_candidates.food_mentioned` menyimpan 100 makanan yang disebut liputan sebelumnya. Makanan tersebut tetap memerlukan pemeriksaan menu terkini. Daftar semua menu seluruh bisnis dan sensus seluruh tempat makan di dunia nyata belum tersedia dari sumber ini.

## Struktur dan status

`places.id` mempertahankan identitas objek OSM (`node/...`, `way/...`) atau ID katalog Google (`jaksel/...`). Nama sama di cabang berbeda dipertahankan. Penggabungan otomatis hanya dilakukan ketika ID OSM record Google sama persis dengan ID objek sumber; pasangan nama/jarak tetap masuk pemeriksaan manual.

Nama dan alamat Google yang sudah cocok diprioritaskan untuk 88 record Google; kategori dan jam tag OSM tetap dipertahankan bila berasal dari OSM. `place_sources` menyimpan provider, URL, waktu pengambilan, waktu edit sumber bila tersedia, dan payload bukti. `google_reviews` menyimpan nama penulis, profil sumber, skor, serta cuplikan yang sudah terverifikasi. `enrichment_queue` menampilkan kebutuhan nama, pemeriksaan duplikat, atau pencocokan Google. Record tanpa verifikasi bisnis memakai status `osm_only` dan `not_independently_verified`.

Katalog Explore/Map tetap memakai 104 record terverifikasi dengan foto dan lima ulasan. Database riset yang lebih luas ini tersedia terpisah untuk pelengkapan bertahap.

## Menjalankan ulang

```sh
# Unduh ulang dua query publik, kemudian buat database dan ekspor.
python3 scripts/data/build_food_database.py --raw-dir /tmp/spotted-food-database-raw --fetch

# Gunakan raw cache yang sudah ada tanpa mengambil data lagi.
python3 scripts/data/build_food_database.py --raw-dir /tmp/spotted-food-database-raw

python3 research/jaksel-jakbar-2026-10-28/validate.py
.venv/bin/python -m unittest discover -s scripts/data -p 'test_*.py'
```

Raw response tetap di `/tmp`; hash SHA-256 dan timestamp basis OSM dicatat dalam `summary.json`. Database dibuat di staging, diperiksa integrity/foreign key, lalu dipindahkan ke output. Ketika query atau validasi gagal, ekspor sebelumnya dipertahankan. Angka pada README ini mencatat snapshot 28 Oktober; `summary.json` memuat hitungan keluaran setiap build berikutnya.

## Pemeriksaan

- PASS: hitungan server 2.156 objek sesuai hasil yang diterima, tanpa record OSM terbuang di pemeriksaan batas kota.
- PASS: 2.223 ID record unik dan cakupan 18 kecamatan; 22 pasangan potensi duplikat tercatat terpisah.
- PASS: CSV, JSON, SQLite, jumlah ulasan, dan sumber data dicocokkan melalui validator.
- PASS: SQLite integrity dan foreign key valid; parser batas kota, filter kategori, dan batas nilai database memiliki test otomatis.
- PASS: data yang belum diverifikasi tetap kosong; seluruh rating database memiliki payload sumber Google dan lima penulis ulasan berbeda.

## Attribution

Data OSM: **© OpenStreetMap contributors**, [ODbL](https://www.openstreetmap.org/copyright). Batas kota: [Jakarta Selatan](https://www.openstreetmap.org/relation/5802438), [Jakarta Barat](https://www.openstreetmap.org/relation/7626001). Metode area query mengikuti [dokumentasi Overpass](https://dev.overpass-api.de/overpass-doc/en/full_data/area.html).

Provider Google dan Manual tetap memiliki sumber serta ketentuan masing-masing; lisensi ODbL pada baris OSM tidak menyatakan seluruh konten provider lain berlisensi ODbL. Halaman direktori hanya diperiksa sebagai sumber tambahan; tidak dilakukan crawling baru massal atau penggunaan Firecrawl berbayar. Pengumpulan baru dalam pekerjaan ini menggunakan HTTP publik; tidak membuka browser.
