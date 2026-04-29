-- ================================================================
-- Sinkronisasi data dari database lokal Windows ke Docker
-- Produk: Update ImageURL, Stok, Harga sesuai data terbaru
-- ================================================================

-- Update semua data produk terbaru
UPDATE Products SET Name=N'Saber Arturia Pendragon 1/7', ImageURL=N'https://res.cloudinary.com/dvyuk3imn/image/upload/v1777483860/Produk_1-dikonversi-dari-png_ibcfbf.webp', StockQuantity=10, Price=2800000.00, Category=N'ActionFigure', UpdatedAt=GETDATE() WHERE ProductID=1;
UPDATE Products SET Name=N'Gojo Satoru - S.H.Figuarts', ImageURL=N'https://res.cloudinary.com/dvyuk3imn/image/upload/v1777483859/Produk_2-dikonversi-dari-png_e4swom.webp', StockQuantity=10, Price=1200000.00, Category=N'ActionFigure', UpdatedAt=GETDATE() WHERE ProductID=2;
UPDATE Products SET Name=N'Eren Yeager Attack Titan Pop Up Parade', ImageURL=N'https://res.cloudinary.com/dvyuk3imn/image/upload/v1777483859/Produk_3-dikonversi-dari-png_tbq7vx.webp', StockQuantity=18, Price=650000.00, Category=N'ActionFigure', UpdatedAt=GETDATE() WHERE ProductID=3;
UPDATE Products SET Name=N'Rem Re:Zero Crystal Dress Ver.', ImageURL=N'https://res.cloudinary.com/dvyuk3imn/image/upload/v1777483859/Produk_4-dikonversi-dari-png_dcj3rv.webp', StockQuantity=5, Price=4500000.00, Category=N'ActionFigure', UpdatedAt=GETDATE() WHERE ProductID=4;
UPDATE Products SET Name=N'Nendoroid Denji Chainsaw Man', ImageURL=N'https://res.cloudinary.com/dvyuk3imn/image/upload/v1777483857/Produk_5-dikonversi-dari-png_pka9tr.webp', StockQuantity=13, Price=950000.00, Category=N'ActionFigure', UpdatedAt=GETDATE() WHERE ProductID=5;
UPDATE Products SET Name=N'Monkey D. Luffy Gear 5 - King of Artist', ImageURL=N'https://res.cloudinary.com/dvyuk3imn/image/upload/v1777483856/Produk_6-dikonversi-dari-png_vponee.webp', StockQuantity=10, Price=850000.00, Category=N'ActionFigure', UpdatedAt=GETDATE() WHERE ProductID=6;
UPDATE Products SET Name=N'Megumi Fushiguro - Kotobukiya', ImageURL=N'https://res.cloudinary.com/dvyuk3imn/image/upload/v1777483856/Produk_7-dikonversi-dari-png_i1sozq.webp', StockQuantity=11, Price=1850000.00, Category=N'ActionFigure', UpdatedAt=GETDATE() WHERE ProductID=7;
UPDATE Products SET Name=N'Akatsuki Cloud Oversized Hoodie', ImageURL=N'https://res.cloudinary.com/dvyuk3imn/image/upload/v1777483856/Produk_8-dikonversi-dari-png_nxtivb.webp', StockQuantity=44, Price=350000.00, Category=N'Outfit', UpdatedAt=GETDATE() WHERE ProductID=8;
UPDATE Products SET Name=N'U.A. Academy Gym Uniform', ImageURL=N'https://res.cloudinary.com/dvyuk3imn/image/upload/v1777483853/Produk_9-dikonversi-dari-jpeg_poyhpd.webp', StockQuantity=29, Price=275000.00, Category=N'Outfit', UpdatedAt=GETDATE() WHERE ProductID=9;
UPDATE Products SET Name=N'Tanjiro Kamado Haori Pattern T-Shirt', ImageURL=N'https://res.cloudinary.com/dvyuk3imn/image/upload/v1777483852/Produk_10-dikonversi-dari-jpeg_ywrbuu.webp', StockQuantity=99, Price=150000.00, Category=N'Outfit', UpdatedAt=GETDATE() WHERE ProductID=10;
UPDATE Products SET Name=N'Survey Corps Leather Jacket', ImageURL=N'https://res.cloudinary.com/dvyuk3imn/image/upload/v1777483852/Produk_11-dikonversi-dari-jpeg_sp1xwr.webp', StockQuantity=15, Price=550000.00, Category=N'Outfit', UpdatedAt=GETDATE() WHERE ProductID=11;
UPDATE Products SET Name=N'Cyberpunk Edgerunners David Martinez Jacket', ImageURL=N'https://res.cloudinary.com/dvyuk3imn/image/upload/v1777483852/Produk_12-dikonversi-dari-jpeg_ob9swm.webp', StockQuantity=10, Price=750000.00, Category=N'Outfit', UpdatedAt=GETDATE() WHERE ProductID=12;
UPDATE Products SET Name=N'Tokyo Revengers Valhalla Bomber', ImageURL=N'https://res.cloudinary.com/dvyuk3imn/image/upload/v1777483849/Produk_13-dikonversi-dari-jpeg_wp1e1i.webp', StockQuantity=25, Price=450000.00, Category=N'Outfit', UpdatedAt=GETDATE() WHERE ProductID=13;
UPDATE Products SET Name=N'Jujutsu Kaisen Vol. 0', ImageURL=N'https://res.cloudinary.com/dvyuk3imn/image/upload/v1777483851/Produk_14-dikonversi-dari-jpeg_gdgbtd.webp', StockQuantity=150, Price=45000.00, Category=N'Manga', UpdatedAt=GETDATE() WHERE ProductID=14;
UPDATE Products SET Name=N'Spy x Family Vol. 10', ImageURL=N'https://res.cloudinary.com/dvyuk3imn/image/upload/v1777483849/Produk_15-dikonversi-dari-jpeg_gwyqlo.webp', StockQuantity=129, Price=48000.00, Category=N'Manga', UpdatedAt=GETDATE() WHERE ProductID=15;
UPDATE Products SET Name=N'One Piece Box Set 1', ImageURL=N'https://res.cloudinary.com/dvyuk3imn/image/upload/v1777483848/Produk_16-dikonversi-dari-jpeg_lbvxxq.webp', StockQuantity=2, Price=2100000.00, Category=N'Manga', UpdatedAt=GETDATE() WHERE ProductID=16;
UPDATE Products SET Name=N'Berserk Deluxe Edition Vol. 1', ImageURL=N'https://res.cloudinary.com/dvyuk3imn/image/upload/v1777483846/Produk_17-dikonversi-dari-jpeg_iiblw1.webp', StockQuantity=6, Price=850000.00, Category=N'Manga', UpdatedAt=GETDATE() WHERE ProductID=17;
UPDATE Products SET Name=N'Blue Lock Vol. 1', ImageURL=N'https://res.cloudinary.com/dvyuk3imn/image/upload/v1777483845/Produk_18-dikonversi-dari-jpeg_wlbuv1.webp', StockQuantity=168, Price=45000.00, Category=N'Manga', UpdatedAt=GETDATE() WHERE ProductID=18;
UPDATE Products SET Name=N'Oshi no Ko Vol. 1', ImageURL=N'https://res.cloudinary.com/dvyuk3imn/image/upload/v1777483845/Produk_19-dikonversi-dari-jpeg_pviwq5.webp', StockQuantity=116, Price=48000.00, Category=N'Manga', UpdatedAt=GETDATE() WHERE ProductID=19;
UPDATE Products SET Name=N'Your Name (Kimi no Na wa) 4K UHD', ImageURL=N'https://res.cloudinary.com/dvyuk3imn/image/upload/v1777483844/Produk_20-dikonversi-dari-jpeg_xkdkez.webp', StockQuantity=15, Price=850000.00, Category=N'BluRay', UpdatedAt=GETDATE() WHERE ProductID=20;
UPDATE Products SET Name=N'Spirited Away - Studio Ghibli Collection', ImageURL=N'https://res.cloudinary.com/dvyuk3imn/image/upload/v1777483843/Produk_21-dikonversi-dari-jpeg_kqjxd4.webp', StockQuantity=20, Price=450000.00, Category=N'BluRay', UpdatedAt=GETDATE() WHERE ProductID=21;
UPDATE Products SET Name=N'Demon Slayer Mugen Train Movie', ImageURL=N'https://res.cloudinary.com/dvyuk3imn/image/upload/v1777483843/Produk_22-dikonversi-dari-jpeg_uojjdj.webp', StockQuantity=10, Price=750000.00, Category=N'BluRay', UpdatedAt=GETDATE() WHERE ProductID=22;
UPDATE Products SET Name=N'Suzume no Tojimari - Special Edition', ImageURL=N'https://res.cloudinary.com/dvyuk3imn/image/upload/v1777483843/Produk_23-dikonversi-dari-jpeg_mhmvrb.webp', StockQuantity=8, Price=950000.00, Category=N'BluRay', UpdatedAt=GETDATE() WHERE ProductID=23;
UPDATE Products SET Name=N'A Silent Voice (Koe no Katachi)', ImageURL=N'https://res.cloudinary.com/dvyuk3imn/image/upload/v1777483842/Produk_24-dikonversi-dari-jpeg_ymdrze.webp', StockQuantity=25, Price=350000.00, Category=N'BluRay', UpdatedAt=GETDATE() WHERE ProductID=24;
UPDATE Products SET Name=N'Evangelion 3.0+1.0 Thrice Upon a Time', ImageURL=N'https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=600&auto=format&fit=crop', StockQuantity=5, Price=1200000.00, Category=N'BluRay', UpdatedAt=GETDATE() WHERE ProductID=25;

-- Tambah user yang ada di database lokal namun belum ada di Docker
IF NOT EXISTS (SELECT 1 FROM Users WHERE Email = N'nabila123@gmail.com')
BEGIN
    INSERT INTO Users (Name, Email, PasswordHash, Role, CreatedAt)
    SELECT Name, Email, PasswordHash, Role, CreatedAt FROM (
        VALUES (N'nabila', N'nabila123@gmail.com', N'$2a$10$zy37OTfzLXEIjJkN/YjQi.rIDHEVcW1hv9Fst3WevG26dBr1f5IXq', N'Customer', GETDATE())
    ) AS src(Name, Email, PasswordHash, Role, CreatedAt);
END
