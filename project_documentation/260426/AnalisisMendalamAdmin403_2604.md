# Analisis Mendalam: Akar Masalah 403 Forbidden (Admin Panel)

Setelah meninjau log backend terbaru, ditemukan bukti kuat mengenai penyebab kegagalan akses Admin pada endpoint `/api/v1/orders/all`.

## 1. Temuan Diagnostik

Dari log yang diberikan:
```
2026-04-26T19:45:32.223+07:00 INFO ... [JWT-DEBUG] Extracted email: admin@otaku.com, role: Admin
```
*   **Token Valid**: Token JWT berhasil diekstrak dan dibaca oleh `JwtAuthenticationFilter`. Role `Admin` terdeteksi dengan benar.
*   **Proses Terhenti**: Namun, log `[JWT-SUCCESS]` (yang seharusnya muncul setelah `SecurityContext` diset) **TIDAK MUNCUL**.

## 2. Akar Masalah (Root Cause)

Masalah terletak pada logika pengecekan di `JwtAuthenticationFilter.java` baris 79:

```java
if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
    // ... set authentication
}
```

### Mengapa ini gagal?
1.  **Anonymous Authentication**: Pada Spring Security 6 (atau konfigurasi tertentu), sistem secara otomatis mengisi `SecurityContext` dengan `AnonymousAuthenticationToken` sebelum filter kustom dijalankan.
2.  **Kondisi False**: Karena context sudah berisi token anonim, maka `getAuthentication() == null` bernilai **FALSE**.
3.  **Skip Auth**: Akibatnya, filter JWT melewatkan proses penyetelan identitas user `admin@otaku.com`. Request berlanjut ke controller sebagai user anonim, yang tentu saja dilarang (403) mengakses data Admin.

## 3. Langkah Perbaikan

Akan dilakukan pembaruan pada `JwtAuthenticationFilter.java` untuk menangani token anonim:

### Perubahan Kode:
```java
Authentication existingAuth = SecurityContextHolder.getContext().getAuthentication();
if (email != null && (existingAuth == null || existingAuth instanceof AnonymousAuthenticationToken)) {
    // Paksa set autentikasi dari JWT
}
```

### Verifikasi:
Setelah perubahan ini, log `[JWT-SUCCESS]` harus muncul, dan akses ke `/api/v1/orders/all` akan kembali normal.

---
**Dokumentasi ini dibuat untuk menentukan langkah eksekusi final dalam pemulihan integrasi ke-5.**
