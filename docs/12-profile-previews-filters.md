# Profile, selected-place previews, and Filters

19 Oktober 2026. Scope mengikuti screenshot pengguna: Profile, MapPreview, NearbyPreview, dan Filters. Tidak ada dependency baru.

## Confirmed information

Design context dan screenshot Figma dibaca dari file `Sxg2J06MrgCE0ywAviBDNu`: Profile `2029:1848`, MapPreview `2029:1897`, NearbyPreview `2029:1932`, Filters `2029:1968`. Komponen layout, navigation, dialog, schematic map, radius overlay, dan foto existing digunakan kembali.

Design read: calm SPOTTED mobile discovery, native system font mengikuti SF Pro, gutter/gap20, canvas terang, yellow sebagai action/selection dan blue sebagai selected pin/radius. Profile dan Filters memakai ENERGY1/RHYTHM1/MOTION1; Map mempertahankan dua entry pulses yang sudah ada, MOTION2 terbatas. Preview sheet putih radius32 mengelompokkan informasi restoran dan View Details. Tidak menambah animasi dekoratif.

## Current functionality

- `/profile`: mengedit display name1–50 karakter setelah trim, preferred city, dan default nearby radius1/3/5/10km. Preferensi hanya dalam React context selama app terbuka; reload mengembalikan contoh Athallah/Jakarta/5km.
- Profile menjadi halaman dari semua bottom navigation. Privacy, Account settings, Sign out, dan Delete account menjelaskan ketersediaan preview; tidak membuat atau menghapus akun nyata.
- Kota/radius eksplisit di URL mengalahkan preferensi. Jakarta dan5km tetap dapat dipilih walaupun default Profile berbeda. Search/filter tidak hilang saat mengganti kategori atau kota.
- Klik pin membuka preview, bukan langsung ke detail. `?place=kedai-ramen-sore` pada Map dan `?view=map&place=kopi-halaman` pada Wishlist mendukung deep link/reload.
- Selected pin berwarna blue; sheet menampilkan nama, rating/count, jarak yang tersedia, category/area/price dan View Details. Close/Escape mengembalikan fokus ke pin, termasuk setelah reload. Back dari detail mempertahankan source, radius, mode, dan selected place.
- Selection yang tidak ada, terhapus dari Wishlist, atau tidak lagi cocok dengan filter tidak menampilkan sheet usang. Marker dan sheet memakai fixture yang sama, sehingga tidak menyalin label yang saling bertentangan pada mockup.
- `/filters`, diakses dari Explore/Map: cuisine, minimum Google rating, distance, price, Open Now, Verified halal only, Saved Only, count langsung, Apply dan Reset. Apply menuju source page dengan URL yang dinormalisasi.
- Filter diterapkan sebagai AND. Missing metadata dikecualikan hanya saat filter bersangkutan aktif. Saved Only memakai preview wishlist. Count berasal dari tiga fixtures, bukan angka12 statis dari mockup.

## Assumptions and limitations

Profile bersifat ilustratif, bukan signed-in session. Nama Athallah dan avatar initials AN berasal dari source; privacy copy menjelaskan state memory dan tidak meminta device location. Tidak ada API, authentication, account persistence, real import, real geolocation, atau database write yang ditambahkan.

Harga level2 mengikuti label RpRp pada fixtures source. Hanya ramen memiliki contoh opening status yang diketahui; semua contoh belum memiliki verified halal status. Radius/distance relatif sample Blok M; jarak dari preferred city Bintaro tidak dianggap tersedia. Opening status tetap fixture, bukan informasi restoran live.

Native checkbox dipakai untuk state dan keyboard access. Jam9:41 dari mockup tidak dipalsukan. Identitas Profile menampilkan avatar penuh dengan flow label yang tetap dapat membesar. Backend account lifecycle, privacy enforcement production, dan QA perangkat fisik belum dilakukan.

## Assets and validation

Enam SVG asli20×20 disimpan di `public/figma/account`: profile chevron/pin/shield/user, selected white bookmark, dan preview arrow. Ikon navigation, safe area, Back dan radius PNG existing digunakan kembali. Tidak ada SVG yang digambar ulang, temporary asset URL di runtime, atau missing asset. Browser tests memeriksa naturalWidth dan rendered dimensions.

- `npm run check`: lint, TypeScript,17 unit/integration tests dan formatting lulus.
- Production build Webpack lulus.
- Full E2E54 tests lulus pada Chromium dan Mobile Safari/WebKit.
- Coverage: name validation/focus, session preferences/reload, explicit URL overrides, privacy/account availability, selected pin/Escape/close/reload, return navigation, invalid/deleted selection, AND filters/missing metadata, Apply/Reset, shared Save/Remove, dan existing Explore/detail/health/404.
- Screenshot empat states dibandingkan dengan Figma. Viewport375/390/430/1280 dan landscape844×390, teks2×, keyboard, original icon geometry, serta no client exception diperiksa. Multi-page asset/viewport cases memiliki budget60s; assertion tetap sama, global timeout tidak diubah.
- Kontras baru ink/pink13.04:1; existing white/blue5.30:1 dan muted/canvas5.86:1 memenuhi AA.
- CI sebelumnya mengungkap overflow detail pada font Linux ketika teks2×. Gallery flex items dan menu grid kini dapat menyusut; kata pada tombol/section serta judul video yang panjang dapat wrap. Perubahan hanya resilience teks besar, tidak mengubah tampilan normal. Assertion warna pin menunggu CSS transition selesai dengan Playwright `toHaveCSS`, sehingga tidak membaca warna perantara. CI Linux diperiksa kembali setelah push.

Screenshot otomatis `test-results/phase3-0-*` sampai `phase3-3-*` mewakili Profile, MapPreview, NearbyPreview, dan Filters; folder ini dibuat ulang saat E2E.

## Anti Slop DURING delivery gate

| Item              | Status and evidence                                                                                      |
| ----------------- | -------------------------------------------------------------------------------------------------------- |
| R-02              | PASS: source baru diperiksa, tanpa em dash.                                                              |
| R-03              | PASS: viewport phone/desktop/landscape dan teks2× diperiksa dalam54 browser tests.                       |
| R-17              | PASS: count berasal dari fixtures/state, seluruh screen berlabel illustrative data.                      |
| R-18              | PASS: tidak menambahkan testimonial; nama dan avatar berasal dari Figma pengguna.                        |
| R-23              | PASS: enam SVG asli diunduh; aset existing dipakai kembali tanpa menggambar ulang.                       |
| R-24              | PASS: Profile/Filters, pin/preview/detail dan return links diuji.                                        |
| R-25              | PASS: ink/pink13.04, white/blue5.30 dan muted/canvas5.86 memenuhi AA.                                    |
| R-26              | PASS: tiap control mengubah state, navigasi, atau memberi availability explanation yang terlihat.        |
| R-27              | PASS: loading, empty result, unknown metadata, invalid/removed selection, image failure dan404 tersedia. |
| R-28              | PASS: tidak menambahkan FAQ.                                                                             |
| R-32              | PASS: native links/checkboxes, skip links, dialog Tab loop, Escape dan return focus diuji.               |
| R-33              | PASS: JSX/CSS Modules di source; tidak memakai runtime source-patching script.                           |
| R-34              | PASS: fixed light mengikuti source, tanpa theme toggle tambahan.                                         |
| R-35              | PASS: production build dan54 browser tests lulus, screenshot/control outcomes diperiksa.                 |
| R-36              | PASS: tidak mengklaim signed-in session, real location, privacy enforcement atau live data.              |
| R-37              | PASS: screenshot pengguna dan matching Figma nodes memberi direction; design read di atas.               |
| R-38              | PASS: account dan data dilabeli ilustratif, count/metadata tidak direkayasa.                             |
| R-01              | PASS: tanpa gradient atau glow.                                                                          |
| R-04              | PASS: ikon Profile, selection dan View Details asli sesuai aksi source.                                  |
| R-06              | PASS: native typography mengikuti SF Pro, hierarchy32/22/20/16/14/12.                                    |
| R-07              | PASS: schematic streets existing tetap di slot Map, bukan background dekoratif.                          |
| R-08              | PASS: arrow hanya pada View Details seperti source, tanpa decorative arrows tambahan.                    |
| R-09              | PASS: chip/checkbox/selected pin menandai state yang dapat diubah.                                       |
| R-10              | PASS: tidak memakai glassmorphism.                                                                       |
| R-12              | PASS: elevation dibatasi pada dock dan preview sheet yang menutupi sebagian map.                         |
| R-13              | PASS: tidak ada glow.                                                                                    |
| R-14              | PASS: Profile form, Filter groups, dan map preview memakai komposisi sesuai konten.                      |
| R-19              | PASS: Profile/Filters tanpa animasi baru, pin pulse existing terbatas dan reduced motion tetap diuji.    |
| R-22              | PASS: tidak menambahkan generic illustrations atau avatar photo palsu.                                   |
| Dials             | PASS: Profile/Filters1/1/1; Map mempertahankan finite entry motion2.                                     |
| Dials consistency | PASS: tidak ada infinite loop atau scroll reveal tambahan.                                               |
| Focal point       | PASS: identity pada Profile, selected pin/sheet pada previews, groups pada Filters.                      |
| Whitespace        | PASS: gutter20/gap20 serta section heading48 mengikuti source.                                           |
| Accent            | PASS: yellow action/filter dan blue radius/selected pin menyatakan state.                                |
| Identity          | PASS: palette SPOTTED, source typography, avatar AN dan pill controls dipertahankan.                     |
| Design read       | PASS: screenshot dan Figma direction ditetapkan sebelum implementasi.                                    |
| C-1               | PASS: setiap visual decision ditelusurkan ke source atau kebutuhan focus/validation.                     |
| C-2               | PASS: forms, chips, checkbox, Profile controls, pin, close dan View Details teruji.                      |
| C-3               | PASS: empat states yang diminta, tanpa marketing sections tambahan.                                      |
| C-4               | PASS: responsive, teks besar, keyboard, URL edge cases, missing data dan reload diuji.                   |
| C-5               | PASS: real account/privacy/customer claims tidak ditambahkan.                                            |
| R-05              | PASS: komposisi mengikuti Profile, Filter dan map preview, bukan template generik.                       |
| R-11              | PASS: sheets32, input16, avatar/buttons pill dengan hierarchy source.                                    |
| R-15              | PASS: action spesifik Save name, View Details, Show count, Reset filters.                                |
| R-16              | PASS: tidak ada AI/marketing buzzwords tambahan.                                                         |
| R-20              | PASS: brand direction dan screen composition berasal dari SPOTTED pengguna.                              |
| R-21              | PASS: light theme sesuai referensi.                                                                      |
| R-29              | PASS: existing SPOTTED semantic palette, tanpa warna dekoratif baru.                                     |
| R-30              | PASS: tidak menyalin template produk lain.                                                               |
| R-31              | PASS: alasan type, spacing, palette, avatar, forms, map dan sheet tertulis di atas.                      |

Browser emulation belum menggantikan QA perangkat fisik; integrasi account/provider production tetap terpisah.
