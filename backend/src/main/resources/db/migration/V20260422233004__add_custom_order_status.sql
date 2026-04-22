-- V4: Tambahkan kolom Status ke tabel CustomOrders
-- Dibutuhkan untuk workflow: Pending Review → Quoted → Ordered → In Production → Completed

IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'CustomOrders' AND COLUMN_NAME = 'Status'
)
ALTER TABLE CustomOrders ADD Status NVARCHAR(50) NOT NULL DEFAULT 'Pending Review';
