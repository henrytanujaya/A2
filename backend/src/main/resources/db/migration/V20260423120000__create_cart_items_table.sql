-- ============================================================
-- Fase 3: Cart Module - Tabel Keranjang Belanja untuk User
-- ============================================================

IF OBJECT_ID(N'dbo.CartItems', N'U') IS NULL
BEGIN
    CREATE TABLE CartItems (
        CartItemID INT IDENTITY(1,1) PRIMARY KEY,
        UserID INT NOT NULL,
        ProductID INT NULL,
        CustomOrderID INT NULL,
        Quantity INT NOT NULL DEFAULT 1,
        CreatedAt DATETIME DEFAULT GETDATE(),
        UpdatedAt DATETIME NULL,
        CONSTRAINT FK_CartItems_User FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
        CONSTRAINT FK_CartItems_Product FOREIGN KEY (ProductID) REFERENCES Products(ProductID) ON DELETE CASCADE,
        CONSTRAINT FK_CartItems_CustomOrder FOREIGN KEY (CustomOrderID) REFERENCES CustomOrders(CustomOrderID) ON DELETE SET NULL,
        CONSTRAINT CHK_CartItem_Target CHECK (ProductID IS NOT NULL OR CustomOrderID IS NOT NULL)
    );
END
ELSE
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.CartItems') AND name = 'UpdatedAt')
    BEGIN
        ALTER TABLE CartItems ADD UpdatedAt DATETIME NULL;
    END
END
