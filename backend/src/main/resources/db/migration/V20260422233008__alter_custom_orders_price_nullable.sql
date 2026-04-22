-- Mengubah kolom Price pada tabel CustomOrders agar mengizinkan NULL
-- Harga akan bernilai NULL saat customer melakukan request, dan baru diisi oleh Admin setelah proses review.

ALTER TABLE CustomOrders ALTER COLUMN Price DECIMAL(18,2) NULL;
