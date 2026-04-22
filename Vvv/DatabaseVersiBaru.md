# Rencana Strategis: Database Versi Baru

Berdasarkan permintaan Anda, berikut adalah poin-poin rencana perombakan database dan integrasi sistem:

## 1. Pembersihan Data
- **Hapus**: `backend/src/main/resources/db/migration/V3__insert_bulk_dummy_data.sql`
- **Tujuan**: Menghilangkan data dummy massal (500 user & 500 produk) yang tidak relevan untuk pengembangan tahap awal.

## 2. Peningkatan Kualitas Katalog (Mock Data)
- **Modifikasi**: `backend/src/main/resources/db/migration/V2__insert_mock_data.sql`
- **Target**: Menambah jumlah produk dari 4 menjadi **25 jenis produk** yang tersebar di kategori ActionFigure, Outfit, Manga, dan BluRay.
- **Kualitas**: Penambahan nama produk yang lebih unik dan deskripsi yang mendetail.

## 3. Standarisasi Penamaan File (Versioning)
- **Perubahan**: Mengubah prefix `V1__`, `V2__` menjadi format **Timestamp** agar migrasi lebih fleksibel.
- **Format**: `V20260422HHMMSS__nama_file.sql` (TahunBulanHariJamMenitDetik).
- **Alasan**: Menghindari konflik nomor urut saat tim developer bekerja secara paralel.

## 4. Konfigurasi Ulang (Clean Install)
- Melakukan pembersihan total database (Drop all tables & history).
- Menjalankan migrasi ulang secara bersih dari skema awal (V1).

## 5. Integrasi End-to-End
- **Backend**: Verifikasi API `/products` mengembalikan 25 item.
- **Frontend**: Memastikan halaman katalog menampilkan grid produk baru secara sempurna.

## 6. Skenario Pengetesan (Live Preview)
Pengujian akan dilakukan menggunakan browser otomatis untuk mensimulasikan aktivitas user:
- **Login**: Menggunakan kredensial admin (`admin@otaku.com`).
- **Navigasi**: Membuka menu Produk, Pesanan, dan Diskon untuk memastikan integritas data.
- **Logout**: Memastikan pembersihan sesi token di Redis/Browser.

---
*Status: Menunggu Persetujuan untuk Eksekusi.*
