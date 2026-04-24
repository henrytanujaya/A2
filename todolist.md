# To-Do List Pengembangan Otaku E-Commerce

Daftar tugas untuk menyelesaikan integrasi dan fitur sistem:

- [ ] **1. Integrasi Semua Sektor**
    - Sinkronisasi penuh antara Frontend, Backend, dan Database (SQL Server + Redis).
    - Pastikan alur autentikasi Hybrid (JWT + Session Redis) berjalan lancar.
- [ ] **2. Perapihan Database**
    - Audit skema database saat ini.
    - Buat tabel/kolom tambahan yang belum tersedia namun dibutuhkan oleh tampilan Frontend.
    - Optimasi migrasi Flyway.
- [ ] **3. Update Sistem Keranjang (Cart)**
    - Sesuaikan logika backend dengan kebutuhan UI Frontend.
    - Tambahkan fitur keranjang di database/redis jika belum ada.
    - Sinkronisasi item keranjang untuk user yang login.
- [ ] **4. Sistem Pembayaran (Payment)**
    - Implementasi backend untuk memproses pembayaran sesuai desain Frontend.
    - Integrasi (mock/real) payment gateway jika diperlukan.
- [ ] **5. Pelacakan Pesanan (Order Tracking)**
    - Tambahkan sistem status tracking (Order Placed, Processing, Shipped, Delivered).
    - Buat API untuk update dan fetch status pengiriman.
- [ ] **6. Audit Akses Kontrol (RBAC)**
    - Periksa kembali `SecurityConfig`.
    - Pastikan endpoint Admin tidak bisa diakses Customer.
    - Pastikan Customer hanya bisa mengakses data miliknya sendiri (misal: Order History).

---
*Status: In Progress*
*Dibuat pada: 2026-04-23*
