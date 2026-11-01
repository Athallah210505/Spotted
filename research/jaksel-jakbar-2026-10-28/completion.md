# Hasil pelengkapan database Jaksel/Jakbar

Diperbarui 1 November 2026. **25.907 record gabungan** tersedia: 2.223 record utama dan 23.951 kandidat Overture, dikurangi 267 pengaitan satu-ke-satu yang terkonfirmasi. Jumlah ini belum merupakan jumlah bisnis unik atau sensus lengkap.

| Data utama                                     | Sebelumnya | Sekarang |
| ---------------------------------------------- | ---------: | -------: |
| Cocok Google                                   |        477 |      547 |
| Rating Google                                  |        471 |      541 |
| Jam buka Google                                |        389 |      438 |
| Alamat kosong                                  |      1.239 |    1.061 |
| Tanpa nama                                     |         48 |       46 |
| Lima penulis ulasan, rating dan referensi foto |         89 |       89 |
| Cuplikan ulasan                                |        459 |      459 |
| Referensi foto                                 |         94 |       94 |

113 alamat diisi dari Overture setelah pemeriksaan nama, lokasi, confidence, dan konflik. Dua nama berasal dari tag bahasa OSM yang benar-benar tersedia. Kandidat Overture memiliki 23.291 alamat, dengan 172 konflik locality ditandai. Confidence sumber tidak ditampilkan sebagai rating Google.

## Akses Google

Probe biasa sempat berhasil HTTP 200, tercatat pada [bukti pemulihan](access-recovery-2026-11-01.json). Collector melanjutkan cache dengan dua worker, lalu berhenti ketika Google kembali memberi HTTP 429. Audit offline dilanjutkan dari capture yang sudah tersedia dan bukti alamat terbuka. Tidak ada penggantian identitas, CAPTCHA bypass, atau biaya API.

| Status audit utama               | Record |
| -------------------------------- | -----: |
| `needs_identity_evidence`        |     46 |
| `matched_with_five_reviews`      |      1 |
| `unresolved_search`              |    288 |
| `matched_partial`                |    379 |
| `missing_coordinates`            |    150 |
| `fetch_error`                    |     39 |
| `name_mismatch`                  |     78 |
| `closed`                         |     79 |
| `non_food_category_needs_review` |     13 |
| `outside_match_radius`           |     37 |
| `previously_verified`            |     88 |
| `address_conflict`               |      1 |
| `blocked`                        |      2 |
| `not_attempted_provider_blocked` |  1,022 |

Status `matched_partial` menyatakan bukti cabang yang cocok dengan field belum lengkap. `not_attempted_provider_blocked` adalah record yang belum diminta karena blokir, bukan pencarian gagal. Sebanyak 79 listing bertanda tutup disimpan sebagai riwayat. Record tanpa nama tetap membutuhkan bukti identitas.

## Penggunaan dan verifikasi

[SQLite](food-database.sqlite) memiliki view `all_food_places`, diekspor ke [CSV seluruh record](all-places.csv). Tabel `places` mempertahankan record utama; `discovery_places` memuat kandidat dengan release, confidence, sumber upstream, dan flag konflik. Rating Google pada layer kandidat selalu NULL. Per-field source URL dan waktu setiap review dipertahankan.

23 pasangan potensi duplikat utama disimpan, termasuk tiga pasangan dengan Google CID sama; 10 pencocokan Overture ambigu ditahan. Hanya 267 pengaitan terkonfirmasi yang dihilangkan dari bagian kandidat view gabungan. Masih mungkin ada duplikat lainnya.

PASS: 37 test otomatis, SQLite integrity/foreign key, serta perbandingan seluruh record CSV/JSON/SQLite dan provenance. Katalog Explore/Map tetap 104 record; kandidat riset belum otomatis masuk UI. Tidak ada perubahan Supabase cloud atau billing.

**Belum lengkap:** Google masih membatasi akses; 1.061 alamat utama dan 46 nama masih kosong, serta menu, foto yang siap dipublikasikan, dan lima review setiap tempat belum tersedia. Cakupan pedagang yang tidak ada di sumber publik juga belum diketahui. [README](README.md) memuat metode, lisensi, dan cara membangun ulang.
