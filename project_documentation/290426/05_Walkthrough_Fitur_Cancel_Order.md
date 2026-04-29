# Walkthrough: Fitur Pembatalan Pesanan oleh Customer

Fitur ini memungkinkan customer untuk membatalkan pesanan mereka sendiri yang masih dalam status "Belum Bayar" (Pending). Sistem akan secara otomatis mengembalikan stok produk ke inventaris toko saat pembatalan dilakukan.

## Sisi Backend (Spring Boot)

### 1. Restorasi Stok di Repository
Menambahkan query kustom untuk menambah jumlah stok produk saat pesanan dibatalkan.
```java
// ProductRepository.java
@Modifying
@Query("UPDATE Product p SET p.stockQuantity = p.stockQuantity + :qty WHERE p.id = :id")
int increaseStock(Integer id, Integer qty);
```

### 2. Logika Pembatalan di Service
Implementasi method `cancelOrder` yang memverifikasi kepemilikan, status, dan melakukan pengembalian stok.
```java
// OrderService.java
@Transactional
public void cancelOrder(Integer orderId, String userEmail) {
    // 1. Verifikasi kepemilikan & status
    // 2. Kembalikan stok untuk setiap item
    for (OrderItem item : order.getItems()) {
        productRepository.increaseStock(item.getProduct().getId(), item.getQuantity());
    }
    // 3. Update status ke 'Cancelled'
    order.setStatus("Cancelled");
    addTrackingHistory(orderId, "Cancelled", "Pesanan dibatalkan oleh pelanggan.");
}
```

### 3. Endpoint Baru di Controller
Mengekspos fungsi pembatalan melalui endpoint API.
```java
// OrderController.java
@PutMapping("/{id}/cancel")
@PreAuthorize("hasRole('Admin') or @orderSecurity.isOrderOwner(#id, authentication.name)")
public ResponseEntity<ApiResponse<Void>> cancelOrder(@PathVariable Integer id, Authentication authentication) {
    orderService.cancelOrder(id, authentication.getName());
    return ResponseEntity.ok(ApiResponse.success("OTK-2026", "Pesanan berhasil dibatalkan", null));
}
```

## Sisi Frontend (React)

### 1. UI Icon Tong Sampah
Menambahkan icon `Trash2` di atas tombol "Bayar Sekarang" pada tab "Belum Bayar".

### 2. Alur Konfirmasi
Saat icon diklik, sistem akan menampilkan modal konfirmasi untuk mencegah pembatalan yang tidak disengaja.

```javascript
const handleCancelOrder = (orderId) => {
  showModal(
    "Apakah Anda yakin ingin membatalkan pesanan ini?",
    "warning",
    async () => {
      // Panggil API pembatalan & Refresh data
    },
    true // Mode konfirmasi
  );
};
```

---
**Status**: Implementasi Selesai & Terverifikasi (Code-wise).
