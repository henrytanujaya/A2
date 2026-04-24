-- ============================================================
-- Fase 2: Database Alignment — Menambahkan kolom yang dibutuhkan
-- frontend tapi belum ada di schema database.
-- ============================================================

-- ─── 1. Products: Tambah CreatedAt untuk fitur "New Arrivals" sorting ─────
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'Products' AND COLUMN_NAME = 'CreatedAt'
)
ALTER TABLE Products ADD CreatedAt DATETIME DEFAULT GETDATE();

-- ─── 2. Products: Tambah Rating untuk tampilan bintang di frontend ────────
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'Products' AND COLUMN_NAME = 'Rating'
)
ALTER TABLE Products ADD Rating INT DEFAULT 0;

-- ─── 3. Products: Tambah Weight (gram) untuk kalkulasi ongkos kirim ───────
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'Products' AND COLUMN_NAME = 'Weight'
)
ALTER TABLE Products ADD Weight INT DEFAULT 500;

-- ─── 4. Users: Tambah Phone untuk halaman Profil ─────────────────────────
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'Phone'
)
ALTER TABLE Users ADD Phone NVARCHAR(20) NULL;

-- ─── 5. Users: Tambah Address untuk Checkout & Profil ────────────────────
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'Address'
)
ALTER TABLE Users ADD Address NVARCHAR(MAX) NULL;

-- ─── 6. Orders: Tambah UpdatedAt untuk tracking perubahan status ─────────
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'Orders' AND COLUMN_NAME = 'UpdatedAt'
)
ALTER TABLE Orders ADD UpdatedAt DATETIME NULL;

-- ─── 7. Orders: Tambah ShippingAddress untuk alamat pengiriman ───────────
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'Orders' AND COLUMN_NAME = 'ShippingAddress'
)
ALTER TABLE Orders ADD ShippingAddress NVARCHAR(MAX) NULL;

-- ─── 8. Orders: Tambah CourierName untuk ekspedisi pengiriman ─────────────
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'Orders' AND COLUMN_NAME = 'CourierName'
)
ALTER TABLE Orders ADD CourierName NVARCHAR(50) NULL;
