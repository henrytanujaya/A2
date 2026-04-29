# Analisa dan Rencana Perbaikan Menu Admin

Dokumen ini berisi analisa mendalam dan rencana pengerjaan (rundown) untuk 3 poin perbaikan pada Menu Admin di aplikasi E-commerce Kitsune Noir.

## Analisa Masalah

### 1. Pencarian & Tampilan No Resi di Menu Pesanan
*   **Kondisi Saat Ini**: Fitur pencarian berdasarkan "Nomor Resi" sudah ada di backend (`OrderRepository`), namun di frontend (`AdminOrders.jsx`), nomor resi hanya ditampilkan secara eksplisit pada tab `Processing` dan `Shipped`. Tab lain seperti `Waiting_Verification`, `Completed`, atau `Cancelled` tidak menampilkan nomor resi meskipun data tersebut mungkin ada (misal pada pesanan yang sudah selesai).
*   **Solusi**: Memperbarui komponen tabel di `AdminOrders.jsx` agar selalu menampilkan kolom "No Resi" atau menampilkannya di bawah info kurir di semua tab jika datanya tersedia.

### 2. Tab "Canceled" Kosong
*   **Kondisi Saat Ini**: Tab "Canceled" di frontend mengirimkan filter `tab=Cancelled` ke backend. Backend melakukan filter `LOWER(status) = 'cancelled'`. Masalahnya, sistem mungkin memiliki status lain yang secara logis masuk kategori "Batal" seperti `REJECTED`, `EXPIRED`, atau `TIMED_OUT` (yang saat ini mungkin belum terakomodasi atau salah penamaan).
*   **Solusi**: Memperbarui query di `OrderRepository` agar saat `tab=Cancelled` dipilih, backend akan mengembalikan semua pesanan dengan status `Cancelled`, `Rejected`, `Expired`, atau status kegagalan pembayaran lainnya.

### 3. Menu Audit Penjualan & Ekspor Excel
*   **Kondisi Saat Ini**: Belum ada menu khusus untuk audit keuangan/penjualan. Admin kesulitan melihat performa penjualan bulanan dan tidak bisa menarik data ke Excel untuk laporan.
*   **Solusi**: 
    *   Membuat endpoint baru di backend untuk mengambil data transaksi sukses (Completed/Shipped) dengan filter bulan & tahun.
    *   Membuat halaman baru `SalesAudit.jsx` di frontend.
    *   Menambahkan library `xlsx` di frontend untuk fitur ekspor ke Excel secara client-side.

---

## Rencana Pengerjaan (Rundown)

### Fase 1: Perbaikan UI & Search (Poin 1)
1.  **Modify `AdminOrders.jsx`**:
    *   Menambahkan kolom/baris tampilan `Tracking Number` di semua status pesanan.
    *   Memastikan label "No Resi: [Nomor]" muncul jika `order.trackingNumber` tidak null/kosong.
    *   Testing pencarian resi di berbagai tab (terutama tab 'All' dan 'Shipped').

### Fase 2: Perbaikan Filter Status "Canceled" (Poin 2)
1.  **Modify `OrderRepository.java`**:
    *   Memperbarui query `@Query` pada method `findFilteredOrders`.
    *   Menambahkan logika: `OR (:tab = 'Cancelled' AND o.status IN ('Cancelled', 'Rejected', 'Expired'))`.
2.  **Modify `OrderService.java`**:
    *   Memastikan transisi status ke `Cancelled` atau `Rejected` tercatat dengan benar di `OrderTracking`.
3.  **Testing**: Membuat pesanan dummy dan membatalkannya (atau membiarkannya timeout) lalu verifikasi kemunculannya di tab Canceled.

### Fase 3: Fitur Audit Penjualan (Poin 3)
1.  **Backend Development**:
    *   **New DTO**: `SalesAuditResponseDTO` untuk merangkum data audit.
    *   **New Service**: `AuditService` dengan method `getMonthlySalesReport(int month, int year)`.
    *   **New Controller**: `AuditController` dengan endpoint `GET /api/v1/audit/sales`.
2.  **Frontend Development**:
    *   **Install Dependencies**: `npm install xlsx file-saver`.
    *   **New Page**: `SalesAudit.jsx` dengan fitur:
        *   Filter Dropdown (Bulan & Tahun).
        *   Tabel ringkasan transaksi.
        *   Total Pendapatan & Total Order di bagian atas.
        *   Tombol "Export to Excel".
    *   **Routing**: Daftarkan di `App.jsx` dan tambahkan menu di `AdminLayout.jsx`.

### Fase 4: Verifikasi & Finalisasi
1.  End-to-end testing semua fitur baru.
2.  Pengecekan format file Excel yang dihasilkan.
3.  Dokumentasi penggunaan menu audit untuk Admin.

---
**Status**: Menunggu Approval User untuk eksekusi.
