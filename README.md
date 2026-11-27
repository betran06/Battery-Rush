<h1 align="center">Battery Rush</h1>
<p align="center">Game kiosk berbasis gerakan: berlari di tempat, isi baterai, dan raih 100%!</p>
<p align="center">
    <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=20232A" alt="React 19">
    <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white" alt="TypeScript 5.7">
    <img src="https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white" alt="Vite 6">
    <img src="https://img.shields.io/badge/Phaser-3-EFEFEF?logo=phaser&logoColor=black" alt="Phaser 3">
  </p>

Battery Rush adalah game kiosk interaktif yang mengubah gerakan pemain menjadi energi. Dalam mode Kinect, pemain berlari di tempat dan mengangkat lutut secara bergantian untuk mengisi baterai virtual. Mode webcam dengan gerakan tangan juga tersedia sebagai alternatif.

---

## Fitur Utama

### Kinect Run
- Menggunakan Kinect for Windows V1 untuk melacak skeleton dan gerakan kaki.
- Kalibrasi berdiri sebelum permainan dimulai.
- Mendeteksi gerakan lutut kiri dan kanan bergantian untuk mengisi baterai.
- Berkomunikasi dengan aplikasi bridge lokal melalui WebSocket.

### Webcam Wave
- Mode alternatif menggunakan webcam dan MediaPipe untuk deteksi gerakan tangan.
- Menggunakan model MediaPipe lokal; mode Kinect tidak memerlukan akses webcam.

### Pengalaman Game
- Antarmuka dan state sesi dikelola oleh React.
- Phaser menangani visual game dan tampilan baterai.
- Parameter permainan awal dapat dikonfigurasi, termasuk ambang angkat lutut dan jumlah pengisian.

---

## Teknologi yang Digunakan

| Area | Teknologi | Peran |
|---|---|---|
| Antarmuka | React 19 | Membangun UI dan mengelola state sesi game. |
| Bahasa frontend | TypeScript 5.7 | Memberi tipe pada kode, data sensor, dan event permainan. |
| Development dan build | Vite 6 | Menjalankan development server dan membangun frontend. |
| Game rendering | Phaser 3 | Merender elemen visual dan tampilan permainan. |
| Styling | Tailwind CSS 4 | Mendukung styling antarmuka. |
| Deteksi webcam | MediaPipe Tasks Vision | Melacak gerakan tangan untuk mode Webcam Wave. |
| Kinect Bridge | C# dan .NET Framework 4.8 | Menghubungkan Kinect SDK ke aplikasi browser melalui bridge lokal. |
| Sensor Kinect | Kinect SDK 1.8 | Membaca data skeleton dari Kinect for Windows V1. |
| Komunikasi | WebSocket | Mengirim data skeleton dari bridge ke frontend secara lokal. |

---

## Persyaratan

**Untuk menjalankan frontend:**
- Node.js 20.19+ atau 22.12+ dan npm.
- Browser desktop modern.

**Untuk mode Kinect:**
- Kinect for Windows V1 dengan adaptor daya yang sesuai.
- Windows dengan Kinect Runtime/SDK 1.8.
- .NET Framework 4.8 Developer Pack dan Visual Studio untuk menjalankan bridge.

Mode Kinect terhubung ke bridge lokal di `ws://127.0.0.1:8181/kinect`. Mode Webcam Wave memerlukan webcam.

---

## Instalasi dan Menjalankan

```bash
npm install
npm run dev
```

Buka alamat lokal yang ditampilkan Vite di terminal. Untuk membuat production build frontend:

```bash
npm run build
```

### Menjalankan Kinect Run

1. Sambungkan Kinect dan jalankan `kinect-bridge/KinectBridge/KinectBridge.csproj` menggunakan Visual Studio.
2. Jalankan frontend, pilih **KINECT RUN**, lalu tekan **CONNECT**.
3. Tunggu sampai skeleton terlacak dan kalibrasi berdiri selama 2 detik selesai.
4. Mulai permainan dan angkat lutut kiri-kanan secara bergantian.

Nilai awal deteksi bersifat eksperimental: ambang angkat lutut 10 cm, interval minimum 250 ms, dan pengisian 2% per siklus.

---

## Status Pengembangan

Frontend menyediakan production build melalui `npm run build`. Build dan penggunaan Kinect Bridge, koneksi WebSocket dengan sensor, kalibrasi, serta gameplay menggunakan perangkat Kinect **belum diverifikasi pada perangkat keras**.

---

<p align="center">Dibuat untuk pengalaman game kiosk yang aktif dan interaktif.</p>