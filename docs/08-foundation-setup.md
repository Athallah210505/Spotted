# 08 · Foundation Setup

19 Oktober 2026 · fondasi lokal setelah pengguna mengizinkan setup project.

## Current functionality

| Area                | Hasil                                                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Framework           | Next.js 16.4.2 App Router, React 19.3.1, TypeScript 6.0.3; Node 24                                                        |
| UI tooling          | Tailwind 4.3.3, konfigurasi shadcn/ui dan helper cn; token awal dari design handoff                                       |
| Server state        | TanStack Query 5.104.4 provider, client terisolasi, retry/background-refetch off; tidak ada persistence provider content  |
| Auth infrastructure | Supabase SSR 0.12.7 + SDK 2.118.0, helper browser dan cookie client untuk Route Handlers/Server Actions                   |
| Configuration       | Zod 4.6.7, environment validation saat Next config dimuat, `.env.example` dan `.env.local` kosong dari kredensial         |
| Structure           | Delapan feature folders sesuai blueprint; routes/features/shared/infrastructure dipisahkan                                |
| Checks              | ESLint, Prettier, strict typecheck, Vitest 5.0.5, Playwright 1.64.1, GitHub Actions workflow                              |
| Local entry         | Root redirect ke `/explore` dengan placeholder teknis, error boundary dan 404 recovery                                    |
| Health              | `/api/health` application-only, no-store; tidak mengklaim database atau provider online                                   |
| Database workspace  | Supabase CLI 2.121.0, config.toml lokal, migrations/tests folders; tidak ada schema produk atau migration yang dijalankan |

Versi exact dan dependencies lengkap terdapat di package-lock.json. Fondasi ini tidak mengganti approved Figma menjadi desain baru; halaman awal sengaja menyatakan discovery belum terhubung.

## Verification evidence

| Check                        | Status | Evidence / batas                                                                                                                                                                        |
| ---------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dependency resolution        | PASS   | Lockfile dibuat ulang dari dependency tree bersih setelah native optional dependency hilang pada instalasi awal; Darwin ARM64 dan Linux x64 bindings tercantum; npm ci dry-run berhasil |
| Lint                         | PASS   | `npm run lint`, zero errors/warnings pada source                                                                                                                                        |
| Typecheck                    | PASS   | `next typegen && tsc --noEmit`                                                                                                                                                          |
| Unit/route integration       | PASS   | 3 files, 9 tests: env defaults/paired credentials/validation/no secret values in errors, query isolation/retry policy, health contract                                                  |
| Formatting                   | PASS   | `npm run format:check`                                                                                                                                                                  |
| Production build             | PASS   | Webpack build selesai: `/`, `/explore`, `/_not-found`, `/api/health`                                                                                                                    |
| Browser E2E                  | PASS   | 6 passed: Chromium dan iPhone-emulated WebKit masing-masing root redirect/no provider request/no client exception/no horizontal overflow, health, keyboard 404 return navigation        |
| Production dependency audit  | PASS   | `npm audit --omit=dev`: found 0 vulnerabilities pada waktu setup                                                                                                                        |
| Local Supabase config syntax | PASS   | Python tomllib parse + assert project ID, confirmations on dan anonymous sign-in off; bukan CLI runtime validation                                                                      |

Tidak ada pengukuran LCP/search latency/retention atau claim production readiness. Browser emulation bukan pengujian iPhone fisik. GitHub Actions file sudah dibuat tetapi workflow belum berjalan di GitHub karena belum ada repository push.

## Constraints dan remaining setup

Development server juga dijalankan pada `http://127.0.0.1:3000`. Pemeriksaan HTTP langsung mengembalikan `200 /explore` setelah root redirect dan `200` untuk `/api/health`; proses ditinggalkan aktif untuk preview lokal.

1. **External credentials:** Supabase cloud, Google Maps/Places, PostHog dan Vercel belum dihubungkan. Tidak ada remote project dibuat, tidak ada deployment, dan tidak ada paid provider request yang dilakukan oleh application.
2. **Local database:** Docker-compatible runtime belum tersedia di PATH. Supabase stack belum berjalan; config disiapkan manual dari documented settings karena init CLI membutuhkan write ke preferensi pengguna di luar workspace dan automatic approval saat itu gagal akibat usage limit. Jalankan/verifikasi stack sebelum migration pertama.
3. **Auth flow:** helper client tersedia, tetapi login UI, callback, verified authorization, cookie-refresh proxy, RLS/schema dan account deletion belum diimplementasikan. Server helper hanya dipakai dari context yang boleh menulis cookie; tidak menelan cookie errors.
4. **Known dev dependency risk:** full npm audit melaporkan 5 high findings pada satu rantai `eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces`, advisory [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm). Registry saat setup menyediakan braces 3.0.3 sebagai latest; audit tidak memberikan patched compatible release. Jangan jalankan `npm audit fix --force` yang menyarankan downgrade Next lint major secara buta. Tidak ada runtime dependency findings pada omit-dev audit. Recheck upstream patch sebelum release.
5. **ESLint compatibility:** ESLint 9.39.5 dikunci karena plugin React/import/a11y pada official Next lint config belum mendeklarasikan dukungan ESLint 10. Registry menandai ESLint 9 deprecated; upgrade sebagai satu set ketika peer dependencies mendukung, bukan mengabaikan peer errors dengan force.
6. **Build engine:** Turbopack gagal bind IPC port di sandbox, termasuk percobaan elevated. Menggunakan supported `--webpack` pada dev/build menyelesaikan production build. Tidak ada custom bundler/plugin tambahan.
7. **Feature decisions:** canonical Figma, private-link removal lifecycle, budgets/data policies, moderation ownership dan keputusan lain tetap mengikuti gate blueprint. Belum ada produk UI, data fixture restoran yang diperlakukan nyata, offline/PWA installability atau feature API stub palsu.
8. **Version control:** setup tidak mengubah repository induk di home directory, membuat remote repository, melakukan commit atau push. Workflow siap digunakan setelah workspace dikelola sebagai repository project.

## Scope tahap berikutnya

Fondasi lokal siap untuk feature work. Mulai vertical slice Explore → Detail → Login → Save → Wishlist; configure development services dan jalankan bounded integration smoke sebelum mengaktifkan flow live. Lihat [roadmap](06-roadmap-and-decisions.md) untuk gate tiap module dan [README project](../README.md) untuk perintah sehari-hari.

Referensi konfigurasi: [Next.js installation / supported Webpack option](https://nextjs.org/docs/app/getting-started/installation), [Supabase SSR clients](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [Supabase local config](https://supabase.com/docs/guides/local-development/cli/config), [Playwright browsers](https://playwright.dev/docs/browsers).
