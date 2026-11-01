# Database kuliner Jakarta Selatan dan Jakarta Barat

Diperbarui 1 November 2026. **25.907 record gabungan** tersedia dalam SQLite dan CSV, mencakup batas administratif kedua kota dan 18 kecamatan. Ini kumpulan record sumber, belum merupakan sensus lengkap atau jumlah bisnis unik.

| Layer                                    | Jakarta Selatan | Jakarta Barat |  Total |
| ---------------------------------------- | --------------: | ------------: | -----: |
| Record utama, OSM dan Google             |           1.349 |           874 |  2.223 |
| Kandidat Overture sebelum pengaitan      |          14.592 |         9.359 | 23.951 |
| Gabungan setelah 267 kecocokan ditautkan |          15.757 |        10.150 | 25.907 |

267 kandidat yang cocok ditautkan ke record utama dan dikeluarkan dari bagian kandidat view gabungan. Kandidat lain masih dapat memiliki duplikat antar-sumber; identitas tidak digabung berdasarkan nama saja. Ada 23 pasangan potensi duplikat pada record utama dan 10 pencocokan Overture ambigu yang ditahan untuk pemeriksaan.

## File siap digunakan

- [SQLite](food-database.sqlite): view **`all_food_places`** untuk seluruh record gabungan, tabel `places` untuk record utama, `discovery_places` untuk kandidat, serta sumber, ulasan, dan antrean enrichment.
- [CSV seluruh record](all-places.csv): ekspor view gabungan, termasuk `data_layer`, `source_confidence`, dan `verification_status`.
- [CSV kandidat](discovery-places.csv), [JSON kandidat dan sumber](overture-places.json), [bukti pencocokan Overture](overture-enrichment.json).
- [CSV utama](places.csv), [JSON utama](places.json), [sumber utama](sources.json), [ringkasan](summary.json).
- [Laporan pelengkapan](completion.md), [audit Google](google-enrichment.json), [bukti identitas Google sebelumnya](verified-google-identities.json).
- [Potensi duplikat](possible-duplicates.json), [100 kandidat makanan dari riset sebelumnya](research-candidates.csv), [schema](schema.sql).

SQLite dapat dibuka langsung, tanpa akun, server, API key, atau billing. Tidak ada perubahan Supabase cloud. Katalog Explore/Map tetap memakai 104 record yang memenuhi kebutuhan tampilannya; kandidat baru belum otomatis dipublikasikan ke aplikasi.

```sql
SELECT city, district, count(*) FROM all_food_places GROUP BY city, district;
SELECT name, address, google_rating, data_layer FROM all_food_places
WHERE city = 'Jakarta Barat';
SELECT * FROM discovery_places WHERE address_locality_conflict = 1;
SELECT * FROM enrichment_queue;
```

## Kelengkapan saat ini

Record utama memiliki **547 kecocokan Google, 541 rating, 438 data jam buka Google, dan 459 cuplikan ulasan**. Ada 94 referensi foto; referensi belum berarti foto telah diperiksa untuk publikasi. Sebanyak 89 record memenuhi kontrak rating, referensi foto, dan lima penulis ulasan berbeda. Menu lengkap, harga terkini, dan lima ulasan setiap tempat belum tersedia.

Alamat kosong pada record utama turun dari 1.239 menjadi **1.061** dibanding hasil sebelumnya. Overture mengisi 113 alamat yang belum diisi sumber lain. Dua nama ditemukan dalam tag bahasa asli OSM; **46 record masih tanpa nama**. Nama, rating, menu, dan ulasan yang tidak terbukti tidak diisi dengan perkiraan.

Kandidat Overture memiliki alamat pada 23.291 record. Sebanyak 172 alamat memiliki locality yang bertentangan dengan titik dalam batas kota; flag konflik dipertahankan dan alamat ini tidak digunakan untuk mengisi record utama. Confidence Overture adalah skor sumber, **bukan rating pelanggan**. Rating dan jumlah ulasan Google selalu NULL pada layer kandidat. Status operasional tidak dianggap buka bila tidak tersedia.

Google sempat kembali memberi HTTP 200 pada 1 November, sehingga pengumpulan dilanjutkan dengan cache dan concurrency dua. Google kemudian kembali memberi HTTP 429; collector berhenti dan menyimpan `provider-blocked.json`. Tidak ada request Google lanjutan setelah blokir, penyelesaian CAPTCHA, atau rotasi identitas. Pelengkapan selanjutnya memakai dataset publik Overture, bukan melewati pembatasan Google.

## Sumber dan metode

OSM: snapshot 28 Oktober 2026, 2.156 objek node/way dari query publik Overpass, ditambah record Google yang sudah cocok. Hitungan respons server diperiksa. Way memakai pusat bounding box, yang belum tentu titik pintu masuk. Kategori meliputi restoran, cafe, fast food, food court, bakery, pastry, deli, ice cream, chocolate, coffee, tea, dan confectionery. Warung atau pedagang yang belum dipetakan tetap menjadi kesenjangan sumber.

Overture: release **2026-10-21.0**, diambil 1 November melalui [katalog STAC resmi](https://stac.overturemaps.org/catalog.json) dan HTTPS GeoParquet publik tanpa requester-pays. Query bbox termasuk strip batas utara dan kategori makanan tambahan memperoleh 67.633 record, kemudian dipotong ke polygon kedua kota dan 18 kecamatan, termasuk lubang polygon. Setelah filter kuliner, tersisa 23.951 kandidat. Grocery, bahan mentah, konsultan makanan, dan kategori alkohol saja dikecualikan. Ini tidak menjamin seluruh tempat nyata tercakup atau masih beroperasi.

Pengaitan Overture memerlukan nama sumber yang sama, kota/kecamatan sama, jarak maksimal 50 m, confidence minimal 0,8, alamat tersedia tanpa konflik locality, dan tidak ada pertentangan nomor jalan yang terdeteksi. Pengaitan harus satu-ke-satu; kasus ambigu tidak digabung. Alamat yang sudah tersedia dipertahankan. `name_source_url` dan `address_source_url` mencatat asal field pada record utama.

Pengaitan Google memerlukan bukti cabang: nama dan koordinat maksimal 100 m, atau nama serta jalan/nomor alamat yang sama. Metadata marker terpilih dapat dipakai bila teramati dalam request resource. Koordinat hasil pencocokan alamat diberi label sesuai sumber, tidak diklaim sebagai koordinat Google. Listing CID berbeda tidak digabung ulasannya. Setiap review mempertahankan URL dan waktu capture sendiri; review lama tidak diberi tanggal pengambilan baru.

`place_sources` menyimpan provider, URL, waktu capture, waktu edit bila tersedia, dan payload. Kandidat menyimpan GERS ID, release, confidence, dan sumber upstream dengan lisensinya. Record yang ditautkan Overture tidak otomatis berstatus Google verified. Google dan OSM memiliki tanggal snapshot berbeda; `summary.json` memisahkan waktu snapshot OSM dan audit enrichment.

## Menjalankan ulang

```sh
# Bangun ulang dari raw cache OSM, tanpa request jaringan.
python3 scripts/data/build_food_database.py --raw-dir /tmp/spotted-food-database-raw

# Opsional: ambil release Overture terbaru melalui sumber publik gratis.
.venv/bin/python scripts/data/collect_overture_places.py --raw-dir /tmp/spotted-food-database-raw --output /tmp/spotted-overture-jakarta.json
.venv/bin/python scripts/data/enrich_overture_places.py --input /tmp/spotted-overture-jakarta.json --raw-dir /tmp/spotted-food-database-raw
python3 scripts/data/build_food_database.py --raw-dir /tmp/spotted-food-database-raw

python3 research/jaksel-jakbar-2026-10-28/validate.py
.venv/bin/python -m unittest discover -s scripts/data -p 'test_*.py'
```

Dependensi collector ada di `scripts/data/requirements.txt`; DuckDB menggunakan ekstensi httpfs. Raw response berada di `/tmp`; file hasil olahan dan provenance disimpan di folder ini. Builder membuat database staging dan memeriksa integrity serta foreign key sebelum mengganti output. Cache Google yang diblokir tidak boleh dihapus untuk mencoba melewati blokir.

## Pemeriksaan

37 test lulus. Validator membandingkan seluruh field CSV/JSON/SQLite, sumber setiap rating dan alamat, ID unik, jumlah kandidat, view gabungan, serta foreign key. Rating Google pada kandidat dipastikan kosong. Test mencakup polygon berlubang, WKB, kategori, cabang jauh, nomor alamat berbeda, ambiguitas, CID berbeda, lima penulis, dan penghentian pada blokir.

## Attribution

OSM: **© OpenStreetMap contributors**, [ODbL](https://www.openstreetmap.org/copyright); batas [Jakarta Selatan](https://www.openstreetmap.org/relation/5802438) dan [Jakarta Barat](https://www.openstreetmap.org/relation/7626001).

Overture Maps: [dokumentasi Places](https://docs.overturemaps.org/guides/places/) dan [cloud sources](https://docs.overturemaps.org/getting-data/cloud-sources/). Atribusi dan lisensi sumber upstream disimpan per record, termasuk CDLA-Permissive-2.0 dan Apache-2.0. Jangan menerapkan lisensi ODbL ke semua provider.

Konten Google dan Manual tetap mengikuti sumber serta ketentuan masing-masing. Tidak ada penggunaan Firecrawl berbayar atau aktivasi billing. Pengumpulan Google memakai Scrapling/parser dan headless biasa; Overture memakai HTTP dataset publik.
