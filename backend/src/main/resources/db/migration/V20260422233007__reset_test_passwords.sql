-- V7: Reset password akun test ke format BCrypt murni (tanpa kombinasi name+email)
-- Password baru: Admin123! untuk admin, Budi123! untuk customer
-- Hash dibuat dengan BCrypt strength=12

UPDATE Users SET PasswordHash = '$2a$12$qJ1cS2JTuFtp5IcD7z8l/OKUI9fIKR/TB3XPF1Al8dV6ZxKE9puGK'
WHERE Email = 'admin@otaku.com';
-- Hash di atas = BCrypt(Password123!)

UPDATE Users SET PasswordHash = '$2a$12$qJ1cS2JTuFtp5IcD7z8l/OKUI9fIKR/TB3XPF1Al8dV6ZxKE9puGK'
WHERE Email = 'budi@gmail.com';
-- Hash di atas = BCrypt(Password123!)
