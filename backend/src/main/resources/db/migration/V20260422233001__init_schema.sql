-- Membangun Tabel Utama untuk Autentikasi Pengguna
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
CREATE TABLE Users (
    UserID INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    Email NVARCHAR(100) UNIQUE NOT NULL,
    PasswordHash NVARCHAR(255) NOT NULL,
    Role NVARCHAR(20) DEFAULT 'Customer',
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- Membangun Tabel Katalog Inventaris (Bukan Custom)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Products' AND xtype='U')
CREATE TABLE Products (
    ProductID INT IDENTITY(1,1) PRIMARY KEY,
    Category NVARCHAR(50) NOT NULL, -- ActionFigure, Outfit, Manga, BluRay
    Name NVARCHAR(255) NOT NULL,
    Description NVARCHAR(MAX),
    Price DECIMAL(18,2) NOT NULL,
    StockQuantity INT DEFAULT 0,
    ImageURL NVARCHAR(MAX)
);

-- Membangun Tabel Kupon Promosi / Diskon
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Discounts' AND xtype='U')
CREATE TABLE Discounts (
    DiscountID INT IDENTITY(1,1) PRIMARY KEY,
    Code NVARCHAR(50) UNIQUE NOT NULL,
    DiscountType NVARCHAR(20) NOT NULL, -- Percentage (%), Fixed (Rp)
    DiscountValue DECIMAL(18,2) NOT NULL,
    ApplicableCategory NVARCHAR(50) -- All, ActionFigure, CustomOutfit, Custom3D
);

-- Membangun Tabel Pemesanan Berbasis Image / File Custom
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='CustomOrders' AND xtype='U')
CREATE TABLE CustomOrders (
    CustomOrderID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT FOREIGN KEY REFERENCES Users(UserID),
    ServiceType NVARCHAR(50), -- AF_3D (Action Figure), Outfit
    ImageReferenceURL NVARCHAR(MAX),
    ConfigurationJSON NVARCHAR(MAX),
    Price DECIMAL(18,2) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- Membangun Tabel Penampung Transaksi
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Orders' AND xtype='U')
CREATE TABLE Orders (
    OrderID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT FOREIGN KEY REFERENCES Users(UserID),
    TotalAmount DECIMAL(18,2) NOT NULL,
    DiscountID INT NULL FOREIGN KEY REFERENCES Discounts(DiscountID),
    FinalAmount DECIMAL(18,2) NOT NULL,
    Status NVARCHAR(50) DEFAULT 'Pending', -- Pending, Paid, Processing, Shipped
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- Membangun Relasi Produk dan Detail Pesanan
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='OrderItems' AND xtype='U')
CREATE TABLE OrderItems (
    OrderItemID INT IDENTITY(1,1) PRIMARY KEY,
    OrderID INT FOREIGN KEY REFERENCES Orders(OrderID),
    ProductID INT NULL FOREIGN KEY REFERENCES Products(ProductID), 
    CustomOrderID INT NULL FOREIGN KEY REFERENCES CustomOrders(CustomOrderID), 
    Quantity INT NOT NULL DEFAULT 1,
    UnitPrice DECIMAL(18,2) NOT NULL
);
