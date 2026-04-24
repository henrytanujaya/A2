-- ============================================================
-- Fase 4: Order Tracking - Tabel Riwayat Status Pengiriman
-- ============================================================

IF OBJECT_ID(N'dbo.OrderTracking', N'U') IS NULL
BEGIN
    CREATE TABLE OrderTracking (
        TrackingID INT IDENTITY(1,1) PRIMARY KEY,
        OrderID INT NOT NULL,
        Status NVARCHAR(50) NOT NULL,
        Description NVARCHAR(255) NULL,
        CreatedAt DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_OrderTracking_Order FOREIGN KEY (OrderID) REFERENCES Orders(OrderID) ON DELETE CASCADE
    );
END
