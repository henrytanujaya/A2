# Plan & Rundown: Fitur Pembatalan Pesanan oleh Customer

Dokumen ini merinci rencana implementasi fitur pembatalan pesanan secara mandiri oleh customer melalui menu "Pesanan Saya".

## 1. Analisis Teknis

### Sisi Backend (Spring Boot)
- **Status Transisi**: Backend sudah mendukung transisi dari `Pending` ke `Cancelled`.
- **Restorasi Stok**: Saat pesanan dibatalkan, sistem harus mengembalikan jumlah stok produk yang sebelumnya sudah dikurangi saat `createOrder`.
- **Keamanan (IDOR)**: Endpoint pembatalan harus memastikan bahwa pesanan yang dibatalkan adalah milik user yang sedang login.

### Sisi Frontend (React)
- **UI/UX**: Penempatan icon `Trash2` (tong sampah) di atas tombol "Bayar Sekarang" pada tab "Belum Bayar".
- **Konfirmasi**: Menampilkan modal konfirmasi sebelum melakukan aksi pembatalan untuk mencegah ketidaksengajaan.
- **Feedback**: Mengirimkan notifikasi sukses/gagal dan menyegarkan data pesanan setelah pembatalan.

---

## 2. Rencana Perubahan (Proposed Changes)

### Backend (Spring Boot)

#### [MODIFY] [OrderService.java](file:///c:/Antigravity/A2/backend/src/main/java/com/otaku/ecommerce/service/OrderService.java)
- Menambahkan method `cancelOrder(Integer orderId, String userEmail)`.
- Logika:
    1. Validasi kepemilikan order.
    2. Validasi status harus `Pending`.
    3. Iterasi `orderItems` untuk mengembalikan stok ke tabel `Products`.
    4. Update status order menjadi `Cancelled`.
    5. Tambah catatan di `OrderTracking`.

#### [MODIFY] [OrderController.java](file:///c:/Antigravity/A2/backend/src/main/java/com/otaku/ecommerce/controller/OrderController.java)
- Menambahkan endpoint `PUT /api/v1/orders/{orderId}/cancel`.
- Menggunakan `Principal` atau `Authentication` untuk mengambil email user yang login.

### Frontend (React / Vite)

#### [MODIFY] [UserOrders.jsx](file:///c:/Antigravity/A2/frontend/src/pages/UserOrders.jsx)
- Import icon `Trash2` dari `lucide-react`.
- Menambahkan fungsi `handleCancelOrder(orderId)`.
- Menambahkan elemen UI icon tong sampah di dalam card pesanan (khusus tab `unpaid`).
- Integrasi dengan `showModal` untuk konfirmasi dan notifikasi hasil.

---

## 3. Rundown Pengerjaan

1. **Persiapan Backend**: 
    - Implementasi logika restorasi stok di `OrderService`.
    - Ekspos endpoint di `OrderController`.
    - Restart backend.
2. **Pengembangan Frontend**:
    - Penyesuaian layout pada `UserOrders.jsx` untuk menambahkan icon pembatalan.
    - Implementasi pemanggilan API pembatalan.
3. **Verifikasi**:
    - Membuat pesanan baru (stok berkurang).
    - Menekan icon tong sampah dan melakukan konfirmasi.
    - Memastikan status berubah menjadi `Cancelled`.
    - Memastikan stok produk kembali bertambah sesuai jumlah pesanan yang dibatalkan.
    - Memastikan pesanan berpindah dari tab "Belum Bayar" ke tab "Dibatalkan".

---

**Status**: Menunggu Approval User untuk eksekusi.
