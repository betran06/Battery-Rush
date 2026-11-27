# Menjalankan Kinect Bridge

Bridge adalah aplikasi C# terpisah di `kinect-bridge/KinectBridge/KinectBridge.csproj`, target .NET Framework 4.8 dan mereferensikan `Microsoft.Kinect.dll` dari Kinect SDK 1.8.

## Build dan jalankan

1. Pastikan Kinect V1 terhubung dan contoh Skeleton Basics dapat melacak skeleton.
2. Buka `KinectBridge.csproj` di Visual Studio.
3. Pastikan referensi `Microsoft.Kinect` berhasil ditemukan. Jika tidak, sesuaikan `HintPath` di project dengan lokasi instalasi SDK.
4. Build solution, lalu jalankan aplikasi. Bridge menampilkan status Kinect dan endpoint WebSocket jika server berhasil dimulai.
5. Jalankan frontend Battery Rush, pilih mode **KINECT RUN**, lalu tekan **CONNECT** pada panel Kinect. Tunggu skeleton terlacak dan kalibrasi berdiri selama 2 detik selesai sebelum memulai ronde.
6. Untuk menghentikan bridge, tekan Enter di jendela console.

## Koneksi dan data

Endpoint lokal: `ws://127.0.0.1:8181/kinect`, port `8181`. Bridge mengirim JSON `skeleton-frame` dengan `tracking`, nomor `frame`, timestamp Unix milidetik, dan koordinat hip, lutut, serta ankle dalam meter. Status sendi memakai `tracked`, `inferred`, atau `nottracked`. Frame skeleton hilang tetap membawa timestamp. Tidak ada gambar/video yang dikirim.

## Jika gagal terhubung

Pastikan bridge berjalan, alamat dan path tepat, port 8181 tidak dipakai aplikasi lain, serta URL ACL/izin `HttpListener` tidak menolak server. Periksa pesan di console bridge. Jangan menonaktifkan fitur keamanan Windows sebagai langkah pertama.

Build bridge, runtime Windows 11, dan koneksi WebSocket belum diuji dalam sesi ini: **NOT HARDWARE VERIFIED**.

## Icon Aplikasi (app.ico)
- Proyek KinectBridge.csproj telah dikonfigurasi dengan <ApplicationIcon>app.ico</ApplicationIcon>.
- File icon dummy berada di kinect-bridge/KinectBridge/app.ico.
- Untuk mengganti logo aplikasi:
  1. Siapkan file icon baru berformat .ico dengan nama pp.ico.
  2. Timpa (*overwrite*) file kinect-bridge/KinectBridge/app.ico.
  3. Rebuild proyek menggunakan MSBuild atau Visual Studio.