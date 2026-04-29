# Dokumentasi Eksekusi Keamanan Kombinasi (ZE.md)

Pembaruan skema keamanan berdasarkan integrasi dokumen **RE.md** (Response Standard) beserta aturan enkripsi kombinasi kustom.

## 1. Pembaruan Response Code Logika Bisnis
Semua eksepsi logika bisnis dari dalam layanan `AuthService` sekarang telah aktif menggunakan pelemparan `CustomBusinessException` dengan kode `OTK-XXXX`, dan berhasil ditambahkan pembungkus *Response* tipe JSON melalui antarmuka `ApiResponse.java`. 

## 2. Standar Regex Kata Sandi (Password Security)
Untuk memperkuat keamanan akses pengguna, kita telah menanamkan reguler ekspresi (*Regex Validation*) tepat di tahap `register()`.
**Pola Regex yang Disimpan:**
```regex
^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!])(?=\S+$).{8,}$
```

**Aturan Penolakan:**
Sistem perlindungan akses (pada sisi form Registrasi) otomatis akan menolak *password* *(OTK-4002)* jika pengguna tidak memiliki kriteria:
1. Minimal terdapat 8 karakter.
2. Harus terdapat minimal satu angka (`0-9`).
3. Harus terdapat minimal satu huruf kecil (`a-z`).
4. Harus terdapat minimal satu huruf besar kapital (`A-Z`).
5. Harus memiliki setidaknya satu karakter unik non-alfanumerik (`@, #, $, %, dll`).
6. Tidak diperbolehkan ada spasi/ruang kosong (`\S+`).

## 3. Sandi Khusus: Enkripsi Pola Kombinasi (Username + Password + Email)
Alih-alih mengenkripsi variabel `password` aslinya dengan *BCrypt Encoder* secara murni, mesin otentikasi diubah agar menghanguskan (hash) *Kombinasi Rahasia Unik*.

**Logika Implementasi Keamanan Lapis Ganda:**
```java
// Pada saat Registrasi
String combinedRawPassword = dto.getName() + dto.getPassword() + dto.getEmail();
String hashedPassword = passwordEncoder.encode(combinedRawPassword);

user.setPasswordHash(hashedPassword);
```

**Pentingnya Enkripsi Kombinasi Mode ini:**
* Jika sang Peretas (Hacker) berhasil menjebol basis data (*Database*), dan berusaha membongkar / melihat nilai _hashed_ dari Rainbow Tables.
* Usaha Hacker akan sia-sia. Karena seandainya pun hacker sukses menebak teks asli dari enkripsi-nya (contoh: hasil tebakan adalah `"Budi!BudiSecret82budi@gmail.com"`), si peretas harus memecah dan menebak ulang secara manual mana bagian *username*-nya, *password*-nya, dan *email*-nya sebelum mencoba masuk ke sistem.
* Hal ini menangkal serangan dekripsi brutal yang membabi buta. Mengingat validasi di modul `login()` juga merepresentasikan ulang penggabungan tersebut sebelum ditandingkan dengan kunci hash.
