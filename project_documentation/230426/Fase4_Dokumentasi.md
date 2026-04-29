# 📋 Dokumentasi Fase 4: Sistem Pembayaran & Order Tracking

**Tanggal Eksekusi**: 23 April 2026  
**PIC**: Antigravity AI  
**Status**: ✅ Selesai

---

## 📌 Ringkasan Eksekutif

Fase 4 telah diimplementasikan untuk menyediakan kapabilitas pembayaran transaksi dan pencatatan riwayat (tracking) pengiriman atau status pesanan. Fase ini menyiapkan aplikasi untuk menerima notifikasi dari Payment Gateway (mock) dan melacak setiap perubahan status pesanan.

| Fitur | Status | Keterangan |
|-------|:------:|------------|
| Skema Database OrderTracking | ✅ | Tabel `OrderTracking` dibuat melalui Flyway Migration |
| Entity & Repository | ✅ | `OrderTracking.java` dan `OrderTrackingRepository.java` diimplementasikan |
| Integrasi Pembayaran (Mock) | ✅ | `PaymentService.java` & `PaymentController.java` dengan Endpoint Token dan Webhook |
| Order Tracking System | ✅ | `OrderService` diperbarui untuk mencatat riwayat ke `OrderTracking` |
| DTO Update | ✅ | `OrderResponseDTO` sekarang memuat `trackingHistory` |

---

## 1️⃣ Skema Database (Flyway Migration)

### Migration: `V20260423130000__create_order_tracking_table.sql`

Membuat tabel `OrderTracking` yang terhubung dengan tabel `Orders`:

```sql
CREATE TABLE OrderTracking (
    TrackingID INT IDENTITY(1,1) PRIMARY KEY,
    OrderID INT NOT NULL,
    Status NVARCHAR(50) NOT NULL,
    Description NVARCHAR(255) NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_OrderTracking_Order FOREIGN KEY (OrderID) REFERENCES Orders(OrderID) ON DELETE CASCADE
);
```

---

## 2️⃣ Implementasi Backend

### A. Data Transfer Objects (DTO)
- **`OrderTrackingDTO`**: Menampilkan riwayat status pesanan.
- **`PaymentRequestDTO`**: Request dari klien yang berisi metode pembayaran yang dipilih dan OrderID.
- **`PaymentResponseDTO`**: Response berisi Token Pembayaran dan URL Redirect pembayaran.
- DTO eksisting **`OrderResponseDTO`** diperbarui untuk mengembalikan `List<OrderTrackingDTO>` sehingga frontend bisa menampilkan timeline pesanan.

### B. PaymentService & PaymentController
Sistem ini menggunakan integrasi gateway pembayaran simulasi (mock) yang mirip dengan standar industri (misal: Midtrans).
- **`createPaymentToken`**: Mengambil `Order` yang statusnya masih belum dibayar, membuat token/UUID acak, dan mengembalikan `paymentUrl`.
- **`processPaymentNotification` (Webhook)**: Disiapkan untuk dipanggil oleh payment gateway saat transaksi berubah. Jika status webhook adalah `settlement` atau `capture`, pesanan akan diupdate menjadi "Paid" dan histori tracking ditambahkan.

### C. OrderTracking & Update pada OrderService
- **`OrderTracking`**: Entity untuk menyimpan log riwayat perubahan status pada pesanan.
- Modifikasi pada **`OrderService.java`**:
  - Dibuatkan method `addTrackingHistory(orderId, status, description)` yang akan menyisipkan satu baris ke tabel `OrderTracking`.
  - Fungsi ini dipanggil otomatis ketika **Create Order** (status "Pending") dan ketika admin melakukan **Update Order Status**.

---

## 3️⃣ Daftar File yang Dimodifikasi / Ditambahkan

| # | File | Tipe Perubahan |
|---|------|---------------|
| 1 | `db/migration/V...__create_order_tracking_table.sql`| ✨ **Baru** — DDL `OrderTracking` |
| 2 | `entity/OrderTracking.java` | ✨ **Baru** — Entity Database |
| 3 | `repository/OrderTrackingRepository.java` | ✨ **Baru** — Data Access |
| 4 | `dto/OrderTrackingDTO.java` | ✨ **Baru** — Output DTO |
| 5 | `dto/PaymentRequestDTO.java` | ✨ **Baru** — Input DTO |
| 6 | `dto/PaymentResponseDTO.java` | ✨ **Baru** — Output DTO |
| 7 | `service/PaymentService.java` | ✨ **Baru** — Logika Pembayaran (Mock) |
| 8 | `controller/PaymentController.java` | ✨ **Baru** — REST Endpoints `/api/v1/payments` |
| 9 | `dto/OrderResponseDTO.java` | ✏️ **Edit** — Penambahan field `trackingHistory` |
| 10| `service/OrderService.java` | ✏️ **Edit** — Memanggil `addTrackingHistory()` |

---

## ⚠️ Catatan Integrasi Lanjutan (Frontend)

| # | Item | Prioritas | Keterangan |
|---|------|:---------:|------------|
| 1 | **UI Pembayaran / Checkout** | 🔴 High | Halaman `Checkout.jsx` harus dimodifikasi untuk memanggil endpoint pembayaran dan mere-direct/membuka widget pembayaran. |
| 2 | **UI Lacak Pesanan** | 🔴 High | Di halaman `Profile.jsx` perlu ada desain timeline berdasarkan `trackingHistory` yang ada di `OrderResponseDTO`. |

---

*Dokumen ini adalah laporan eksekusi Fase 4 dari Rundown Pengembangan Otaku E-Commerce.*
