# SPOTTED — Technical Architecture Blueprint

Versi 1.0 · 19 Oktober 2026 · **Draft for architecture review**

Status implementasi terbaru: [Foundation setup](08-foundation-setup.md). Blueprint di bawah merupakan snapshot perencanaan sebelum coding dimulai; setup lokal kemudian dibuat atas instruksi pengguna.

Explore kemudian diimplementasikan dari node pilihan pengguna; lihat [implementasi Explore dan QA](09-explore-implementation.md) untuk status preview saat ini.

Halaman detail berikutnya mengikuti Figma dan screenshot pengguna; lihat [implementasi detail dan QA](10-restaurant-detail-implementation.md) untuk galeri, Menu, Reviews, TikTok, dan shared preview saves.

Tahap selanjutnya mencakup [Map, Wishlist List/Map dan QA](11-map-wishlist-implementation.md), termasuk shared navigation, radius, dan return path dari detail.

Tahap berikutnya mencakup [Profile, selected-place previews, Filters dan QA](12-profile-previews-filters.md), dengan session preferences dan filter URL yang berlaku pada Explore/Map.

[Import TikTok, sign-in preview dan QA](13-import-login-preview.md) melanjutkan journey dengan konfirmasi restoran, save link per sesi, success screen, dan Reviews existing.

[Email Sent, Saved, Sort dan QA](14-email-saved-sorting.md) menambahkan resend simulasi, hasil save detail, dan sorting yang mempertahankan filter/navigasi.

[Data Google di Explore dan QA](16-google-explore-data.md) menjelaskan32 tempat dengan foto/rating/review Google, jam buka, UI Explore langsung dan batas snapshot. [Jakarta data pilot awal](15-jakarta-data-pilot.md) dipertahankan sebagai riwayat importer OSM.

Blueprint ini menerjemahkan PRD MVP v1.0 dan Figma v2 menjadi keputusan engineering. Dokumen belum merupakan persetujuan implementasi. Tidak ada aplikasi, migration, dependency, service, atau deployment yang dibuat.

## Urutan baca

1. [System overview dan keputusan stack](00-system-overview.md)
2. [Frontend, Figma traceability, dan state](01-frontend-and-state.md)
3. [Backend dan API contracts](02-backend-and-api.md)
4. [Database, ownership, dan RLS](03-database.md)
5. [Integrasi, map, nearby, dan TikTok](04-integrations-and-maps.md)
6. [Security, performance, cost, testing, dan operasi](05-production-readiness.md)
7. [Roadmap, ADR, dan coding readiness](06-roadmap-and-decisions.md)
8. [Evidence, sumber resmi, dan reconciliation log](07-evidence-and-gaps.md)

Diagram editable: [System architecture](diagrams/system-architecture.drawio), [ERD](diagrams/database-erd.drawio). Diagram Mermaid juga tersedia di dokumen agar tetap terbaca tanpa draw.io.

## Research data

[100 kandidat kuliner Jakarta Selatan, 28 Oktober 2026](../research/jaksel-100-2026-10-28/README.md): daftar tempat/menu, CSV dan JSON dengan sumber. Kandidat belum dipublikasikan ke Explore; rating dan cabang Google belum diverifikasi.

## Keputusan utama

Feature-based modular monolith: satu Next.js application di Vercel, Route Handlers sebagai BFF, Supabase Auth + PostgreSQL dengan RLS, Google Maps/Places melalui batas integrasi eksplisit. React local state + URL + TanStack Query, tanpa Zustand. Data wishlist persisten menyimpan identitas tempat, bukan salinan katalog Google.

## Batas validasi

PRD resmi dibaca melalui Google Drive. Page Figma `3:2` diperiksa melalui MCP metadata; teks flow penting dibaca melalui Plugin API read-only; screenshot Explore kedua set dan Wishlist Map diperiksa. Seluruh screen utama dan recovery terinventarisasi, tetapi tidak semua frame diverifikasi secara visual atau prototype diklik satu per satu.

**Blocking untuk handoff visual final:** terdapat dua set screen bernama sama. Owner perlu menentukan set canonical. Blueprint memakai set `5:*` sebagai referensi sementara berdasarkan catatan polish, tanpa mengubah Figma.

**Blocking untuk konfigurasi production:** Google billing region/terms, budget API, domain, auth email/SMTP, dan ownership operasi belum dikonfirmasi. Detail ada di coding readiness. Target performa dan biaya belum diukur.
