# Map and Wishlist preview

19 Oktober 2026. Implementasi tiga screen pilihan pengguna, tanpa dependency baru.

## Confirmed information

Referensi Figma file `Sxg2J06MrgCE0ywAviBDNu`: Map `2029:4754`, Wishlist List `2029:4803`, Wishlist Map `2029:4837`. Ketiganya dibaca melalui design context dan screenshot sebelum implementasi. Direction: SPOTTED mobile discovery, system font mengikuti SF Pro, gutter/gap20, canvas terang, yellow sebagai active navigation, blue untuk control aktif, green untuk nearby, pink untuk saved di luar radius.

Design read: ENERGY1 / RHYTHM1. MOTION diperinci menjadi2 untuk dua pulse pin nearby selama1.2 detik lalu diam, mengikuti catatan Figma. Reduced motion menonaktifkan pulse. Tidak ada animasi lain yang ditambahkan.

## Current functionality

- `/map`: search, kategori, pemilihan area manual, schematic pins, Search This Area feedback, List menuju Explore, dan navigasi bawah.
- `/wishlist`: tiga saved fixtures awal, radius1/3/5/10km, nearby summary, compact cards, Remove, Directions fallback, Add from TikTok availability dialog.
- `/wishlist?view=map`: saved pins, radius overlay asli Figma, jumlah nearby dan switch kembali ke List. View/radius ada di URL dan bertahan saat reload.
- Save/Remove memakai React context yang sama dengan Explore/detail; tidak disimpan ke akun atau storage. Fixture awal kini mencakup Ruang Matcha agar sesuai tiga saved places di referensi.
- Marker membuka detail. Back dari detail kembali ke Map atau Wishlist dengan mode/radius/filter semula. Return destination dibatasi pada enum internal, bukan arbitrary URL.
- Explore View map membuka Map atau Wishlist Map sesuai section. Bottom navigation sekarang memakai halaman Map/Wishlist, menggantikan dialog preview lama.
- Layout, navigasi, dialog, foto, dan ikon existing digunakan kembali. CSS browse dipindahkan ke shared layout agar shared UI tidak mengimpor business feature.
- Empty wishlist, empty search, unavailable distance, loading, photo fallback, dialog keyboard/focus, dan existing restaurant404 tetap tersedia.

## Assumptions and limitations

Peta adalah schematic dari Figma, bukan navigasi atau Google basemap. Radius memakai fixture straight-line distance relatif sample Blok M; ketika area Bintaro dipilih, jarak tidak dianggap diketahui dan nearby0. Tombol current location menjelaskan keterbatasan preview tanpa meminta lokasi perangkat. Search This Area mengevaluasi fixture/filter saat ini dan menyatakan live search belum terhubung.

Pin Figma mengulang label4.7 dan menyebut ramen4.8 di luar radius, meski fixture ramen1.2km berada dalam radius5km. Implementasi menampilkan satu pin per fixture dan menurunkan warna/label dari Save state dan radius, agar count/list/map konsisten. Label berdasarkan lokasi aktual diganti menjadi sample location agar tidak mengklaim geolocation aktif.

Add from TikTok dan Directions menampilkan availability dialog; tidak membuat video URL, koordinat, alamat, atau hasil import palsu. Directions menyediakan pencarian area nyata di Google Maps. Auth, API, persistence lintas reload, perangkat fisik, dan deployment belum ditambahkan.

## Assets and validation

SVG baru disimpan di `public/figma/maps`: pin/bookmark/list/map/plus/close20px dan locate24px, seluruh root dimensions dipertahankan. Ikon nav24px dan safe area16px memakai aset Explore existing yang sama. Tiga foto Wishlist identik SHA-256 dengan foto Explore, sehingga digunakan kembali. Radius PNG asli560×560 dirender280×280 pada slot source, tanpa opacity tambahan karena transparency sudah dibawa export.

`npm run check` dan production build lulus. Unit/integration14 tests lulus; full browser suite42 tests lulus pada Chromium dan Mobile Safari/WebKit. Sesudah koreksi opacity overlay, screen tests dijalankan ulang. Coverage mencakup radius/count, mode/reload, filter/area, saved/unsaved pin, shared state, return navigation, empty states, keyboard dialog, SVG/photo geometry, viewport375/390/430/1280/landscape, dan teks2×. Safari focus return diperbaiki memakai button event target, tanpa mengandalkan activeElement saat pointer click.

Screenshot Map, Wishlist List, dan Wishlist Map diperiksa terhadap source. Semua gambar lokal memiliki naturalWidth positif; root SVG sesuai rendered dimensions. Audit DOM Wishlist Map pada390×844: nav350×80 di x20/y750, footer y728 sampai844, location target44×44. Tidak ada client exception pada screen tests. Reduced motion menghasilkan animation-name none; mode normal dua iterasi600ms.

Kontras AA: secondary text di green4.83:1, blue di wash4.69:1; existing muted/canvas5.86:1 dan white/blue5.30:1. Screenshot test di `test-results/map-*.png`, `wishlist-list-*.png`, dan `wishlist-map-*.png` dihasilkan ulang saat E2E berjalan.

## Anti Slop DURING delivery gate

| Item                   | Result and evidence                                                                                |
| ---------------------- | -------------------------------------------------------------------------------------------------- |
| R-02                   | PASS: pencarian source Map/shared UI tidak menemukan em dash.                                      |
| R-03                   | PASS: lima viewport dan teks2× diuji; tombol Remove memakai wrap agar tidak overflow.              |
| R-17                   | PASS: jumlah saved/nearby dihitung dari fixtures dan shared state; footer illustrative data.       |
| R-18                   | PASS: tidak menambahkan testimonial; existing illustrative review berasal dari Figma.              |
| R-23                   | PASS: aset asli Figma diunduh dan duplicate photos digunakan kembali.                              |
| R-24                   | PASS: nav Map/Wishlist/Explore, switch List/Map, pin/detail dan return routes diuji.               |
| R-25                   | PASS: pasangan warna AA diukur, ratio terendah4.69:1 pada blue/wash.                               |
| R-26                   | PASS: tiap control memiliki navigasi, state change atau penjelasan availability yang terlihat.     |
| R-27                   | PASS: loading, empty, image failure, unavailable location/import/directions, dan404 diuji.         |
| R-28                   | PASS: tidak ada FAQ tambahan.                                                                      |
| R-32                   | PASS: native links dan focus ring; Tab/Shift+Tab/Escape serta return focus diuji pada dua engines. |
| R-33                   | PASS: UI berupa JSX/CSS Modules, tidak ada runtime source-patching script.                         |
| R-34                   | PASS: fixed light sesuai reference; tidak menambahkan theme toggle.                                |
| R-35                   | PASS: build dan42 browser tests lulus; screenshots dan control outcomes diperiksa.                 |
| R-36                   | PASS: tidak mengklaim geolocation, API, account persistence atau performance production.           |
| R-37                   | PASS: tiga node diberikan pengguna; design read/dials diumumkan selama implementasi.               |
| R-38                   | PASS: schematic dan fixture dinyatakan jelas; tidak mengarang link video atau lokasi aktual.       |
| R-01                   | PASS: tanpa gradient atau glow.                                                                    |
| R-04                   | PASS: ikon list/map/location/bookmark/plus/close asli sesuai aksi masing-masing.                   |
| R-06                   | PASS: native system font mengikuti SF Pro source; hierarchy32/20/16/14/12.                         |
| R-07                   | PASS: street pattern merepresentasikan schematic map pada slot Figma, bukan background dekoratif.  |
| R-08                   | PASS: tanpa decorative CTA arrows.                                                                 |
| R-09                   | PASS: pin saved/nearby dan active controls memiliki makna state.                                   |
| R-10                   | PASS: tanpa glassmorphism.                                                                         |
| R-12                   | PASS: shadow hanya pada navigation dock existing.                                                  |
| R-13                   | PASS: tidak ada glow.                                                                              |
| R-14                   | PASS: wishlist memakai compact rows, Map memakai schematic canvas dan pins.                        |
| R-19                   | PASS: dua pulse terbatas untuk nearby, reduced motion none; tidak ada infinite loop.               |
| R-22                   | PASS: schematic berasal dari source dan foto asli; tidak menambah ilustrasi generik.               |
| Liveliness dials       | PASS: ENERGY1/RHYTHM1/MOTION2 untuk finite pin entry, dijelaskan di atas.                          |
| Liveliness consistency | PASS: layout tenang dengan motion hanya dua pulse sesuai Figma.                                    |
| Liveliness focal point | PASS: schematic pins di Map, saved nearby row pada Wishlist List.                                  |
| Liveliness whitespace  | PASS: gutter/gap20 dan header/view/radius grouping dari source.                                    |
| Liveliness accent      | PASS: yellow navigation/action, blue controls, green/pink menyatakan proximity/save state.         |
| Liveliness identity    | PASS: SPOTTED palette, typography, pill pins, radius overlay dan compact photos.                   |
| Liveliness design read | PASS: Figma direction dinyatakan sebelum coding; motion dirinci sesuai entry pulse.                |
| C-1                    | PASS: keputusan visual ditelusurkan ke source dan state consistency notes.                         |
| C-2                    | PASS: navigasi, radius, search, remove, modal dan pin memiliki outcome teruji.                     |
| C-3                    | PASS: hanya screen/section Figma yang diminta, tidak menambah marketing sections.                  |
| C-4                    | PASS: teks besar, responsive, keyboard, empty data, failed photos dan recovery diuji.              |
| C-5                    | PASS: fixtures dilabeli, real location/API/customer claims tidak ditambahkan.                      |
| R-05                   | PASS: komposisi List berbeda dari Map sesuai tugas pengguna.                                       |
| R-11                   | PASS: cards16, map24, chips/pins pill mengikuti hierarchy source.                                  |
| R-15                   | PASS: aksi spesifik Search This Area, Remove, Directions, Add from TikTok.                         |
| R-16                   | PASS: tidak ada AI/marketing buzzwords tambahan.                                                   |
| R-20                   | PASS: komposisi dan identitas SPOTTED berasal dari referensi pengguna.                             |
| R-21                   | PASS: light theme mengikuti source.                                                                |
| R-29                   | PASS: existing SPOTTED palette; warna tambahan hanya semantik saved/nearby/wash dari source.       |
| R-30                   | PASS: tidak menyalin template produk lain.                                                         |
| R-31                   | PASS: warna, layout, type, spacing, cards, map, radius dan motion punya alasan tertulis.           |

QA memakai browser emulation; pengujian iPhone/Android fisik dan integrasi production masih diperlukan.
