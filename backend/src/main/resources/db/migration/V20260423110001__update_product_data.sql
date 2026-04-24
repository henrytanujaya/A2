-- ============================================================
-- Fase 2: Update mock data produk dengan Rating dan ImageURL
-- ============================================================

-- ─── Action Figure: Rating & ImageURL ─────────────────────────────────────
UPDATE Products SET Rating = 5, ImageURL = 'https://images.unsplash.com/photo-1608889175157-718b6205a50a?q=80&w=600&auto=format&fit=crop'
WHERE Name = 'Saber Arturia Pendragon 1/7' AND ImageURL IS NULL;

UPDATE Products SET Rating = 5, ImageURL = 'https://images.unsplash.com/photo-1608889175157-718b6205a50a?q=80&w=600&auto=format&fit=crop'
WHERE Name = 'Gojo Satoru - S.H.Figuarts' AND ImageURL IS NULL;

UPDATE Products SET Rating = 4, ImageURL = 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80&w=600&auto=format&fit=crop'
WHERE Name = 'Eren Yeager Attack Titan Pop Up Parade' AND ImageURL IS NULL;

UPDATE Products SET Rating = 5, ImageURL = 'https://images.unsplash.com/photo-1608889175157-718b6205a50a?q=80&w=600&auto=format&fit=crop'
WHERE Name = 'Rem Re:Zero Crystal Dress Ver.' AND ImageURL IS NULL;

UPDATE Products SET Rating = 5, ImageURL = 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80&w=600&auto=format&fit=crop'
WHERE Name = 'Nendoroid Denji Chainsaw Man' AND ImageURL IS NULL;

UPDATE Products SET Rating = 5, ImageURL = 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80&w=600&auto=format&fit=crop'
WHERE Name = 'Monkey D. Luffy Gear 5 - King of Artist' AND ImageURL IS NULL;

UPDATE Products SET Rating = 4, ImageURL = 'https://images.unsplash.com/photo-1608889175157-718b6205a50a?q=80&w=600&auto=format&fit=crop'
WHERE Name = 'Megumi Fushiguro - Kotobukiya' AND ImageURL IS NULL;

-- ─── Outfit: Rating & ImageURL ────────────────────────────────────────────
UPDATE Products SET Rating = 4, ImageURL = 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=600&auto=format&fit=crop'
WHERE Name = 'Akatsuki Cloud Oversized Hoodie' AND ImageURL IS NULL;

UPDATE Products SET Rating = 4, ImageURL = 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=600&auto=format&fit=crop'
WHERE Name = 'U.A. Academy Gym Uniform' AND ImageURL IS NULL;

UPDATE Products SET Rating = 5, ImageURL = 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=600&auto=format&fit=crop'
WHERE Name = 'Tanjiro Kamado Haori Pattern T-Shirt' AND ImageURL IS NULL;

UPDATE Products SET Rating = 5, ImageURL = 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=600&auto=format&fit=crop'
WHERE Name = 'Survey Corps Leather Jacket' AND ImageURL IS NULL;

UPDATE Products SET Rating = 4, ImageURL = 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=600&auto=format&fit=crop'
WHERE Name = 'Cyberpunk Edgerunners David Martinez Jacket' AND ImageURL IS NULL;

UPDATE Products SET Rating = 4, ImageURL = 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=600&auto=format&fit=crop'
WHERE Name = 'Tokyo Revengers Valhalla Bomber' AND ImageURL IS NULL;

-- ─── Manga: Rating & ImageURL ─────────────────────────────────────────────
UPDATE Products SET Rating = 5, ImageURL = 'https://images.unsplash.com/photo-1618331835717-801e976710b2?q=80&w=600&auto=format&fit=crop'
WHERE Name = 'Jujutsu Kaisen Vol. 0' AND ImageURL IS NULL;

UPDATE Products SET Rating = 5, ImageURL = 'https://images.unsplash.com/photo-1618331835717-801e976710b2?q=80&w=600&auto=format&fit=crop'
WHERE Name = 'Spy x Family Vol. 10' AND ImageURL IS NULL;

UPDATE Products SET Rating = 5, ImageURL = 'https://images.unsplash.com/photo-1544640808-32cb4fbad06e?q=80&w=600&auto=format&fit=crop'
WHERE Name = 'One Piece Box Set 1' AND ImageURL IS NULL;

UPDATE Products SET Rating = 5, ImageURL = 'https://images.unsplash.com/photo-1544640808-32cb4fbad06e?q=80&w=600&auto=format&fit=crop'
WHERE Name = 'Berserk Deluxe Edition Vol. 1' AND ImageURL IS NULL;

UPDATE Products SET Rating = 4, ImageURL = 'https://images.unsplash.com/photo-1618331835717-801e976710b2?q=80&w=600&auto=format&fit=crop'
WHERE Name = 'Blue Lock Vol. 1' AND ImageURL IS NULL;

UPDATE Products SET Rating = 5, ImageURL = 'https://images.unsplash.com/photo-1618331835717-801e976710b2?q=80&w=600&auto=format&fit=crop'
WHERE Name = 'Oshi no Ko Vol. 1' AND ImageURL IS NULL;

-- ─── BluRay: Rating & ImageURL ────────────────────────────────────────────
UPDATE Products SET Rating = 5, ImageURL = 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=600&auto=format&fit=crop'
WHERE Name = 'Your Name (Kimi no Na wa) 4K UHD' AND ImageURL IS NULL;

UPDATE Products SET Rating = 5, ImageURL = 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=600&auto=format&fit=crop'
WHERE Name = 'Spirited Away - Studio Ghibli Collection' AND ImageURL IS NULL;

UPDATE Products SET Rating = 5, ImageURL = 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=600&auto=format&fit=crop'
WHERE Name = 'Demon Slayer Mugen Train Movie' AND ImageURL IS NULL;

UPDATE Products SET Rating = 5, ImageURL = 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=600&auto=format&fit=crop'
WHERE Name = 'Suzume no Tojimari - Special Edition' AND ImageURL IS NULL;

UPDATE Products SET Rating = 4, ImageURL = 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=600&auto=format&fit=crop'
WHERE Name = 'A Silent Voice (Koe no Katachi)' AND ImageURL IS NULL;

UPDATE Products SET Rating = 5, ImageURL = 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=600&auto=format&fit=crop'
WHERE Name = 'Evangelion 3.0+1.0 Thrice Upon a Time' AND ImageURL IS NULL;
