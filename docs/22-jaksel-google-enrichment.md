# Pelengkapan katalog Jaksel

28 Oktober 2026. Katalog aplikasi bertambah dari 37 menjadi **104 tempat**. Seluruh 100 kandidat riset telah diperiksa: 67 dipublikasikan, 19 listing ditandai tutup oleh Google, dan 14 ditahan karena nama/alamat cabang, koordinat, atau jumlah ulasan belum memenuhi syarat.

Tambahan tersedia melalui katalog yang sama di Explore, detail, Wishlist, API, dan Map. Setiap tempat baru memiliki foto lokal yang diperiksa visual, rating dan jumlah rating Google, koordinat, serta lima cuplikan ulasan dari penulis berbeda dengan tautan profil sumber. Jam buka hanya diisi ketika tersedia. Menu dan harga yang belum diperoleh tetap kosong.

## Integritas data

- ID baru memakai `jaksel/<slug>`; URL lama `osm-*` tetap bekerja. Identitas OSM tidak dibuat untuk kandidat yang bukan hasil OSM.
- Nama/alamat dicocokkan dengan sumber direktori. Penggabungan capture Google mensyaratkan identitas cabang yang cocok; sumber koordinat dan ulasan dicatat terpisah bila diperlukan.
- Import mempertahankan 37 record lama. Sebelum penggantian file secara atomik, snapshot melewati schema Zod yang juga digunakan aplikasi, pemeriksaan ID unik, lima penulis berbeda, dan keberadaan foto lokal.
- Pengambilan menggunakan Scrapling headless. Tidak ada aktivasi billing, API berbayar, atau perubahan Supabase. Data yang dilihat aplikasi tetap katalog JSON lokal.

## Verifikasi

Schema dan validator riset lulus untuk 104 tempat aplikasi dan 100 kandidat. Unit tests: 34 lulus; Python parser tests: 23 lulus. Production build dan ESLint lulus. Seluruh 90 skenario browser lulus setelah pemeriksaan ulang: 84 lulus pada run paralel awal, empat lulus saat diulang berurutan, dan dua test Map lulus setelah memilih marker berdekatan lewat keyboard. Cakupan termasuk pencarian tempat baru, foto, detail, lima ulasan, Wishlist, serta marker Map pada desktop dan mobile. API preview port 3000 mengembalikan schemaVersion 2 dengan 104 tempat. Typecheck dan pemeriksaan whitespace juga lulus.

## Batas data

Ini snapshot, bukan pembaruan Google langsung. Sebanyak 37 record lama tidak diambil ulang dalam pekerjaan ini. Status tutup mengikuti label Google saat pengambilan; 14 kandidat lainnya belum dipublikasikan. Ringkasan dan sumber setiap kandidat tersedia di [laporan pelengkapan](../research/jaksel-100-2026-10-28/completion.md).
