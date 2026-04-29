# Panduan Penghapusan Dummy Data

Dokumen ini menjelaskan cara menghapus data dummy User dan mengurangi jumlah data Product tanpa merusak integritas sistem atau menyebabkan error pada Flyway Migration.

## 1. Strategi: Gunakan Migration Baru (Bukan Hapus File Lama)
**PENTING:** Jangan menghapus atau mengubah file `V3__insert_bulk_dummy_data.sql` yang sudah ada. Mengubah file lama akan menyebabkan **Flyway Checksum Error** yang mengakibatkan aplikasi gagal dijalankan karena riwayat migrasi tidak cocok dengan file fisik.

Cara terbaik adalah membuat migrasi baru (misalnya `V8__cleanup_dummy_data.sql`) yang berisi perintah `DELETE`.

## 2. Langkah-Langkah Penghapusan

### A. Menghapus Dummy Users
Kita akan menghapus user yang memiliki domain `@otakustore.com` (yang dibuat di V3).
User utama seperti `admin@otaku.com` atau `budi@gmail.com` akan tetap aman.

```sql
-- Hapus user dummy dari V3
DELETE FROM Users 
WHERE Email LIKE '%@otakustore.com';
```

### B. Mengurangi Data Product Menjadi 50
Di file `V3`, produk diberi nama dengan akhiran `#nomor` (contoh: `Scale Figure Edition #100`). Kita akan menghapus produk yang memiliki nomor di atas 50.

```sql
-- Hapus produk dummy dari V3 yang urutannya di atas 50
-- Kita menggunakan pola nama untuk mengidentifikasi produk V3
DELETE FROM Products 
WHERE (Name LIKE '% #5[1-9]' 
   OR Name LIKE '% #[6-9][0-9]' 
   OR Name LIKE '% #[1-4][0-9][0-9]' 
   OR Name LIKE '% #500');
```
*Catatan: Regex SQL Server di atas akan menangkap angka 51-500.*

## 3. Implementasi Otomatis via Flyway

Untuk menerapkan perubahan ini secara permanen di seluruh lingkungan (development/production):

1. Buat file baru di folder `backend/src/main/resources/db/migration/V8__cleanup_dummy_data.sql`.
2. Isi dengan script berikut:

```sql
-- =============================================
-- V8: Cleanup Dummy Users & Reduce Products
-- =============================================

-- 1. Hapus User Dummy (user1@otakustore.com - user500@otakustore.com)
-- Pastikan tidak ada relasi Order yang menggantung (Optional: ON DELETE CASCADE biasanya sudah menangani ini)
DELETE FROM Users WHERE Email LIKE '%@otakustore.com';

-- 2. Hapus Product Dummy V3 yang index-nya > 50
-- Pola: '% #51' sampai '% #500'
DELETE FROM Products 
WHERE Name LIKE '% #%' 
AND CAST(SUBSTRING(Name, CHARINDEX('#', Name) + 1, LEN(Name)) AS INT) > 50;
```

## 4. Penanganan Jika Terjadi Error Relasi (Foreign Key)
Jika muncul error `The DELETE statement conflicted with the REFERENCE constraint`, itu berarti ada data di tabel `Orders` atau `OrderItems` yang menggunakan data dummy tersebut. 

Solusinya:
1. Hapus isi keranjang/order dummy terlebih dahulu.
2. Atau gunakan `TRUNCATE` jika Anda ingin membersihkan seluruh data transaksi selama fase development.

---
**Rekomendasi:** Simpan panduan ini dan jalankan migrasi V8 jika Anda ingin tim lain juga mendapatkan perubahan data yang sama secara otomatis saat mereka melakukan `git pull`.
