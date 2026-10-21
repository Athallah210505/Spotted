# Email Sent, Saved, and Sort

21 Oktober 2026. Referensi screenshot pengguna dicocokkan dengan empat design context dan screenshot Figma `Sxg2J06MrgCE0ywAviBDNu`: Videos `2029:2145`, EmailSent `2029:2168`, Saved `2029:2193`, Sort `2029:2219`. Tidak ada dependency atau provider baru.

## Confirmed information

Tab TikTok sudah sesuai dengan source dan dipakai kembali. EmailSent melanjutkan simulated sign-in existing; source sendiri memakai tombol Simulate verified sign-in. Formula Recommended telah dikonfirmasi pada [Integrations and maps](04-integrations-and-maps.md): `(v*R + 100*C)/(v+100)`, C adalah mean rated candidates sebelum UI post-filter.

Design read: mobile SPOTTED dengan native system font mengikuti SF Pro, canvas terang, gutter/gap20, tombol pill48, blue check48 untuk email, dan green confirmation72 untuk saved state. Saved memakai existing restaurant card dengan photo176 dan details124. Dials ENERGY1/RHYTHM1/MOTION1; tidak ada motion baru. Whitespace dan typography mempertahankan hierarchy source.

## Current functionality

- Submit email valid pada Login menuju `/login/sent`, dengan `from=import` dipertahankan hanya untuk enum source tersebut. Email tidak disimpan dalam context, URL, storage atau dikirim lewat API.
- Email Sent menampilkan Check your inbox, Simulate verified sign-in, Resend, Change email address, dan Keep browsing. Header/copy menyatakan preview tanpa email delivery atau verified session nyata. Resend memperbarui live status/counter; tidak membuat request email.
- Simulate sign-in melanjutkan import yang valid ke existing import success, atau menuju Profile. Missing/reloaded/completed email request menampilkan recovery Enter email address. Tidak ada auth callback/authorization production yang ditambahkan.
- Save baru pada detail membuka `/saved/[placeId]`; Remove tetap menghapus langsung. Halaman menampilkan status saved, card restoran yang benar, View Wishlist dan Back to restaurant. Source/filter/sort/radius/selected marker yang valid dipertahankan oleh helper navigation yang sama dengan detail. URL tujuan eksternal tidak diterima.
- Saved state berasal dari React context. Restoran yang sudah dihapus menampilkan recovery, bukan confirmation usang. Sample saved IDs tetap kembali saat reload seperti preview sebelumnya. ID restoran tak dikenal divalidasi sebelum loading boundary agar response tetap404.
- Explore menyediakan entry Sort places. `/sort` menampilkan Recommended, Highest Rated, Most Reviewed dan Nearest. Selection langsung kembali ke hasil dengan URL `sort` tervalidasi; Back tidak mengubah sort.
- Highest Rated tetap menjadi default preview agar urutan existing/source tetap sama. Recommended memakai formula blueprint dengan C dari tiga fixture candidates sebelum post-filter. Most Reviewed memakai count desc; Highest Rated memakai rating desc. Tie-breakers count/rating lalu ID mengikuti blueprint, tanpa memutasi input.
- Nearest memakai unrounded sample distance dari Blok M dan rating/ID untuk ties. Tanpa known sample origin (preferred city Tangerang Selatan), control disabled dengan penjelasan. URL Nearest tanpa origin secara eksplisit menampilkan fallback Highest Rated; tidak mengarang jarak pengguna.
- Query, category, advanced filters dan sort tetap terbawa saat berpindah Filter, Map dan detail. Wishlist tetap memakai urutan distance existing. Hasil kosong, invalid/repeated sort values dan unknown detail IDs memiliki handling/recovery existing.

## Assumptions and limitations

Tidak menghubungkan SMTP/Supabase Auth, Google/TikTok APIs, persistent storage atau device location. Simulated sign-in bukan security boundary. Preview sample saves masih dapat dipakai tanpa real account seperti sebelumnya. Default production Recommended dan verified-session enforcement tetap pekerjaan backend; tidak mengubah semua sample save controls menjadi auth gate hanya untuk menambahkan supporting screens.

## Assets and validation

Satu blue check SVG asli48×48 diunduh ke `public/figma/journey/email-check.svg`. Back24, locate16, black check24, bookmark20, video32, external20, search32 dan ramen photo dipakai kembali dari exact matching assets existing. Tidak menggambar ulang ikon atau memakai screenshot sebagai asset. Browser checks memeriksa image decode, visibility, natural dimensions dan screenshot empat states.

Lint aplikasi, TypeScript,22 unit/integration tests dan production build diperiksa. Unit tests mencakup enum whitelist, URL round-trip, formula weighted, ranking/ties/immutability dan safe return navigation. Browser checks mencakup pending import resume, resend/edit/no POST, reload recovery, save/remove confirmation,404, Sort→Filter→Map→detail, disabled Nearest, original icon geometry,375/390/430/1280 dan landscape844×390 serta teks2×. Screenshots berada di `test-results/final-*-*.png`.

Beberapa script Figma `spotted-v3-*` muncul sebagai untracked files dari pekerjaan lain saat pemeriksaan. File tersebut tidak diubah atau dimasukkan ke commit ini. Local lint mengecualikan script itu; formatting source/tests dan dokumen tugas diperiksa secara terpisah. CI memeriksa tracked repository dengan commands normal.

Physical-device QA, email delivery, production auth/RLS dan live-provider integration belum dilakukan.

## Anti Slop DURING delivery gate

| Check       | Status and evidence                                                                                                 |
| ----------- | ------------------------------------------------------------------------------------------------------------------- |
| R-02        | PASS: copy baru tanpa em dash.                                                                                      |
| R-03        | PASS: mobile, desktop, text2× dan long headers dapat wrap.                                                          |
| R-17        | PASS: rating/count berasal dari fixtures berlabel illustrative.                                                     |
| R-18        | PASS: tidak menambahkan testimonial; review source tetap berlabel illustrative.                                     |
| R-23        | PASS: blue check48 asli diunduh; exact matching icons dan photo existing dipakai kembali.                           |
| R-24        | PASS: seluruh links menuju routes existing atau URL pengguna yang tervalidasi.                                      |
| R-25        | PASS: ink/canvas16.86:1, muted/canvas5.86:1, white/blue5.30:1, ink/green11.87:1 dan error/canvas6.66:1 memenuhi AA. |
| R-26        | PASS: forms, sort selection, resend, save/resume, external links dan navigation memiliki outcome.                   |
| R-27        | PASS: per-route loading, validation, missing draft/success recovery, unavailable sample video dan image fallback.   |
| R-28        | PASS: tanpa FAQ tambahan.                                                                                           |
| R-32        | PASS: native forms/select/links, labels, skip link, dialog focus loop/Escape/return.                                |
| R-33        | PASS: JSX/CSS Modules di source, tanpa runtime source patching.                                                     |
| R-34        | PASS: light theme source, tanpa theme toggle tambahan.                                                              |
| R-35        | PASS: build, browser flows, asset decoding dan screenshots diperiksa.                                               |
| R-36        | PASS: tidak mengklaim email terkirim atau signed-in real account.                                                   |
| R-37        | PASS: empat Figma context/screenshots dan design read di atas.                                                      |
| R-38        | PASS: restoran/rating/photo berasal dari source, user links berasal dari input.                                     |
| R-01        | PASS: tanpa gradient/glow.                                                                                          |
| R-04        | PASS: bookmark untuk save, check untuk confirmation, external untuk link, map untuk destination.                    |
| R-06        | PASS: native font mengikuti source32/22/20/16/14/12 hierarchy.                                                      |
| R-07        | PASS: tanpa decorative background grid.                                                                             |
| R-08        | PASS: tanpa decorative arrows tambahan.                                                                             |
| R-09        | PASS: step label menjelaskan posisi journey; tidak ada marketing badges.                                            |
| R-10        | PASS: tanpa glassmorphism.                                                                                          |
| R-12        | PASS: tanpa shadows baru pada setiap card.                                                                          |
| R-13        | PASS: tanpa glow.                                                                                                   |
| R-14        | PASS: email notice, restaurant card, video card dan sort choices berbeda sesuai content.                            |
| R-19        | PASS: tanpa motion baru, reduced-motion existing dipertahankan.                                                     |
| R-22        | PASS: memakai source food photography, tanpa generic illustration tambahan.                                         |
| Dials       | PASS: ENERGY1/RHYTHM1/MOTION1, konsisten tanpa loop animation.                                                      |
| Focal point | PASS: blue check pada Email, restaurant/saved notice pada Saved, selection pada Sort.                               |
| Whitespace  | PASS: gutter/gap20 memisahkan identity, form dan actions.                                                           |
| Accent      | PASS: yellow primary action, green confirmation sesuai source.                                                      |
| Identity    | PASS: SPOTTED palette, typography dan restaurant content dipertahankan.                                             |
| Design read | PASS: direction dibaca sebelum implementasi.                                                                        |
| C-1         | PASS: visual decisions mengikuti source atau validation/focus requirements.                                         |
| C-2         | PASS: setiap control memiliki outcome dan diuji.                                                                    |
| C-3         | PASS: tanpa marketing/template sections tambahan.                                                                   |
| C-4         | PASS: missing state, invalid input, duplicate, removal, reload dan text resizing ditangani.                         |
| C-5         | PASS: tidak menambahkan fabricated security/customer claims.                                                        |
| R-05        | PASS: composition mengikuti empat source screens.                                                                   |
| R-11        | PASS: card24, notice16 dan action pills mengikuti source.                                                           |
| R-15        | PASS: CTA spesifik Simulate verified sign-in, Resend sign-in link dan View Wishlist.                                |
| R-16        | PASS: tanpa AI marketing buzzwords.                                                                                 |
| R-20        | PASS: brand/content SPOTTED dari referensi pengguna.                                                                |
| R-21        | PASS: source light theme.                                                                                           |
| R-29        | PASS: semantic source palette, error color dipakai hanya untuk validation.                                          |
| R-30        | PASS: tidak menyalin template produk lain.                                                                          |
| R-31        | PASS: alasan type, spacing, photos, color, cards dan controls tercatat di atas.                                     |

Gate ini mencakup preview UI; provider production dan QA perangkat fisik tetap belum diverifikasi.
