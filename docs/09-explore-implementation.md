# 09 · Explore implementation and QA

19 Oktober 2026. Referensi yang dipilih pengguna: [Explore, node 2029:4592](https://www.figma.com/design/Sxg2J06MrgCE0ywAviBDNu/SPOTTED?node-id=2029-4592).

## Current functionality

Explore menggantikan placeholder fondasi. Page server membaca dan menormalisasi URL; client feature menangani interaksi preview. Search, kategori dan kota memakai URL sebagai sumber state. Sample wishlist menggunakan state React per kunjungan, tanpa penyimpanan akun atau browser storage.

Foto dan delapan SVG berasal langsung dari get_design_context node tersebut, disimpan lokal tanpa mengubah kontennya. Tiga foto ternyata berformat JPEG meskipun URL berakhiran PNG; extension lokal diperbaiki, bytes tidak dikonversi. Screenshot seluruh screen tidak digunakan sebagai asset UI.

| Slot / node                        | Local asset                                                          | Render                                                               |
| ---------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Top Rated / I2029:4629;4:192       | public/figma/explore/photo-ramen.jpg                                 | 350×176 pada viewport 390, object-fit cover                          |
| Nearby compact / I2029:4637;4:219  | public/figma/explore/photo-cafe.jpg                                  | 88×88, object-fit cover                                              |
| Near You / I2029:4641;4:192        | public/figma/explore/photo-ramen1.jpg                                | 176 px tinggi, object-fit cover; foto café mengikuti asset asli node |
| Search, location, save, navigation | icon-search, pin, chevron, locate, bookmark, compass, map, user .svg | Root asli 24×24; chevron/locate 16×16                                |

## Design decisions and boundaries

Anti Slop DURING dipilih pengguna untuk sesi ini. Design read: mobile-first food discovery dengan bahasa visual Figma yang tenang, ritme berulang, foto sebagai fokus; ENERGY 1 / RHYTHM 1 / MOTION 1.

- Canvas #F8F8F6 dan warna brand mengikuti node. SF Pro memakai native system font pada perangkat Apple, dengan fallback sistem pada platform lain; tidak mengunduh font berlisensi atau mengganti arah typography.
- Foto Top Rated dan headline menjadi hierarki utama. Spacing 16 px, gutter 20 px, card 350×300 pada viewport390, foto176 px, content124 px, dan dock80 px mengikuti Figma.
- Navigasi mengambang memakai satu elevation dari source; cards tetap flat. Pill dipakai untuk chips/aksi/navigation item sesuai source, bukan untuk semua container.
- Jam OS palsu 9:41 tidak dirender. Safe-area spacing dipertahankan dan ikon locate menjadi tombol area yang berfungsi. Desktop menampung layout mobile dengan lebar maksimum430; ponsel memakai viewport penuh.
- Copy kecil pada hijau diubah dari #61615C ke #57574F, menghasilkan4.83:1; source asli menghasilkan4.12:1. Warna brand tidak diubah.
- Dialog native ditambah focus loop dan return focus eksplisit karena perilaku default Chromium/Safari berbeda. Dialog internal berpindah state tanpa membuat routes kosong.
- Search dan kategori bekerja atas tiga fixtures Figma. Kategori tanpa sample menampilkan empty state dan Reset filters. Tidak mengklaim hasil restoran lengkap.

## Planned functionality

Google Places, akun/login, persistent wishlist dan full in-app Map belum terhubung. Navigation Map dan Profile membuka dialog yang menjelaskan status preview; map menawarkan link area nyata di Google Maps. Directions pada sample tidak membuat tujuan palsu untuk restoran ilustratif. Tidak ada request provider berbayar dari Explore.

Pilihan kota Tangsel hanya menampilkan candidate ilustratif yang sesuai; jarak ditulis unavailable karena tidak ada data origin baru yang diverifikasi. Initial nearby count berasal dari dua sample saves dan radius ilustratif5km. Reload memulihkan sample defaults.

## Verification

- PASS: lint, strict typecheck dan formatting.
- PASS: 12 unit/route integration tests, termasuk normalisasi query dan combined filters.
- PASS: production build Next.js Webpack.
- PASS: 20 browser tests, Chromium dan iPhone-emulated WebKit, termasuk root redirect, no external provider requests, categories/search/URL reload, save/remove synchronization, location, all navigation outcomes, photo failure fallback, modal keyboard loop/Escape/return focus, dan skip-link activation.
- PASS: layout pada375,390,430,1280 px dan landscape844×390; root tidak overflow horizontal, nav tetap di viewport. Kategori sengaja horizontal-scrollable.
- PASS: reduced-motion mematikan transition; simulated2× text tidak memperlebar root dan modal tetap dapat dinavigasi. Ini bukan pengujian Dynamic Type pada perangkat fisik.
- PASS: screenshot390×844 dan section Nearby diperiksa terhadap reference render. Tidak mengklaim pixel-perfect lintas OS atau font fallback.
- PASS: seluruh11 files nonempty; SVG dimensions, JSX callsites, photo slots dan image load dicek. Tidak ada temporary Figma asset URL pada runtime source.

## Anti Slop delivery gate

Scope gate adalah Explore dan dialog preview yang dibuat pada pekerjaan ini. Dokumen blueprint lama dan screen lain tidak diaudit ulang.

| Item                   | Status dan evidence                                                                                                                 |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| R-02                   | PASS: copy UI tidak memakai em dash.                                                                                                |
| R-03                   | PASS: responsive browser checks tidak menemukan overflow root pada ukuran di atas.                                                  |
| R-17                   | PASS: rating/count berasal dari Figma dan berlabel Illustrative data, bukan claim live.                                             |
| R-18                   | PASS: tidak ada testimonial.                                                                                                        |
| R-23                   | PASS: foto/SVG/wordmark/navigation berasal dari node yang diberikan pengguna.                                                       |
| R-24                   | PASS: tidak ada link ke route fitur yang belum dibuat; navigation memakai dialog.                                                   |
| R-25                   | PASS: delapan pasangan teks/background dihitung; rasio minimum4.83:1 setelah koreksi muted-on-green. Focus ring memakai brand blue. |
| R-26                   | PASS: search, semua category chips, location, Save/Remove, previews, map links dan nav diuji.                                       |
| R-27                   | PASS: route loading/pending status, search/wishlist empty, photo-error fallback dan existing route error boundary tersedia.         |
| R-28                   | PASS: tidak ada FAQ pengisi halaman.                                                                                                |
| R-32                   | PASS: skip-link activation, focus ring, modal Tab loop, Escape dan return focus diuji di kedua engines.                             |
| R-33                   | PASS: source JSX/CSS ditulis langsung; tidak ada external source-patching script.                                                   |
| R-34                   | PASS: tidak ada theme toggle; fixed light mengikuti approved Figma.                                                                 |
| R-35                   | PASS: app dibuild, dirender, diperiksa screenshot dan diuji20 browser cases.                                                        |
| R-36                   | PASS: tidak ada claim security/compliance/performance yang belum diukur.                                                            |
| R-37                   | PASS: arah visual berasal dari user-provided Figma; dials1/1/1, bukan desain baru tanpa referensi.                                  |
| R-38                   | PASS: konten ilustratif dinyatakan eksplisit, tidak disajikan sebagai data production.                                              |
| R-01                   | PASS: tidak ada gradient atau glow tambahan.                                                                                        |
| R-04                   | PASS: ikon asli Figma dipakai untuk aksi sesuai semantiknya.                                                                        |
| R-06                   | PASS: system font mengikuti SF Pro source; hierarchy40/22/20/16/14/12.                                                              |
| R-07                   | PASS: tidak ada background pattern tambahan.                                                                                        |
| R-08                   | PASS: tidak ada decorative arrows pada tombol.                                                                                      |
| R-09                   | PASS: tidak ada marketing badge tambahan; label demo menjelaskan status data.                                                       |
| R-10                   | PASS: tidak ada glassmorphism.                                                                                                      |
| R-12                   | PASS: elevation digunakan pada floating dock/toast sesuai hierarchy, bukan semua cards.                                             |
| R-13                   | PASS: tidak ada glow.                                                                                                               |
| R-14                   | PASS: restaurant photo card dan compact nearby card memakai bentuk berbeda dari Figma.                                              |
| R-19                   | PASS: hanya feedback140ms pada controls; reduced-motion diuji.                                                                      |
| R-22                   | PASS: tidak ada ilustrasi generik; foto asli source dipertahankan.                                                                  |
| Liveliness dials       | PASS:1/1/1 sesuai calm source, tanpa animasi dekoratif.                                                                             |
| Liveliness focal point | PASS: headline dan foto Top Rated mendominasi screenshot initial viewport.                                                          |
| Liveliness whitespace  | PASS: gutter20/gap16/section header48 membentuk ritme source.                                                                       |
| Liveliness accent      | PASS: yellow menandai kategori/nav, blue untuk brand/aksi, green mengelompokkan nearby sesuai source.                               |
| Liveliness identity    | PASS: wordmark, palette dan photo/card composition berasal dari SPOTTED.                                                            |
| C-1                    | PASS: keputusan visual dijelaskan pada design decisions, tanpa estetika baru yang tidak diminta.                                    |
| C-2                    | PASS: setiap control memiliki outcome; fitur belum live dijelaskan saat diakses.                                                    |
| C-3                    | PASS: section mengikuti source, tanpa template hero/features/FAQ tambahan.                                                          |
| C-4                    | PASS: responsive, fallback, keyboard, reduced-motion dan text scaling diuji; keterbatasan physical-device QA dinyatakan.            |
| C-5                    | PASS: tidak ada fabricated testimonial, traction atau production claim.                                                             |
| R-05                   | PASS: komposisi mengikuti source screen.                                                                                            |
| R-11                   | PASS: card24, compact16, chips pill dan dock24 mengikuti hierarchy source.                                                          |
| R-15                   | PASS: Explore adalah label navigation yang diminta, bukan CTA pemasaran generik.                                                    |
| R-16                   | PASS: tidak menambah AI/marketing buzzwords.                                                                                        |
| R-20                   | PASS: visual SPOTTED dipertahankan, bukan template produk baru.                                                                     |
| R-21                   | PASS: light theme ditetapkan oleh reference, tanpa dark mode yang tidak diminta.                                                    |
| R-29                   | PASS: neutral surfaces + brand accents existing, tidak menambah palette dekoratif.                                                  |
| R-30                   | PASS: tidak menyalin produk lain; source adalah Figma SPOTTED sendiri.                                                              |
| R-31                   | PASS: warna, typography, spacing, imagery, cards dan motion punya alasan tertulis di atas.                                          |

Real Google data accuracy, auth/privacy enforcement, persistence lintas sesi, physical Safari/Android QA dan production performance masih pekerjaan integrasi berikutnya.
