-- V5: Buat tabel RefreshTokens untuk Dual Token System (Access + Refresh)

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='RefreshTokens' AND xtype='U')
CREATE TABLE RefreshTokens (
    TokenID    INT IDENTITY(1,1) PRIMARY KEY,
    UserID     INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
    Token      NVARCHAR(512) NOT NULL UNIQUE,
    ExpiryDate DATETIME NOT NULL,
    Revoked    BIT NOT NULL DEFAULT 0,
    CreatedAt  DATETIME DEFAULT GETDATE()
);
