-- ============================================================
-- V2: Insert Mock Data — 25 High Quality Products
-- ============================================================

-- 1. Insert Data Pengguna
IF NOT EXISTS (SELECT 1 FROM Users WHERE Email = 'admin@otaku.com')
    INSERT INTO Users (Name, Email, PasswordHash, Role) VALUES ('Admin Otaku', 'admin@otaku.com', '$2a$12$qJ1cS2JTuFtp5IcD7z8l/OKUI9fIKR/TB3XPF1Al8dV6ZxKE9puGK', 'Admin');

IF NOT EXISTS (SELECT 1 FROM Users WHERE Email = 'budi@gmail.com')
    INSERT INTO Users (Name, Email, PasswordHash, Role) VALUES ('Kolektor Budi', 'budi@gmail.com', '$2a$12$qJ1cS2JTuFtp5IcD7z8l/OKUI9fIKR/TB3XPF1Al8dV6ZxKE9puGK', 'Customer');

-- 2. Insert 25 Produk Pilihan (ActionFigure, Outfit, Manga, BluRay)
-- Action Figure (7 items)
INSERT INTO Products (Category, Name, Description, Price, StockQuantity) VALUES 
('ActionFigure', 'Saber Arturia Pendragon 1/7', 'Kualitas premium dari Fate/Stay Night by Good Smile Company.', 2800000, 5),
('ActionFigure', 'Gojo Satoru - S.H.Figuarts', 'Artikulasi tinggi dengan efek Teknik Limitless.', 1200000, 15),
('ActionFigure', 'Eren Yeager Attack Titan Pop Up Parade', 'Pose ikonik dari Shingeki no Kyojin Final Season.', 650000, 20),
('ActionFigure', 'Rem Re:Zero Crystal Dress Ver.', 'Edisi terbatas dengan detail kristal transparan yang memukau.', 4500000, 2),
('ActionFigure', 'Nendoroid Denji Chainsaw Man', 'Dilengkapi dengan Pochita dan berbagai ekspresi wajah.', 950000, 12),
('ActionFigure', 'Monkey D. Luffy Gear 5 - King of Artist', 'Mode awakening Sun God Nika dengan detail tekstur awan.', 850000, 10),
('ActionFigure', 'Megumi Fushiguro - Kotobukiya', 'Skala 1/8 lengkap dengan anjing ajaran (Divine Dogs).', 1850000, 8);

-- Outfit (6 items)
INSERT INTO Products (Category, Name, Description, Price, StockQuantity) VALUES 
('Outfit', 'Akatsuki Cloud Oversized Hoodie', 'Bahan cotton fleece premium dengan bordir awan merah.', 350000, 50),
('Outfit', 'U.A. Academy Gym Uniform', 'Replika seragam olahraga My Hero Academia, bahan breathable.', 275000, 30),
('Outfit', 'Tanjiro Kamado Haori Pattern T-Shirt', 'Kaos dengan pola checkered hijau-hitam ikonik.', 150000, 100),
('Outfit', 'Survey Corps Leather Jacket', 'Jaket kulit sintetis dengan logo Wing of Freedom.', 550000, 15),
('Outfit', 'Cyberpunk Edgerunners David Martinez Jacket', 'Jaket kuning ikonik dengan kerah tinggi.', 750000, 10),
('Outfit', 'Tokyo Revengers Valhalla Bomber', 'Jaket bomber putih dengan bordir logo Valhalla di punggung.', 450000, 25);

-- Manga (6 items)
INSERT INTO Products (Category, Name, Description, Price, StockQuantity) VALUES 
('Manga', 'Jujutsu Kaisen Vol. 0', 'Kisah prekuel Yuta Okkotsu dan Rika Orimoto.', 45000, 200),
('Manga', 'Spy x Family Vol. 10', 'Edisi terbaru petualangan keluarga Forger.', 48000, 150),
('Manga', 'One Piece Box Set 1', 'Volume 1-23 dalam box eksklusif dengan bonus poster.', 2100000, 5),
('Manga', 'Berserk Deluxe Edition Vol. 1', 'Hardcover ukuran besar dengan kertas kualitas tinggi.', 850000, 10),
('Manga', 'Blue Lock Vol. 1', 'Manga sepak bola paling intens tahun ini.', 45000, 180),
('Manga', 'Oshi no Ko Vol. 1', 'Sisi gelap industri idol Jepang.', 48000, 120);

-- BluRay (6 items)
INSERT INTO Products (Category, Name, Description, Price, StockQuantity) VALUES 
('BluRay', 'Your Name (Kimi no Na wa) 4K UHD', 'Edisi kolektor dengan resolusi 4K dan artbook.', 850000, 15),
('BluRay', 'Spirited Away - Studio Ghibli Collection', 'Karya legendaris Hayao Miyazaki dalam format BluRay.', 450000, 20),
('BluRay', 'Demon Slayer Mugen Train Movie', 'Limited edition dengan soundtrack CD original.', 750000, 10),
('BluRay', 'Suzume no Tojimari - Special Edition', 'Film terbaru Makoto Shinkai dengan bonus behind the scenes.', 950000, 8),
('BluRay', 'A Silent Voice (Koe no Katachi)', 'Drama emosional dengan kualitas audio DTS-HD.', 350000, 25),
('BluRay', 'Evangelion 3.0+1.0 Thrice Upon a Time', 'Konklusi megah dari seri Rebuild of Evangelion.', 1200000, 5);

-- 3. Insert Data Sistem Promosi / Diskon
IF NOT EXISTS (SELECT 1 FROM Discounts WHERE Code = 'OTAKUNEW')
    INSERT INTO Discounts (Code, DiscountType, DiscountValue, ApplicableCategory) VALUES ('OTAKUNEW', 'Percentage', 10.00, 'All');

IF NOT EXISTS (SELECT 1 FROM Discounts WHERE Code = 'DISC300K')
    INSERT INTO Discounts (Code, DiscountType, DiscountValue, ApplicableCategory) VALUES ('DISC300K', 'Fixed', 300000, 'All');

IF NOT EXISTS (SELECT 1 FROM Discounts WHERE Code = 'OUTFITFEST')
    INSERT INTO Discounts (Code, DiscountType, DiscountValue, ApplicableCategory) VALUES ('OUTFITFEST', 'Percentage', 15.00, 'Outfit');
