# 100 kandidat kuliner Jakarta Selatan

**Update pelengkapan Google:** 67 kandidat sudah dipublikasikan ke Explore dan Map; katalog aplikasi sekarang 104 tempat. Google menandai 19 listing tutup dan 14 kandidat lainnya ditahan karena bukti cabang/koordinat atau ulasan belum cukup. [Lihat hasil lengkap setiap kandidat](completion.md). JSON dan CSV sudah memuat hasil Google beserta status publikasinya. Uraian pengumpulan di bawah mencatat tahap riset awal.

Dikumpulkan 28 Oktober 2026. Satu baris = satu tempat/cabang dan satu makanan yang disebut dalam liputan, termasuk dessert/bakery. Bukan 100 jenis hidangan berbeda dan bukan peringkat viral.

[Download CSV](places.csv) · [Dataset JSON](places.json)

## Hasil pengumpulan

- 100 tempat unik: 83 makanan dan 17 dessert/bakery. Seluruh halaman detail menyebut South Jakarta/Jakarta Selatan.
- 191 halaman detail diperiksa; 147 menyebut Jakarta Selatan. Toko nonkuliner, bar yang berfokus minuman, lokasi di luar Jaksel, serta alamat yang ambigu tidak dipilih.
- 98 referensi foto dan 98 jam buka menurut sumber; 100 tautan pencarian Google Maps.
- Saat pengumpulan awal, tidak ada nama identik setelah normalisasi dengan 37 tempat aplikasi. Hasil pencocokan Google berikutnya tersedia di [laporan pelengkapan](completion.md).
- Setiap makanan dicocokkan ke teks halaman. Cuplikan maksimal 25 kata, URL, tanggal publikasi, waktu pengambilan dan SHA-256 respons disimpan untuk audit.

## Arti “hits” dan batas data

Basis pemilihan adalah liputan kuliner Manual Jakarta. Ini sinyal untuk discovery, bukan bukti semua tempat sedang viral pada 28 Oktober 2026. Tanggal liputan: 2026: 9 tempat, 2025: 11 tempat, 2024: 33 tempat, 2023: 27 tempat, 2022: 18 tempat, 2021: 2 tempat. Tanggal pengambilan baru tidak berarti semua informasi bisnis baru.

Nama makanan berarti disebut sumber, bukan otomatis bestseller atau masih tersedia. Area adalah pengelompokan alamat untuk browsing. Pada tahap awal, data Google belum diverifikasi; hasil pelengkapannya kini ada pada field `google*`, koordinat, `appRecordId` dan `publicationStatus`. Harga/halal tetap kosong jika tidak ada bukti. Jam buka tetap snapshot sumber, bukan jaminan “buka sekarang”.

Tautan Maps dibuat dari nama dan alamat untuk memudahkan pencarian, belum merupakan Google place ID yang cocok persis. URL foto hanya referensi sumber; foto belum diunduh, diperiksa visual satu per satu, atau mendapat izin penggunaan ulang.

67 kandidat yang cocok dan lengkap sudah masuk Explore/Map setelah pemeriksaan foto, rating, lokasi dan lima review unik. Kandidat lain tetap ada di research dengan alasan pengecualian; tidak diisi data perkiraan.

## Metode dan pemeriksaan

Scrapling MCP tidak bisa menjalankan GET karena tidak memiliki sesi aktif. Pengumpulan menggunakan HTTP publik melalui Python standard library dan parser HTML Scrapling 0.5 yang sudah terpasang. Tidak membuka Chrome/Chromium, tidak memakai API key/credit/billing, dan tidak melewati login/challenge. Maksimal tiga request paralel, timeout 25 detik; raw HTML berada di /tmp, bukan dataset aplikasi.

Filter kategori digabung wilayah pada direktori ternyata memasukkan toko/bar. Daftar kategori dan wilayah diambil terpisah, lalu locality dan isi halaman diperiksa. Google Maps URL kosong dari sumber tidak dianggap sebagai lokasi terverifikasi.

Jalankan `python3 research/jaksel-100-2026-10-28/validate.py` dari repo untuk memeriksa jumlah, keunikan, cakupan wilayah, kutipan makanan, URL, nilai yang belum diverifikasi, dan kesamaan CSV/JSON. Tahap awal hanya menghasilkan riset; pelengkapan berikutnya memasukkan 67 kandidat terverifikasi ke katalog JSON aplikasi.

## Daftar lengkap

| No. | Tempat                                                                                                        | Area             | Makanan disebut sumber      | Liputan    |
| --- | ------------------------------------------------------------------------------------------------------------- | ---------------- | --------------------------- | ---------- |
| 1   | [Troppo Pizza](https://manual.co.id/directory/troppo-pizza/)                                                  | Permata Hijau    | pizza                       | 2026-07-23 |
| 2   | [Salira](https://manual.co.id/directory/salira/)                                                              | Senopati         | bubur ayam                  | 2026-07-08 |
| 3   | [Scarlett’s House PIM 5](https://manual.co.id/directory/scarletts-house-pim-5/)                               | Pondok Indah     | Breakfast Hash              | 2026-07-08 |
| 4   | [Dan’s Diner](https://manual.co.id/directory/dans-diner/)                                                     | Gunawarman       | Classic Breakfast           | 2026-05-18 |
| 5   | [Supagetti](https://manual.co.id/directory/supagetti/)                                                        | Prapanca         | Squid Ajillo                | 2026-04-29 |
| 6   | [BAKED. Gunawarman](https://manual.co.id/directory/baked-gunawarman/)                                         | Gunawarman       | Sourdough Pancakes          | 2026-04-24 |
| 7   | [Little Frenchie](https://manual.co.id/directory/little-frenchie/)                                            | Senopati         | Mushroom Parfait            | 2026-03-12 |
| 8   | [Louie Coffee](https://manual.co.id/directory/louie-coffee/)                                                  | Pondok Pinang    | Brioche Royale              | 2026-03-10 |
| 9   | [RM Budi Jaya](https://manual.co.id/directory/rm-budi-jaya/)                                                  | Lebak Bulus      | Ayam Bakar                  | 2026-02-25 |
| 10  | [RM Sinar Gakong](https://manual.co.id/directory/rm-sinar-gakong/)                                            | Wijaya           | Nasi Goreng LV              | 2025-08-26 |
| 11  | [YOUNG Restaurant](https://manual.co.id/directory/young-restaurant/)                                          | Dharmawangsa     | Thai Fried Egg              | 2025-08-08 |
| 12  | [Sop Sapi Minarwati](https://manual.co.id/directory/sop-sapi-minarwati/)                                      | Cipete           | sop sapi                    | 2025-06-05 |
| 13  | [Saap Thai](https://manual.co.id/directory/saap-thai/)                                                        | SCBD             | Boat Noodle                 | 2025-05-02 |
| 14  | [KAI JIN (Senopati)](https://manual.co.id/directory/kai-jin-senopati/)                                        | Senopati         | Omakase Kaisen-Don          | 2025-04-25 |
| 15  | [Sate Melawai](https://manual.co.id/directory/sate-melawai/)                                                  | Blok M           | Sate Sineret                | 2025-03-28 |
| 16  | [Manzo](https://manual.co.id/directory/manzo/)                                                                | Wijaya           | Miso Carbonara              | 2025-03-21 |
| 17  | [KNOTS](https://manual.co.id/directory/knots/)                                                                | Kemang           | Basque Cheesecake           | 2025-02-28 |
| 18  | [Tide and Table](https://manual.co.id/directory/tide-and-table/)                                              | Melawai          | Kombu Aged Black Cod        | 2025-02-14 |
| 19  | [HAKŪJI Tearoom](https://manual.co.id/directory/hakuji-tearoom/)                                              | Kemang           | nerikiri                    | 2025-01-31 |
| 20  | [Publish](https://manual.co.id/directory/publish/)                                                            | Gunawarman       | brie toast                  | 2025-01-15 |
| 21  | [Matchaman (Blok M)](https://manual.co.id/directory/matchaman-blok-m/)                                        | Blok M           | Maple Butter                | 2024-12-27 |
| 22  | [Fragments (ASHTA District 8)](https://manual.co.id/directory/fragments-ashta-district-8/)                    | SCBD             | bagel sandwiches            | 2024-12-23 |
| 23  | [Lapo Porsea](https://manual.co.id/directory/lapo-porsea/)                                                    | SCBD             | Arsik                       | 2024-12-05 |
| 24  | [Fried Club](https://manual.co.id/directory/fried-club/)                                                      | Wijaya           | Golden Nugget               | 2024-11-26 |
| 25  | [Luc Coffee (Panglima Polim)](https://manual.co.id/directory/luc-coffee-panglima-polim/)                      | Panglima Polim   | Tiramisu                    | 2024-11-19 |
| 26  | [Silk Thai](https://manual.co.id/directory/silk-thai/)                                                        | Gandaria         | Squid Sashimi               | 2024-11-15 |
| 27  | [Dapur Bandha](https://manual.co.id/directory/dapur-bandha/)                                                  | Tebet            | Karigule                    | 2024-10-25 |
| 28  | [Mi Mie Dang](https://manual.co.id/directory/mi-mie-dang/)                                                    | Dharmawangsa     | bún chả                     | 2024-10-18 |
| 29  | [CasaLeña](https://manual.co.id/directory/casalena/)                                                          | Senayan          | Prawn & Octopus Cocktail    | 2024-10-11 |
| 30  | [BODEJA by Nadja’s Gourmet](https://manual.co.id/directory/bodeja-by-nadjas-gourmet/)                         | Kemang           | Veggie Lasagna              | 2024-09-24 |
| 31  | [Billy’s Block](https://manual.co.id/directory/billys-block/)                                                 | Senopati         | Spice Bag                   | 2024-09-20 |
| 32  | [Seroja Bake](https://manual.co.id/directory/seroja-bake/)                                                    | Pondok Indah     | Rosella Talam               | 2024-08-07 |
| 33  | [Dan’s Burgers](https://manual.co.id/directory/dans-burgers/)                                                 | Dharmawangsa     | smashburgers                | 2024-08-02 |
| 34  | [Sinar Untung](https://manual.co.id/directory/sinar-untung/)                                                  | Kramat Pela      | sayur lodeh                 | 2024-07-26 |
| 35  | [Junsei](https://manual.co.id/directory/junsei/)                                                              | Senopati         | Tsukune                     | 2024-07-17 |
| 36  | [Meatguy Steakhouse II](https://manual.co.id/directory/meatguy-steakhouse-scbd/)                              | SCBD             | steak                       | 2024-06-27 |
| 37  | [Nothing Personal](https://manual.co.id/directory/nothing-personal/)                                          | Blok M           | Bread Pudding               | 2024-06-07 |
| 38  | [ONNI Garden House](https://manual.co.id/directory/onni-garden-house/)                                        | Lebak Bulus      | baked rice                  | 2024-05-21 |
| 39  | [RM Berkah](https://manual.co.id/directory/rm-berkah-jeruk-purut/)                                            | Jeruk Purut      | sop daging                  | 2024-05-10 |
| 40  | [Mata Karanjang](https://manual.co.id/directory/mata-karanjang/)                                              | Wijaya           | Ayam Tuturuga               | 2024-05-06 |
| 41  | [Sando Shop](https://manual.co.id/directory/sando-shop/)                                                      | Selong           | mazemen                     | 2024-05-03 |
| 42  | [Solo Ristorante](https://manual.co.id/directory/solo-ristorante/)                                            | Wijaya           | pizza                       | 2024-04-26 |
| 43  | [PEPR.](https://manual.co.id/directory/pepr/)                                                                 | Permata Senayan  | Double Smashed Cheeseburger | 2024-04-03 |
| 44  | [Lawry’s The Prime Rib](https://manual.co.id/directory/lawrys-the-prime-rib/)                                 | Pakubuwono       | standing roast prime rib    | 2024-03-26 |
| 45  | [Depot Nasi Pajero](https://manual.co.id/directory/depot-nasi-pajero/)                                        | Cipete           | Gongso Koyor                | 2024-03-15 |
| 46  | [Bouchon](https://manual.co.id/directory/bouchon/)                                                            | Senopati         | Croque Bouchon              | 2024-03-13 |
| 47  | [Warung Pak Chandra](https://manual.co.id/directory/warung-pak-chandra/)                                      | Wijaya           | Gulai Daging Chiangmai      | 2024-03-04 |
| 48  | [Rumah Makan Sepakat](https://manual.co.id/directory/rumah-makan-sepakat/)                                    | Blok M           | gajeboh                     | 2024-02-23 |
| 49  | [Ante](https://manual.co.id/directory/ante/)                                                                  | Sudirman         | Mangut Mekajiki             | 2024-02-14 |
| 50  | [The Holy Crab](https://manual.co.id/directory/the-holy-crab/)                                                | Senopati         | Crab Hot Stone Rice         | 2024-02-09 |
| 51  | [ESA](https://manual.co.id/directory/esa/)                                                                    | SCBD             | Nasi Hijau                  | 2024-02-07 |
| 52  | [PNNY Bites Senopati](https://manual.co.id/directory/pnny-bites/)                                             | Senopati         | Super Grilled Cheese        | 2024-02-02 |
| 53  | [Kyō Coffee (ASHTA District 8)](https://manual.co.id/directory/kyo-coffee-2/)                                 | SCBD             | Pecan Tart                  | 2024-01-23 |
| 54  | [Kurasu Kissaten](https://manual.co.id/directory/kurasu-kissaten/)                                            | Melawai          | Classic BLT                 | 2023-12-06 |
| 55  | [Heng Heng Katong Laksa](https://manual.co.id/directory/heng-heng-katong-laksa/)                              | Senopati         | Katong laksa                | 2023-11-24 |
| 56  | [GIGA Bites](https://manual.co.id/directory/giga-bites/)                                                      | Gandaria         | Local Salad                 | 2023-11-03 |
| 57  | [MARI-MARI](https://manual.co.id/directory/mari-mari/)                                                        | Gandaria         | Roti Jala                   | 2023-10-27 |
| 58  | [Toscana](https://manual.co.id/directory/toscana/)                                                            | Kemang           | Capricciosa                 | 2023-10-26 |
| 59  | [KAMA Cuisine & Libations](https://manual.co.id/directory/kama-cuisine-libations/)                            | Senopati         | Beef tartar                 | 2023-10-06 |
| 60  | [Orvia SCBD](https://manual.co.id/directory/orvia-scbd/)                                                      | SCBD             | Roti Jala Merah Putih       | 2023-09-18 |
| 61  | [Sesame Bakery Room](https://manual.co.id/directory/sesame-bakery-room/)                                      | Kemang           | 100 Layer Lasagna           | 2023-09-12 |
| 62  | [Toko Kopi Tjaraka](https://manual.co.id/directory/kopi-toko-tjaraka/)                                        | Pasar Minggu     | kue kamir                   | 2023-08-18 |
| 63  | [Levant Boulangerie](https://manual.co.id/directory/levant-boulangerie/)                                      | Cipete           | Steak Frites                | 2023-08-01 |
| 64  | [BAKED. Kemang](https://manual.co.id/directory/baked-kemang/)                                                 | Kemang           | Lemon Curd Cruffin          | 2023-07-28 |
| 65  | [ZODIAC Baresto](https://manual.co.id/directory/zodiac-baresto/)                                              | Melawai          | Pecel Tempura               | 2023-07-21 |
| 66  | [Flor](https://manual.co.id/directory/flor/)                                                                  | Gunawarman       | Cookie & Dough Cruffin      | 2023-07-18 |
| 67  | [Nasi Goreng MPR Fatmawati](https://manual.co.id/directory/nasi-goreng-mpr-fatmawati/)                        | Fatmawati        | nasi goreng                 | 2023-07-07 |
| 68  | [Warung Bhakti](https://manual.co.id/directory/warung-bhakti/)                                                | Senopati         | Nasi Goreng Kambing         | 2023-05-19 |
| 69  | [Rumah Makan Lokiin](https://manual.co.id/directory/rumah-makan-lokiin/)                                      | Blok M           | Empal Gentong               | 2023-05-17 |
| 70  | [404 Bottle Eatery](https://manual.co.id/directory/404-bottle-eatery/)                                        | Wijaya           | Chicken Steak               | 2023-05-12 |
| 71  | [Contra](https://manual.co.id/directory/contra/)                                                              | Senopati         | Crispy Chicken Milanese     | 2023-05-05 |
| 72  | [Exquise Bistro & Patisserie](https://manual.co.id/directory/exquise-bistro-patisserie/)                      | Gunawarman       | truffle mushroom soup       | 2023-03-28 |
| 73  | [Inferno The Grill](https://manual.co.id/directory/inferno-the-grill/)                                        | Kuningan         | Miso Eggplant               | 2023-03-23 |
| 74  | [Aunty Chef by COOK’s](https://manual.co.id/directory/aunty-chef-by-cooks/)                                   | Senopati         | crablio                     | 2023-03-15 |
| 75  | [Koultoura Coffee Senopati](https://manual.co.id/directory/koultoura-coffee/)                                 | Senopati         | Beef Bulgogi Tacos          | 2023-03-03 |
| 76  | [MENSA](https://manual.co.id/directory/mensa/)                                                                | Kemang           | Red Curry Roast Salmon      | 2023-03-02 |
| 77  | [Fnny&co](https://manual.co.id/directory/fnnyco/)                                                             | Cipete           | Risoles                     | 2023-02-17 |
| 78  | [Potluck](https://manual.co.id/directory/potluck/)                                                            | Tebet            | Quesadillas                 | 2023-02-10 |
| 79  | [Teru](https://manual.co.id/directory/teru/)                                                                  | Barito           | Shoyu Koji Chicken          | 2023-01-20 |
| 80  | [BRAUD General Store](https://manual.co.id/directory/braud-general-store/)                                    | Senopati         | General Store Burger        | 2023-01-17 |
| 81  | [OD by Oyster Dealer](https://manual.co.id/directory/od-by-oyster-dealer/)                                    | SCBD             | oysters                     | 2022-12-16 |
| 82  | [% Arabica Jakarta Roastery](https://manual.co.id/directory/arabica-jakarta-roastery/)                        | Gunawarman       | Soft Cream                  | 2022-11-29 |
| 83  | [T’ang Court](https://manual.co.id/directory/tang-court/)                                                     | SCBD             | Peking duck                 | 2022-11-22 |
| 84  | [TOMA Brasserie](https://manual.co.id/directory/toma-brasserie/)                                              | Sudirman         | Grilled Pork Belly Adobo    | 2022-11-16 |
| 85  | [Scarlett’s Café (Senopati)](https://manual.co.id/directory/scarletts-cafe-senopati/)                         | Senopati         | poured tiramisu             | 2022-09-23 |
| 86  | [Kōhai Sushi Bar](https://manual.co.id/directory/kohai-sushi-bar/)                                            | Kuningan         | sushi                       | 2022-09-21 |
| 87  | [Bubur Ayam Palapa Raya](https://manual.co.id/directory/bubur-ayam-palapa-raya/)                              | Pasar Minggu     | bubur ayam                  | 2022-09-02 |
| 88  | [Kopikalyan Wijaya](https://manual.co.id/directory/kopikalyan-wijaya/)                                        | Wijaya           | salmon egg benedict         | 2022-08-26 |
| 89  | [Kouji Genki Project](https://manual.co.id/directory/kouji-genki-project-2/)                                  | Tebet            | Tenzaru Soba                | 2022-08-25 |
| 90  | [Rowstid Chikin’](https://manual.co.id/directory/rowstid-chikin/)                                             | Panglima Polim   | roasted chicken             | 2022-08-25 |
| 91  | [Moon Gypsy](https://manual.co.id/directory/moon-gypsy/)                                                      | Senopati         | ricotta hotcakes            | 2022-08-25 |
| 92  | [Galapung Bakehouse](https://manual.co.id/directory/galapung-bakehouse/)                                      | Pejaten          | Mushroom & Greens Pie       | 2022-07-29 |
| 93  | [Zapoli](https://manual.co.id/directory/zapoli/)                                                              | Kemang           | Forza Fungi                 | 2022-07-01 |
| 94  | [Ombé Kofie (Senopati)](https://manual.co.id/directory/ombe-kofie-senopati/)                                  | Senopati         | Chicken Tenders             | 2022-05-31 |
| 95  | [Fern Coffee House](https://manual.co.id/directory/fern-coffee-house/)                                        | Pondok Labu      | Siomay                      | 2022-05-20 |
| 96  | [Nasi Peda Pelangi](https://manual.co.id/directory/nasi-peda-pelangi/)                                        | SCBD             | Nasi Peda                   | 2022-04-05 |
| 97  | [Sate Kambing & Tengkleng Rica-Rica Pak Manto](https://manual.co.id/directory/tengkleng-rica-rica-pak-manto/) | Bintaro (Jaksel) | tengkleng rica-rica         | 2022-04-01 |
| 98  | [Work Coffee](https://manual.co.id/directory/work-coffee/)                                                    | Lebak Bulus      | Nasi Bakar Kampong          | 2022-02-08 |
| 99  | [Café RSPI (Senopati)](https://manual.co.id/directory/cafe-rspi-senopati/)                                    | Senopati         | Nasi Goreng Puspita         | 2021-06-14 |
| 100 | [Pierre](https://manual.co.id/directory/pierre/)                                                              | Senopati         | Profiteroles                | 2021-06-11 |
