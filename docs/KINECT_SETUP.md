# Panduan Kinect V1

## Kebutuhan

- Kinect for Windows V1 beserta adaptor daya/USB yang sesuai.
- Kinect for Windows SDK/Runtime 1.8; project bridge memakai .NET Framework 4.8.
- Windows 11 telah dilaporkan mengenali Kinect dan menjalankan Skeleton Basics. Hal ini belum membuktikan bridge atau game telah berjalan di Windows 11.

## Sambungkan perangkat

1. Sambungkan Kinect ke adaptor daya dan port USB komputer. Tunggu perangkat siap.
2. Buka Device Manager atau Kinect Configuration Verifier untuk memeriksa perangkat dan runtime.
3. Jalankan contoh Skeleton Basics dari Kinect SDK. Pastikan seluruh badan dan kedua kaki terdeteksi. Jika belum, periksa daya, USB, posisi sensor, jarak, dan pencahayaan sebelum mencoba game.
4. Biarkan Kinect tetap tersambung, kemudian ikuti langkah di `KINECT_BRIDGE.md`.
5. Browser dan bridge harus berjalan pada komputer yang sama karena server hanya mendengarkan di `127.0.0.1`.

SDK 1.8 tidak boleh dianggap kompatibel penuh dengan Windows 11 hanya berdasarkan pengenalan perangkat. Verifikasi runtime bridge secara terpisah.
