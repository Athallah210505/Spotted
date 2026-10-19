# Supabase local workspace

`config.toml` hanya untuk stack lokal. Konfigurasi ini tidak membuat atau mengubah project cloud.

CLI sudah tercantum di devDependencies. Menjalankan stack membutuhkan Docker-compatible runtime yang aktif:

```sh
npm run db:start
npm run db:status
```

Ambil URL dan publishable key lokal dari output CLI ke `.env.local`; jangan commit nilainya. Email pengujian tersedia di local inbox port 54324. Gunakan host app yang sama saat memulai login dan membuka link email agar cookie PKCE konsisten.

Folders `migrations/` dan `tests/` disiapkan, belum berisi schema produk atau RLS. Login UI, callback, session refresh proxy, typed database model, dan security tests dibuat bersama fitur Authentication/Wishlist setelah aturan lifecycle disepakati. Client helper yang tersedia memakai publishable key; tidak ada service-role bypass.

Server helper saat ini untuk Route Handlers/Server Actions yang dapat menulis cookie. Jangan memakainya sebagai RSC session-refresh solution: proxy dan server-side session verification perlu diimplementasikan bersama auth flow. Cookie write failures tidak disembunyikan.

Database lokal belum dijalankan dan konfigurasi belum diverifikasi oleh CLI pada mesin ini. Sebelum migration pertama, jalankan stack dan verifikasi konfigurasi dengan versi CLI yang dikunci di lockfile. Jangan menjalankan migration pada production dari setup ini.
