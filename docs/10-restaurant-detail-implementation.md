# Restaurant detail preview

19 Oktober 2026. Scope: detail restoran dan navigasi dari Explore, tanpa dependency baru.

## Confirmed information

Referensi pengguna: Figma file `Sxg2J06MrgCE0ywAviBDNu`, detail `2029:4697`, serta tiga screenshot Menu, Google Reviews, dan TikTok. Context dan screenshot tambahan diambil dari Reviews `2029:2119`, Videos `2029:2145`, foto galeri `10:1432` dan `10:1488`.

Design read sebelum implementasi: mobile restaurant discovery dengan foto sebagai fokus, warna dan bentuk SPOTTED dari Figma, ENERGY 1 / RHYTHM 1 / MOTION 1. Gutter 20px dan gap 20px mempertahankan ritme source. SF Pro diterjemahkan ke native system font. Yellow menandai section/Save, blue menandai aksi keluar. Tidak ada animasi dekoratif. Jam palsu 9:41 dari mockup tidak ditampilkan.

## Current functionality

- `/restaurant/kedai-ramen-sore` menampilkan galeri tiga foto, rating, info restoran, status halal belum terverifikasi, menu ilustratif, serta sticky Save dan Get Directions.
- `?tab=reviews` dan `?tab=tiktok` menyediakan tampilan sesuai referensi, mendukung reload dan riwayat browser. Section menggunakan link native dengan penanda current page.
- Semua entry point restoran di Explore, compact card, dan preview wishlist menuju detail. Filter query/category/city dibawa ke detail dan kembali melalui Back.
- Preview wishlist memakai satu React context di root provider. Save/Remove tersinkron selama navigasi, lalu kembali ke fixture awal saat full reload. Tidak disimpan di akun atau browser storage.
- Fitur restaurant menerima Save sebagai slot dari route; restaurant tidak mengimpor fitur wishlist, Maps, atau TikTok.
- Restaurant lain memakai fixture Explore yang sama dan empty state untuk menu, review, serta video yang belum tersedia. Data ramen tidak disalin menjadi data restoran lain.
- Unknown slug mendapat HTTP 404. Layout memvalidasi slug sebelum nested loading boundary mulai mengirim respons streaming.
- Menu resmi, review live, video, dan directions menampilkan penjelasan keterbatasan preview. Maps menyediakan link pencarian area nyata, bukan rute ke alamat ilustratif.
- Foto gagal dimuat mendapat fallback. Native dialog mendukung Escape, Tab/Shift+Tab, close button, dan pengembalian fokus. Skip link tersedia.

## Assumptions and limitations

Slug fixture dipakai sementara sebagai identitas route. Nama, rating, harga, jam buka, alamat contoh, review Alya, dan saved video card adalah konten ilustratif dari Figma. Tidak ada Google Place ID, official menu URL, TikTok video URL, data private, atau autentikasi yang diada-adakan. Kalimat privacy pada kartu video merepresentasikan desain, belum membuktikan access control production.

Integrasi Places/Maps, TikTok, auth, wishlist persisten, dan QA perangkat fisik masih belum dilakukan. Tidak ada deployment atau perubahan database.

## Assets and visual verification

Semua SVG baru disimpan di `public/figma/detail`. Root dimensions dipertahankan: locate 16px; back/star/shield 24px; previous/arrow/external/bookmark 20px; video/search 32px. Audit DOM memastikan seluruh ikon terlihat dengan ukuran tersebut dan naturalWidth positif. Tidak ada SVG yang digambar ulang atau temporary Figma URL di runtime.

Foto ramen dan café identik byte-for-byte dengan aset Explore, diverifikasi SHA-1 dan digunakan kembali. Foto sushi asli disimpan sebagai `public/figma/detail/photo-3.jpg`. Slot galeri 350 × 250px pada viewport 390px, object-fit cover. Screenshot Menu awal/bawah, Reviews, dan TikTok diperiksa terhadap Figma. Font native dapat berbeda antar OS.

## Validation

- `npm run check`: lint, TypeScript, 12 unit/integration tests, dan Prettier lulus.
- `npm run build`: production build Webpack lulus.
- `npm run test:e2e`: 30 tests lulus, Chromium dan Mobile Safari/WebKit.
- Browser coverage: galeri wrap dua arah; section URLs/reload; filter return; Save lintas route; wishlist entry; menu/video/review/directions fallback; missing image; empty data; invalid tab; HTTP 404; dialog focus containment/return; regresi Explore.
- Layout diuji pada 375 × 812, 390 × 844, 430 × 932, 1280 × 900, dan landscape 844 × 390; pembesaran teks 2× tanpa overflow horizontal.
- Audit browser tambahan: skip link setiap section, Back header Reviews/TikTok, seluruh geometri ikon, tanpa client exception; reduced motion menghasilkan transition duration `0s`.
- Contrast checker: muted/canvas 5.86:1, white/blue 5.30:1, muted/video wash 5.51:1, lulus AA normal text.
- Screenshot otomatis tersedia di `test-results/detail-*-initial-*.png` dan `test-results/detail-*.png` setelah E2E; folder ini dihasilkan ulang saat test berikutnya.

## Anti Slop DURING delivery gate

Scope audit: detail dan entry point Explore yang berubah. Seluruh item PASS berikut merujuk implementasi dan validasi di atas.

| Item                   | Result and evidence                                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------ |
| R-02                   | PASS: pencarian source detail tidak menemukan em dash.                                                             |
| R-03                   | PASS: lima viewport dan teks 2× diuji tanpa horizontal overflow.                                                   |
| R-17                   | PASS: rating/count/harga berasal dari Figma, footer menyatakan illustrative data.                                  |
| R-18                   | PASS: review Alya berasal dari referensi pengguna dan diberi label not live Google data.                           |
| R-23                   | PASS: aset asli Figma diunduh; tidak membuat logo, foto, atau testimonial baru.                                    |
| R-24                   | PASS: entry Explore, section links, Back, dan recovery link memiliki tujuan yang diuji.                            |
| R-25                   | PASS: pasangan warna teks terlemah yang digunakan tetap di atas AA; tiga ratio dicatat di atas.                    |
| R-26                   | PASS: gallery, Save, section links, external-action explanations, close dan area links memiliki outcome.           |
| R-27                   | PASS: loading route, image fallback, empty menu/review/video, unavailable provider, dan 404 tersedia.              |
| R-28                   | PASS: tidak ada FAQ tambahan.                                                                                      |
| R-32                   | PASS: skip links, native section links, modal Tab loop, Escape, dan focus return diperiksa.                        |
| R-33                   | PASS: UI ditulis sebagai JSX/CSS Modules; tidak memakai runtime source-patching script.                            |
| R-34                   | PASS: fixed light theme mengikuti source; tidak menambahkan theme toggle.                                          |
| R-35                   | PASS: build lulus, 30 browser tests lulus, screenshot dan control click-through diperiksa.                         |
| R-36                   | PASS: tidak ada claim performa, compliance, atau enforcement privacy production.                                   |
| R-37                   | PASS: user memberikan Figma dan screenshot; design read serta dials dinyatakan sebelum coding.                     |
| R-38                   | PASS: seluruh konten contoh diberi label; URL resmi dan real video tidak direkayasa.                               |
| R-01                   | PASS: tidak ada gradient atau glow tambahan.                                                                       |
| R-04                   | PASS: ikon star adalah rating, shield adalah status verification, search adalah empty state; semuanya asli source. |
| R-06                   | PASS: native system font mengikuti SF Pro source, hierarchy 32/28/22/20/16/14/12.                                  |
| R-07                   | PASS: background solid mengikuti Figma, tanpa pattern tambahan.                                                    |
| R-08                   | PASS: arrow untuk next photo dan external icon untuk aksi provider, bukan hiasan CTA.                              |
| R-09                   | PASS: status Not Verified menjelaskan informasi halal yang belum diverifikasi.                                     |
| R-10                   | PASS: tidak ada glassmorphism.                                                                                     |
| R-12                   | PASS: cards tidak diberi shadow dekoratif; modal memakai native backdrop.                                          |
| R-13                   | PASS: tidak ada glow.                                                                                              |
| R-14                   | PASS: menu, review, video card, dan empty state memiliki komposisi berbeda sesuai kontennya.                       |
| R-19                   | PASS: hanya opacity feedback 140ms; reduced motion 0s diverifikasi.                                                |
| R-22                   | PASS: hanya tiga foto referensi Figma, tanpa ilustrasi generik tambahan.                                           |
| Liveliness dials       | PASS: ENERGY/RHYTHM/MOTION 1/1/1 sesuai design read.                                                               |
| Liveliness consistency | PASS: layout source tenang dan teratur, tanpa scroll reveal atau loop.                                             |
| Liveliness focal point | PASS: foto pada Menu, review card pada Reviews, saved link pada TikTok.                                            |
| Liveliness whitespace  | PASS: gutter 20px, gap 20px, dan section grouping mengikuti source.                                                |
| Liveliness accent      | PASS: yellow menandai section aktif/Save; blue dipakai pada aksi provider.                                         |
| Liveliness identity    | PASS: palette, system typography, photo gallery, dan pill sections mengikuti SPOTTED.                              |
| Liveliness design read | PASS: arah dan dials diumumkan sebelum implementasi.                                                               |
| C-1                    | PASS: keputusan visual ditelusurkan ke Figma pada design read dan asset audit.                                     |
| C-2                    | PASS: setiap control memiliki route, perubahan state, atau penjelasan ketersediaan.                                |
| C-3                    | PASS: hanya section yang diminta pengguna, tanpa marketing content tambahan.                                       |
| C-4                    | PASS: responsive, teks besar, keyboard, missing data/photo, dan recovery diuji.                                    |
| C-5                    | PASS: fixture berasal dari desain dan dilabeli; tidak dinyatakan sebagai bukti pelanggan nyata.                    |
| R-05                   | PASS: komposisi Menu/Reviews/TikTok mengikuti kebutuhan masing-masing dari source.                                 |
| R-11                   | PASS: photo/video/review radius16, menu24, buttons pill; variasi mengikuti Figma.                                  |
| R-15                   | PASS: CTA spesifik seperti Next photo, Open official menu, dan Back to restaurant.                                 |
| R-16                   | PASS: tidak menambahkan AI atau marketing buzzwords.                                                               |
| R-20                   | PASS: hierarchy dan komposisi SPOTTED dipertahankan, bukan template produk lain.                                   |
| R-21                   | PASS: light theme berasal dari referensi pengguna.                                                                 |
| R-29                   | PASS: canvas/ink/muted dengan yellow, blue, dan video wash dari source.                                            |
| R-30                   | PASS: sumber visual adalah Figma SPOTTED pengguna.                                                                 |
| R-31                   | PASS: alasan warna, layout, font, spacing, radius, imagery, dan motion tertulis di design read.                    |

Browser emulation belum menggantikan QA iPhone/Android fisik atau verifikasi data/integrasi production.
