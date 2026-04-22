# Data Pengguna Admin

Berdasarkan pengecekan pada data *migration database* (terenkripsi *BCrypt*), berikut adalah kredensial untuk masuk sebagai Administrator:

- **Email**: `admin@otaku.com`
- **Password**: `Password123!`
- **Role**: `Admin`

*Catatan: Password di database di-hash menggunakan algoritma BCrypt berkekuatan 12 (`$2a$12$qJ1cS2JTuFtp...`). BCrypt merupakan enkripsi satu arah (one-way hash) yang tidak bisa di-decrypt secara matematis. Namun, berdasarkan file riwayat migrasi `V7`, nilai asli sebelum di-hash dari akun tersebut telah teridentifikasi sebagai `Password123!`.*
