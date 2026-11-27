# Panduan Instalasi & Deployment di PC Lain (Standalone Kiosk)

Dokumen ini menjelaskan langkah-langkah memindahkan, menginstal, dan menjalankan game **Battery Rush** di PC/Laptop/Mesin Kiosk lain tanpa memerlukan instalasi Node.js, npm, maupun Visual Studio di perangkat tujuan.

---

## 1. Persyaratan di Perangkat Tujuan (Target PC)

Sebelum memindahkan game, pastikan perangkat tujuan memenuhi persyaratan berikut:

| No | Komponen | Syarat Minimum | Keterangan |
|:---:|:---|:---|:---|
| 1 | **Sistem Operasi** | Windows 10 / 11 (64-bit) | Edisi Home / Pro / Enterprise |
| 2 | **Hardware Sensor** | Microsoft Kinect for Windows V1 | Wajib memakai adaptor daya listrik AC (colokkan ke stopkontak) dan kabel USB terhubung ke port USB 2.0 / USB 3.0 PC |
| 3 | **Kinect Runtime** | Microsoft Kinect Runtime v1.8 | Driver resmi Kinect v1 agar sensor terbaca Windows. [Unduh KinectRuntime-v1.8-Setup.exe](https://www.microsoft.com/en-us/download/details.aspx?id=40277&msockid=256edba8841b6bc93b8acd7685946ab9&utm_source=chatgpt.com) |
| 4 | **.NET Framework** | .NET Framework 4.8 | Sudah terpasang bawaan di Windows 10 & 11 |
| 5 | **Browser** | Google Chrome / Microsoft Edge | Digunakan untuk menjalankan web game dalam mode fullscreen kiosk |
| 6 | **Local Web Server** | Laragon / XAMPP / Nginx / IIS | Diperlukan karena browser melarang memuat WebAssembly MediaPipe via protokol `file://` |

---

## 2. File & Folder yang Wajib Disalin ke PC Tujuan

Anda **tidak perlu** menyalin kode sumber (`src/`, `node_modules/`, `.git/`). Cukup salin dua folder hasil build:

### Struktur Folder Paket Kiosk:
```text
C:\BatteryRush-Kiosk\
├── Start-Kiosk.bat             <-- [CUKUP KLIK INI UNTUK MENJALANKAN GAME]
├── webserver.exe               <-- Portable Local Server (Zero-Install, 10 KB, auto-run)
├── Bridge\                     <-- Backend Kinect WebSocket
│   ├── KinectBridge.exe        (Aplikasi sensor Kinect V1 dengan icon resmi)
│   ├── Microsoft.Kinect.dll    (Library SDK Kinect 1.8)
│   └── app.ico                 (Icon aplikasi)
│
└── WebApp\                     <-- Frontend Game
    ├── index.html              (Halaman utama game)
    ├── assets\                 (Bundle CSS & JS Phaser/React)
    ├── mediapipe\wasm\         (WebAssembly MediaPipe offline)
    └── models\                 (Model AI deteksi tangan offline)
```

---

## 3. Langkah-Langkah Pemasangan di PC Tujuan

### Langkah 1: Instal Kinect Runtime 1.8
1. Salin file installer `KinectRuntime-v1.8-Setup.exe` ke PC tujuan.
2. Jalankan installer dan ikuti petunjuk hingga selesai (*Next -> Install -> Finish*).
3. Colokkan adaptor daya Kinect V1 ke colokan listrik, lalu hubungkan kabel USB Kinect ke PC.
4. Buka **Device Manager** di Windows, pastikan muncul kategori:
   - `Kinect for Windows`
     - *Kinect for Windows Audio*
     - *Kinect for Windows Camera*
     - *Kinect for Windows Device*

### Langkah 2: Menaruh WebApp di Web Server Lokal
Karena file WebAssembly (`vision_wasm_internal.wasm`) membutuhkan protokol HTTP, taruh folder `dist/` ke web server lokal:
- **Jika menggunakan Laragon:**
  Letakkan di `C:\laragon\www\battery-rush\dist\`
- **Jika menggunakan XAMPP:**
  Letakkan di `C:\xampp\htdocs\battery-rush\dist\`
- Pastikan dapat diakses di browser melalui URL: `http://localhost/battery-rush/dist/`

### Langkah 3: Menyiapkan Kinect Bridge
1. Buat folder `Bridge\` (misal di `C:\laragon\www\battery-rush\dist\Bridge\`).
2. Masukkan file:
   - `KinectBridge.exe`
   - `Microsoft.Kinect.dll`

---

## 4. Cara Menjalankan Game

### Opsi A: Menggunakan Script Otomatis Sekali Klik (`Start-Kiosk.bat`)
Cukup jalankan file `Start-Kiosk.bat` (bisa dibuatkan shortcut ke Desktop):
1. Script otomatis membuka `KinectBridge.exe` di background.
2. Script otomatis membuka Google Chrome / Microsoft Edge dalam **mode Kiosk Fullscreen** tanpa URL bar atau tombol browser.
3. Game langsung siap dimainkan.

### Opsi B: Menjalankan Manual
1. Double-click `KinectBridge.exe`.
   - Pastikan muncul pesan:
     ```text
     [OK] Kinect connected
     [OK] Skeleton stream enabled.
     [READY] WebSocket: ws://127.0.0.1:8181/kinect
     ```
2. Buka Google Chrome di PC tersebut.
3. Buka URL: `http://localhost/battery-rush/dist/`
4. Tekan tombol **F11** untuk layar penuh (*fullscreen*).
5. Klik **`◄ SETTING`** di kanan atas untuk menghubungkan sensor (Kinect V1 atau Webcam).

---

## 5. Konfigurasi Layar Kiosk (Portrait vs Landscape)

Jika monitor kiosk yang Anda gunakan dipasang secara vertikal (berdiri / totem 9:16) atau horizontal (melebar 16:9):
1. Buka tombol **`◄ SETTING`** di kanan atas game.
2. Di baris **ORIENTATION**, pilih:
   - **LANDSCAPE** untuk monitor mendatar standar.
   - **PORTRAIT** untuk monitor tegak totem.
3. Pilihan otomatis tersimpan di PC tersebut (`localStorage`) sehingga tidak perlu diatur ulang saat game dibuka kembali.

---

## 6. Troubleshooting di PC Baru

| Gejala | Penyebab | Solusi |
|:---|:---|:---|
| `Kinect tidak ditemukan` di jendela console | Adaptor listrik Kinect belum tersambung atau USB longgar | Colokkan adaptor daya ke stopkontak (lampu adaptor hijau/oranye) dan tancapkan USB ke port lain |
| Error `Could not load file or assembly Microsoft.Kinect` | File `Microsoft.Kinect.dll` tidak ada di folder yang sama dengan `KinectBridge.exe` | Pastikan `Microsoft.Kinect.dll` disalin bersebelahan dengan `KinectBridge.exe` |
| Web blank / MediaPipe error saat membuka `index.html` langsung | Dibuka lewat `file:///` bukan web server lokal | Buka melalui web server lokal `http://localhost/...` |
| Baterai tidak merespons gerakan | Bridge belum di-CONNECT di menu Setting | Klik `◄ SETTING` lalu klik tombol **CONNECT** di kartu KINECT LINK |