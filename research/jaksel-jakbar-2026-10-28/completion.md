# Hasil pelengkapan database Jaksel/Jakbar

Snapshot sumber dikumpulkan 28 Oktober 2026; artefak diperiksa ulang 1 November 2026. Database berisi 2,223 record sumber di 18 kecamatan.

| Data                                                 | Sebelum | Sesudah |
| ---------------------------------------------------- | ------: | ------: |
| Cabang cocok Google                                  |      88 |     477 |
| Rating tersedia                                      |      88 |     471 |
| Alamat kosong                                        |   1.477 |   1,239 |
| Record dengan lima ulasan, rating dan referensi foto |      88 |      89 |
| Cuplikan ulasan                                      |     440 |     459 |
| Referensi foto                                       |      88 |      94 |

Ada data jam buka Google pada 389 record. Sebanyak 68 listing bertanda tutup disimpan dengan status tersendiri; alasan tutup sementara/permanen ada dalam payload sumber. Referensi foto tidak otomatis menjadi foto yang telah diperiksa visual.

## Hasil pemeriksaan

Collector memperoleh capture untuk 969 record. Tiga request menerima HTTP 429 dari `www.google.com/sorry/index`; seluruh worker kemudian berhenti. Parameter query URL challenge tidak dipublikasikan.

| Status                         | Record |
| ------------------------------ | -----: |
| needs_identity_evidence        |     48 |
| matched_with_five_reviews      |      1 |
| unresolved_search              |    257 |
| matched_partial                |    320 |
| missing_coordinates            |    150 |
| fetch_error                    |     39 |
| name_mismatch                  |     71 |
| closed                         |     68 |
| non_food_category_needs_review |     12 |
| outside_match_radius           |     27 |
| previously_verified            |     88 |
| blocked                        |      3 |
| not_attempted_provider_blocked |   1139 |

`matched_with_five_reviews` menyatakan kontrak rating/foto referensi/lima penulis, bukan kelengkapan seluruh menu atau izin publikasi foto. `matched_partial` menyimpan fakta cabang yang sudah cocok walau beberapa field belum tersedia. Status `not_attempted_provider_blocked` mencatat record yang belum diminta, bukan hasil pencarian gagal.

48 titik belum mempunyai nama yang dapat dibuktikan. Sebagian mempunyai kandidat Google di sekitarnya dalam audit, tetapi nama kandidat tidak otomatis dipasang ke titik tersebut. Selain 1.139 record bernama yang tertahan blokir, 27 titik tanpa nama belum sempat dicari.

## Duplikat dan provenance

Ada 23 pasangan potensi duplikat: 3 pasangan memakai CID Google yang sama dan 20 pasangan masih perlu pemeriksaan. Record sumber tetap dipertahankan agar riwayat dan relasi tidak hilang.

[Database SQLite](food-database.sqlite), [CSV](places.csv), [JSON](places.json), dan [audit per record](google-enrichment.json) telah diperbarui. Tabel `enrichment_attempts` menyimpan status, waktu, jumlah capture, serta bukti untuk setiap record. Data Google menyimpan URL sumber dan waktu capture; field yang tidak ditemukan tetap kosong.

## Verifikasi

- PASS: SQLite `integrity_check` dan `foreign_key_check`.
- PASS: seluruh record CSV, JSON, SQLite dan sumber dibandingkan oleh `validate.py`.
- PASS: test untuk cabang jauh, nomor alamat berbeda, dua listing ambigu, CID berbeda, lima penulis, metadata marker terpilih, dan penghentian pada blokir tersimpan.
- PASS: katalog aplikasi tidak diubah; Explore/Map masih menggunakan 104 record terverifikasi.

Belum seluruh database lengkap. Pelengkapan jaringan berhenti karena pembatasan Google. Tidak ada aktivasi billing, rotasi proxy, penyelesaian CAPTCHA, pengisian nama/alamat perkiraan, ataupun penggantian ulasan kosong dengan ulasan buatan.
