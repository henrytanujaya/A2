-- ============================================================
-- Docker Fix: Tambah kolom-kolom yang hilang ke tabel CartItems
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.CartItems') AND name = 'Name')
BEGIN
    ALTER TABLE CartItems ADD Name NVARCHAR(500) NULL;
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.CartItems') AND name = 'Price')
BEGIN
    ALTER TABLE CartItems ADD Price DECIMAL(18,2) NULL;
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.CartItems') AND name = 'ImageURL')
BEGIN
    ALTER TABLE CartItems ADD ImageURL NVARCHAR(MAX) NULL;
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.CartItems') AND name = 'Details')
BEGIN
    ALTER TABLE CartItems ADD Details NVARCHAR(MAX) NULL;
END
