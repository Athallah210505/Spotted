# Import TikTok and sign-in preview

20 Oktober 2026. Screenshot pengguna dicocokkan dengan Figma `Sxg2J06MrgCE0ywAviBDNu`, page `3:2`: Login `2029:2037`, ImportSave `2029:2065`, ImportSuccess `2029:2093`, Reviews `2029:2119`. Keempat design context dan screenshot dibaca sebelum implementasi.

## Confirmed information

Source Login secara eksplisit menyebut simulated email-link flow. Implementasi tetap preview tanpa authentication, email delivery, TikTok fetch, restaurant matching, persistence atau production privacy enforcement. Reviews sudah tersedia pada `/restaurant/kedai-ramen-sore?tab=reviews` dan digunakan kembali.

Design read: mobile SPOTTED dengan canvas terang, native system typography mengikuti SF Pro, gutter/gap20, yellow untuk primary action dan green untuk saved confirmation. Dials ENERGY1/RHYTHM1/MOTION1; tidak menambahkan animasi. Hero216px, compact photo88px, confirmation72px, action min-height48px mengikuti source. Header panjang dan cards dapat tumbuh saat teks membesar; tidak menyalin clipping source.

## Current functionality

- Wishlist → Add from TikTok → `/import`: paste URL dan pilih salah satu dari tiga restoran contoh. Konfirmasi menuju `/import?step=confirm`. Tidak mengklaim deteksi restoran otomatis; step pemilihan restoran digabung dengan form link.
- Parser hanya menerima HTTPS TikTok video paths atau `vm.tiktok.com` / `vt.tiktok.com` share paths, tanpa credentials, port khusus atau lookalike hosts. Batas input2048 karakter; query/fragment dihapus. Share links tidak di-resolve. Tidak ada request server ke URL tersebut.
- Confirm: kartu restoran, video link, Change restaurant dialog dengan native Escape/focus return, Edit link, dan Save to Wishlist. Missing draft punya recovery Add a TikTok link, tanpa fake imported video.
- Save pertama menuju `/login?from=import`. Email divalidasi pada form, lalu dihapus dari input. UI menyatakan tidak ada email dikirim. Pengguna harus memilih Continue preview sign-in sebelum pending import disimpan. Keep browsing mempertahankan draft tanpa menyimpannya.
- `/login` juga dapat dibuka dari Profile. Hanya `from=import` yang diterima sebagai tujuan resume; external destinations/repeated parameters diabaikan. Tidak menyimpan email dalam URL, context, storage atau mengirimkannya lewat API.
- State previewSignedIn hanya menandai simulasi dalam memory, bukan authorization atau real account. Existing sample saves/Profile tetap berfungsi; tidak menambahkan auth gate ke discovery existing.
- Save idempotent: restoran yang sudah disimpan tidak terduplikasi. Satu link per restoran per sesi; import berikutnya mengganti link restoran itu setelah pengguna memilih Save. Menghapus restoran juga menghapus link dan saved confirmation terkait.
- Success menampilkan restoran yang benar dan menyatakan state selama sesi. Open Wishlist dan Find it on the map mengarah ke kota/marker restoran tersebut. Deep link/reload tanpa import sukses menampilkan recovery, bukan fake success.
- Tab TikTok detail menerima personal video melalui app composition. Imported links membuka URL tervalidasi dalam tab baru dengan `noopener noreferrer`; sample unavailable video dan public-video empty state tetap tersedia. Link tidak dipublikasikan ke katalog.

## Assumptions and limitations

Tidak ada backend baru atau dependency baru. Semua domain data tetap illustrative fixtures. Reload menghapus draft, imported links dan simulated sign-in, lalu memulihkan sample Wishlist existing. Privacy copy diubah dari “saved privately” menjadi penjelasan memory/session agar tidak menjanjikan keamanan production. Real Supabase Auth, SMTP, callback, RLS, multi-video collections dan matching perlu vertical slice tersendiri.

## Assets and validation

Photo login asli dan check24/map20 SVG diunduh sesuai instruksi Figma ke `public/figma/journey/`. Compact card memakai photo fixture yang sama dengan detail. Back24, locate16, video32, external20 dan bookmark20 menggunakan aset existing yang cocok persis. Tidak memakai screenshot sebagai asset, tidak menggambar ulang SVG, dan tidak ada temporary Figma URL pada runtime.

Pemeriksaan mencakup lint, TypeScript, unit parser, production build, Chromium dan Mobile Safari/WebKit. Browser coverage meliputi invalid/empty links, spoofed hosts, empty/invalid email, simulated resume, Keep browsing, modal focus, duplicate saves, removal/reload recovery, saved link pada restoran yang benar, destination sanitization, no POST, original image decoding, empat reference states, responsive375/390/430/1280 serta teks2×. Screenshot disimpan dalam `test-results/journey-*-*.png` dan dibandingkan dengan Figma. QA perangkat fisik dan provider live belum dilakukan.

Perbaikan CI sebelumnya ikut diselesaikan: long video headings dapat wrap pada WebKit Linux saat teks2×; assertion warna pin menggunakan `toHaveCSS` untuk menunggu transition selesai.

Dua journey lintas halaman dan screenshot case memiliki budget60s; timeout assertion tetap5s. Local suite memakai satu worker untuk menghindari resource contention, tanpa mengubah konfigurasi CI/global timeout.

## Anti Slop DURING delivery gate

| Check       | Status and evidence                                                                                                 |
| ----------- | ------------------------------------------------------------------------------------------------------------------- |
| R-02        | PASS: copy baru tanpa em dash.                                                                                      |
| R-03        | PASS: mobile, desktop, text2× dan long headers dapat wrap.                                                          |
| R-17        | PASS: rating/count berasal dari fixtures berlabel illustrative.                                                     |
| R-18        | PASS: tidak menambahkan testimonial; review source tetap berlabel illustrative.                                     |
| R-23        | PASS: photo/check/map asli diunduh; exact matching assets existing dipakai kembali.                                 |
| R-24        | PASS: seluruh links menuju routes existing atau URL pengguna yang tervalidasi.                                      |
| R-25        | PASS: ink/canvas16.86:1, muted/canvas5.86:1, white/blue5.30:1, ink/green11.87:1 dan error/canvas6.66:1 memenuhi AA. |
| R-26        | PASS: forms, selection, dialog, save/resume, external links dan navigation memiliki outcome.                        |
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
| R-14        | PASS: hero, compact restaurant, video card dan confirmation berbeda sesuai content.                                 |
| R-19        | PASS: tanpa motion baru, reduced-motion existing dipertahankan.                                                     |
| R-22        | PASS: memakai source food photography, tanpa generic illustration tambahan.                                         |
| Dials       | PASS: ENERGY1/RHYTHM1/MOTION1, konsisten tanpa loop animation.                                                      |
| Focal point | PASS: food hero pada Login, selected restaurant pada Confirm, check/h1 pada Success.                                |
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
| R-11        | PASS: hero/input/cards16, confirmation72-circle, actions pill sesuai source.                                        |
| R-15        | PASS: CTA spesifik Confirm recommendation, Save to Wishlist dan Continue preview sign-in.                           |
| R-16        | PASS: tanpa AI marketing buzzwords.                                                                                 |
| R-20        | PASS: brand/content SPOTTED dari referensi pengguna.                                                                |
| R-21        | PASS: source light theme.                                                                                           |
| R-29        | PASS: semantic source palette, error color dipakai hanya untuk validation.                                          |
| R-30        | PASS: tidak menyalin template produk lain.                                                                          |
| R-31        | PASS: alasan type, spacing, photos, color, cards dan controls tercatat di atas.                                     |

Gate ini mencakup preview UI; provider production dan QA perangkat fisik tetap belum diverifikasi.
