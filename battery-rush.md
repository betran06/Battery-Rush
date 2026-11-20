# Battery Rush --- Project Plan

> **Dokumen instruksi untuk AI coding agent**\
> Nama proyek: `battery-rush`\
> Jenis aplikasi: Browser-based motion-sensing game\
> Tahap awal: Webcam laptop + hand-wave challenge\
> Pengembangan berikutnya: Kinect Xbox 360 + running-in-place challenge

------------------------------------------------------------------------

## 1. Ringkasan Proyek

Battery Rush adalah game interaktif berbasis web. Pemain mengisi baterai
virtual dengan melakukan gerakan tubuh di depan kamera. Game menghitung
gerakan yang valid dan menampilkan progres baterai serta waktu
penyelesaian.

Pengembangan dilakukan bertahap:

1.  **MVP:** pemain melambaikan tangan di depan webcam laptop untuk
    mengisi baterai.
2.  **Pengembangan lanjutan:** pemain berlari di tempat; gerakan kaki
    dideteksi menggunakan Kinect Xbox 360.
3.  Arsitektur harus memungkinkan pergantian sumber sensor tanpa menulis
    ulang logika inti permainan.

Kinect V1 dan skeleton tracking telah tersedia menurut pengujian pemilik project. Frontend Kinect sedang diintegrasikan; status aktual dicatat dalam docs/testing dan changelog. Jangan klaim komponen yang belum diuji berhasil.

## 2. Tujuan MVP

MVP dianggap berhasil apabila:

-   Aplikasi dapat dijalankan secara lokal di browser desktop.
-   Browser meminta izin kamera dan menampilkan status kamera.
-   MediaPipe mendeteksi landmark tangan secara real-time.
-   Sistem mengenali satu siklus lambaian tangan yang valid, bukan
    menghitung setiap frame sebagai gerakan.
-   Setiap gerakan valid menambah progres baterai.
-   Permainan memiliki countdown, timer, kondisi menang/kalah, dan layar
    hasil.
-   Pemain dapat mengulang permainan tanpa me-refresh halaman.
-   Aplikasi tetap dapat dibuka dan menu dapat digunakan ketika kamera
    belum diizinkan; tampilkan instruksi/error yang jelas.

## 3. Teknologi yang Dipilih

  ---------------------------------------------------------------------------
  Area                    Teknologi                   Kegunaan
  ----------------------- --------------------------- -----------------------
  Framework UI            React                       Menu, pengaturan, HUD,
                                                      hasil

  Bahasa                  TypeScript                  Tipe data dan kontrak
                                                      antar-modul

  Build tool              Vite                        Development server dan
                                                      build

  Game engine             Phaser 3                    Area permainan,
                                                      animasi, efek, scene

  Computer vision         `@mediapipe/tasks-vision`   Hand Landmarker untuk
                                                      webcam

  Camera access           Browser MediaDevices API    Mengakses webcam

  Styling                 Tailwind CSS                Layout dan komponen UI

  Icons                   `lucide-react`              Ikon antarmuka

  Version control         Git                         Riwayat perubahan
  ---------------------------------------------------------------------------

Tidak diperlukan backend, database, autentikasi, atau layanan cloud
untuk MVP.

### Catatan teknis

-   Gunakan MediaPipe **Hand Landmarker** untuk MVP.
-   `Pose Landmarker` dapat dievaluasi pada tahap pengembangan running
    challenge berbasis webcam, tetapi bukan pengganti otomatis untuk
    Kinect.
-   Phaser menangani gameplay dan rendering game. React menangani
    halaman, menu, kontrol, status sensor, serta hasil.
-   Hindari membuat dua sumber kebenaran untuk state game. Tetapkan satu
    game controller/state flow dan dokumentasikan cara React
    berkomunikasi dengan Phaser.
-   Gunakan versi package yang kompatibel dan simpan lockfile. Jangan
    memasang package yang tidak diperlukan.

## 4. Batasan Scope

### Termasuk dalam MVP

-   Welcome/menu screen.
-   Permission dan preview webcam.
-   Status kamera: belum dimulai, meminta izin, aktif, error.
-   Hand landmark tracking.
-   Hand-wave motion detection.
-   Battery progress 0--100%.
-   Countdown sebelum permainan.
-   Timer permainan.
-   Game completed / time expired.
-   Result screen dan play again.
-   Layout desktop dan mode fullscreen.
-   Pengaturan sederhana untuk sensitivitas atau threshold jika
    dibutuhkan untuk kalibrasi.

### Tidak termasuk dalam MVP

-   Integrasi Kinect Xbox 360 yang sesungguhnya.
-   Running-in-place menggunakan deteksi kaki.
-   Multiplayer.
-   Login, database, leaderboard online.
-   Backend/API.
-   Sistem pembayaran atau akun pemain.
-   Deployment produksi sebelum MVP diuji.

Jangan memperluas scope tanpa alasan teknis yang jelas.

## 5. Struktur Folder Target

Gunakan struktur berikut. Sesuaikan secara wajar jika Vite menghasilkan
file konfigurasi tambahan.

``` text
battery-rush/
â”œâ”€â”€ public/
â”‚   â”œâ”€â”€ assets/
â”‚   â”‚   â”œâ”€â”€ images/
â”‚   â”‚   â”œâ”€â”€ audio/
â”‚   â”‚   â””â”€â”€ sprites/
â”‚   â””â”€â”€ models/
â”‚       â””â”€â”€ README.md
â”‚
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ app/
â”‚   â”‚   â”œâ”€â”€ App.tsx
â”‚   â”‚   â””â”€â”€ routes.ts
â”‚   â”‚
â”‚   â”œâ”€â”€ components/
â”‚   â”‚   â”œâ”€â”€ layout/
â”‚   â”‚   â”‚   â”œâ”€â”€ GameLayout.tsx
â”‚   â”‚   â”‚   â””â”€â”€ FullscreenButton.tsx
â”‚   â”‚   â”œâ”€â”€ camera/
â”‚   â”‚   â”‚   â”œâ”€â”€ CameraPreview.tsx
â”‚   â”‚   â”‚   â””â”€â”€ CameraStatus.tsx
â”‚   â”‚   â”œâ”€â”€ game/
â”‚   â”‚   â”‚   â”œâ”€â”€ BatteryDisplay.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ TimerDisplay.tsx
â”‚   â”‚   â”‚   â””â”€â”€ MotionCounter.tsx
â”‚   â”‚   â””â”€â”€ result/
â”‚   â”‚       â””â”€â”€ ResultCard.tsx
â”‚   â”‚
â”‚   â”œâ”€â”€ pages/
â”‚   â”‚   â”œâ”€â”€ HomePage.tsx
â”‚   â”‚   â”œâ”€â”€ GamePage.tsx
â”‚   â”‚   â”œâ”€â”€ ResultPage.tsx
â”‚   â”‚   â””â”€â”€ SettingsPage.tsx
â”‚   â”‚
â”‚   â”œâ”€â”€ game/
â”‚   â”‚   â”œâ”€â”€ config/
â”‚   â”‚   â”‚   â””â”€â”€ gameConfig.ts
â”‚   â”‚   â”œâ”€â”€ scenes/
â”‚   â”‚   â”‚   â”œâ”€â”€ BootScene.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ MenuScene.ts
â”‚   â”‚   â”‚   â””â”€â”€ GameScene.ts
â”‚   â”‚   â”œâ”€â”€ objects/
â”‚   â”‚   â”‚   â””â”€â”€ Battery.ts
â”‚   â”‚   â”œâ”€â”€ effects/
â”‚   â”‚   â”‚   â””â”€â”€ ChargingEffect.ts
â”‚   â”‚   â”œâ”€â”€ GameManager.ts
â”‚   â”‚   â””â”€â”€ PhaserGame.tsx
â”‚   â”‚
â”‚   â”œâ”€â”€ sensors/
â”‚   â”‚   â”œâ”€â”€ core/
â”‚   â”‚   â”‚   â”œâ”€â”€ SensorInterface.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ SensorManager.ts
â”‚   â”‚   â”‚   â””â”€â”€ SensorTypes.ts
â”‚   â”‚   â”œâ”€â”€ webcam/
â”‚   â”‚   â”‚   â”œâ”€â”€ WebcamSensor.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ CameraManager.ts
â”‚   â”‚   â”‚   â””â”€â”€ MediaPipeProvider.ts
â”‚   â”‚   â”œâ”€â”€ tracking/
â”‚   â”‚   â”‚   â”œâ”€â”€ HandTracker.ts
â”‚   â”‚   â”‚   â””â”€â”€ PoseTracker.ts
â”‚   â”‚   â”œâ”€â”€ detection/
â”‚   â”‚   â”‚   â”œâ”€â”€ HandWaveDetector.ts
â”‚   â”‚   â”‚   â””â”€â”€ RunningDetector.ts
â”‚   â”‚   â””â”€â”€ kinect/
â”‚   â”‚       â”œâ”€â”€ KinectSensor.ts
â”‚   â”‚       â””â”€â”€ README.md
â”‚   â”‚
â”‚   â”œâ”€â”€ services/
â”‚   â”‚   â””â”€â”€ GameSessionService.ts
â”‚   â”œâ”€â”€ hooks/
â”‚   â”‚   â””â”€â”€ useCamera.ts
â”‚   â”œâ”€â”€ types/
â”‚   â”‚   â””â”€â”€ game.ts
â”‚   â”œâ”€â”€ utils/
â”‚   â”‚   â””â”€â”€ time.ts
â”‚   â”œâ”€â”€ styles/
â”‚   â”‚   â””â”€â”€ index.css
â”‚   â”œâ”€â”€ main.tsx
â”‚   â””â”€â”€ vite-env.d.ts
â”‚
â”œâ”€â”€ .gitignore
â”œâ”€â”€ index.html
â”œâ”€â”€ package.json
â”œâ”€â”€ package-lock.json
â”œâ”€â”€ tsconfig.json
â”œâ”€â”€ vite.config.ts
â””â”€â”€ README.md
```

### Aturan struktur

-   Jangan membuat semua file sekaligus jika belum dibutuhkan. Buat
    struktur secara bertahap sesuai fase.
-   `components/` berisi komponen React yang dapat digunakan ulang.
-   `pages/` mengatur komposisi halaman.
-   `game/` berisi implementasi Phaser dan objek/scene permainan.
-   `sensors/` mengurus akses perangkat, tracking, dan deteksi gerakan.
-   `services/` menghubungkan hasil sensor dengan sesi permainan; jangan
    menaruh algoritma tracking di sini.
-   `types/` atau `sensors/core/` menjadi tempat kontrak TypeScript yang
    digunakan lintas modul.
-   Jangan membuat duplikasi tipe atau logika yang sama di beberapa
    folder.

## 6. Kontrak Data Sensor

Game tidak boleh bergantung langsung pada MediaPipe atau Kinect. Sensor
harus menghasilkan event gerakan yang telah dinormalisasi.

Contoh tipe awal:

``` ts
export type MotionType =
  | "hand_wave"
  | "left_step"
  | "right_step";

export interface MotionEvent {
  type: MotionType;
  timestamp: number;
  confidence: number;
}

export interface SensorInterface {
  initialize(): Promise<void>;
  start(): Promise<void>;
  stop(): void;
  destroy(): void;
}
```

Kontrak ini merupakan titik awal, bukan alasan untuk membuat abstraksi
berlebihan. Tentukan mekanisme pengiriman event yang jelas, misalnya
callback `onMotion` atau event listener. Pastikan kontrak akhir
mendukung:

-   status sensor dan error;
-   inisialisasi, mulai, berhenti, dan pembersihan resource;
-   event gerakan yang valid;
-   confidence dan timestamp;
-   pelepasan listener ketika komponen/game dihancurkan.

Jangan mengirim setiap frame landmark ke game jika game hanya
membutuhkan event gerakan valid. Landmark mentah tetap berada di lapisan
tracking/detection.

## 7. Desain Logika Hand-Wave Detection

### Tujuan

Menghitung satu gerakan hanya ketika tangan menyelesaikan satu siklus
gerakan kiri-ke-kanan atau kanan-ke-kiri sesuai definisi detector.

### Alur

1.  MediaPipe menghasilkan landmark tangan.
2.  Ambil koordinat landmark pergelangan tangan (`wrist`) atau landmark
    stabil lain yang dipilih setelah pengujian.
3.  Normalisasi koordinat terhadap ukuran frame.
4.  Tentukan zona kiri, tengah, dan kanan atau gunakan threshold
    perpindahan horizontal.
5.  Kenali perubahan arah yang memenuhi jarak minimum.
6.  Hitung satu siklus hanya setelah gerakan bolak-balik lengkap.
7.  Terapkan cooldown/debounce untuk mencegah hitungan ganda.
8.  Abaikan deteksi dengan confidence rendah atau data yang tidak
    stabil.
9.  Kirim satu `MotionEvent` untuk setiap gerakan valid.

### Proteksi false positive

-   Jangan menghitung satu gerakan berkali-kali saat tangan tertahan di
    satu posisi.
-   Gunakan threshold perpindahan minimum.
-   Gunakan cooldown yang dapat dikonfigurasi.
-   Tangani tangan hilang dari frame dan tracking yang terputus.
-   Hindari menganggap jitter kecil sebagai lambaian.
-   Uji tangan kiri dan kanan serta posisi pemain yang berbeda.
-   Jangan mengunci angka threshold secara permanen sebelum pengujian
    nyata.

### Konfigurasi awal untuk diuji

Nilai berikut hanya baseline eksperimen, bukan hasil kalibrasi final:

  Parameter                      Nilai awal
  --------------------------- -------------
  Target baterai                       100%
  Tambahan per siklus valid              2%
  Jumlah siklus target                   50
  Batas waktu                      30 detik
  Countdown                         3 detik
  Confidence minimum                    0.6
  Cooldown                      250--400 ms

Simpan parameter gameplay dan deteksi dalam konfigurasi terpisah agar
mudah diubah tanpa mengedit algoritma.

## 8. Game Flow

Gunakan alur status yang eksplisit:

``` text
HOME
  |
  v
CAMERA_PERMISSION
  |
  v
CAMERA_READY
  |
  v
COUNTDOWN
  |
  v
PLAYING
  |             \
  |              \ waktu habis
  v               v
COMPLETED       TIME_UP
  \               /
   \             /
    v           v
       RESULT
         |
         v
       PLAY_AGAIN
```

### Aturan permainan

-   Permainan tidak dimulai sebelum kamera siap dan tracking tersedia.
-   Countdown dimulai setelah pemain menekan tombol mulai.
-   Timer permainan baru berjalan setelah countdown selesai.
-   Setiap event `hand_wave` valid menambah baterai sesuai konfigurasi.
-   Progress tidak boleh melebihi 100%.
-   Ketika baterai mencapai 100%, hentikan timer dan sensor/event
    permainan, lalu tampilkan hasil.
-   Jika waktu habis sebelum baterai penuh, tampilkan hasil gagal/time
    up.
-   Tombol Play Again harus mereset timer, progress, counter, detector
    state, dan sesi permainan.
-   Hindari event sensor yang terlambat mengubah hasil setelah sesi
    berakhir.

## 9. Fase Implementasi

Agent harus mengerjakan fase secara berurutan. Jangan melompat ke fase
berikutnya sebelum kriteria penerimaan fase aktif terpenuhi.

### Phase 0 --- Audit dan Project Setup

Tugas: - Periksa isi repository terlebih dahulu. - Jika repository belum
berisi project, buat React + TypeScript menggunakan Vite. - Jika sudah
ada project, pertahankan konfigurasi dan pekerjaan yang valid. - Pasang
dependency yang disepakati. - Konfigurasikan Tailwind sesuai versi yang
dipasang. - Buat struktur folder minimum yang diperlukan. - Pastikan
`npm run dev` berjalan.

Acceptance criteria: - Tidak ada konfigurasi lama yang dihapus tanpa
alasan. - Aplikasi Vite dapat dijalankan. - TypeScript tidak memiliki
error. - README memuat cara menjalankan project.

### Phase 1 --- UI Foundation

Tugas: - Buat welcome screen dengan judul Battery Rush. - Buat tombol
Start dan informasi singkat cara bermain. - Buat layout area game. -
Buat tampilan battery progress, timer, counter, status kamera, dan
result state. - Gunakan desain responsif yang diutamakan untuk
desktop/kiosk. - Sediakan tampilan fullscreen.

Acceptance criteria: - Navigasi dasar berfungsi. - Tampilan tidak
overflow pada ukuran layar desktop umum. - Komponen UI tidak bergantung
pada kamera yang sudah aktif. - Gunakan data dummy hanya untuk preview
UI dan beri pemisahan jelas dari mode sensor nyata.

### Phase 2 --- Webcam Integration

Tugas: - Minta akses kamera menggunakan
`navigator.mediaDevices.getUserMedia`. - Gunakan kamera yang tersedia
dan sediakan pilihan kamera jika memungkinkan. - Tampilkan preview
kamera. - Tampilkan status permission, loading, aktif, dan error. -
Hentikan semua media track saat kamera dilepas atau halaman ditutup. -
Inisialisasi MediaPipe Hand Landmarker melalui
`@mediapipe/tasks-vision`. - Pilih mode video dan model asset yang
sesuai. - Dokumentasikan sumber dan cara memuat model asset; jangan
mengarang URL model.

Acceptance criteria: - Browser dapat meminta izin kamera. - Video tampil
ketika izin diberikan. - Penolakan izin menghasilkan pesan yang mudah
dipahami. - Kamera dapat dihentikan dan diaktifkan kembali. - Tidak ada
stream kamera yang tertinggal setelah cleanup.

### Phase 3 --- Hand Tracking dan Motion Detection

Tugas: - Baca landmark tangan dari frame video. - Pisahkan tracking dari
algoritma deteksi lambaian. - Implementasikan detector dengan state
machine agar gerakan memiliki awal, arah, titik balik, dan
penyelesaian. - Tambahkan confidence threshold, minimum displacement,
dan cooldown. - Sediakan mode debug untuk menampilkan landmark dan event
yang terdeteksi. - Batasi pemrosesan agar tidak memblokir UI; ukur
performa pada perangkat target.

Acceptance criteria: - Landmark tangan dapat terlihat pada mode debug. -
Satu siklus lambaian menghasilkan tepat satu event. - Tangan diam tidak
terus menambah counter. - Jitter kecil tidak menghasilkan event. -
Tracking yang hilang tidak membuat event palsu. - Deteksi dapat diuji
tanpa menjalankan seluruh game.

### Phase 4 --- Gameplay Integration

Tugas: - Hubungkan `MotionEvent` dengan game session. - Tambahkan
progress baterai. - Implementasikan countdown, timer, completed, dan
time-up. - Tampilkan feedback visual/audio ketika gerakan valid. -
Pastikan timer dan progress hanya berubah saat sesi bermain. - Tambahkan
restart yang membersihkan state dan event lama.

Acceptance criteria: - Gerakan valid meningkatkan progress. - Gerakan
tidak valid tidak meningkatkan progress. - Baterai berhenti di 100%. -
Timer berhenti ketika game selesai. - Restart menghasilkan sesi baru
yang bersih. - Tidak ada update state setelah sesi berakhir.

### Phase 5 --- Testing dan Stabilization

Tugas: - Uji izin kamera diterima dan ditolak. - Uji kamera tidak
tersedia atau sedang dipakai aplikasi lain. - Uji tangan kiri/kanan,
jarak pemain, dan variasi pencahayaan. - Uji false positive, tracking
loss, dan performa. - Uji game completed, time-up, dan restart. -
Jalankan pemeriksaan TypeScript, lint (jika dikonfigurasi), dan
production build. - Catat isu yang belum terselesaikan.

Acceptance criteria: - Tidak ada error runtime kritis pada alur utama. -
Kamera selalu dibersihkan dengan benar. - Semua kondisi akhir game
berjalan konsisten. - Production build berhasil.

### Phase 6 --- Kinect Running Challenge

Frontend memiliki adapter WebSocket `KinectSensor` dan `RunningDetector`. Bridge C# memakai Kinect SDK 1.8 dan endpoint loopback `ws://127.0.0.1:8181/kinect`. Running detector menggunakan kalibrasi 2 detik, ambang lutut 10 cm, interval minimum 250 ms, dan charge 2% per siklus sebagai nilai eksperimental. Build frontend lulus; bridge build, koneksi WebSocket, dan gameplay dengan perangkat nyata masih NOT HARDWARE VERIFIED.

Penting: Kinect bukan webcam standar; pertahankan boundary antara SDK di bridge, WebSocket, adapter browser, detector, dan game state. Jangan menyatakan kompatibilitas Windows 11 atau gameplay selesai sebelum pengujian fisik.

## 10. UI/UX Direction

Arah visual: - Nuansa arcade/futuristic yang bersih. - Fokus utama pada
baterai, persentase, timer, dan instruksi gerakan. - Kontras tinggi agar
terbaca dari jarak beberapa meter. - Animasi charging memberi feedback
langsung tetapi tidak mengganggu. - Tombol besar dan mudah digunakan
pada layar sentuh/kiosk. - Hindari elemen dekoratif yang mengurangi
keterbacaan.

Halaman utama: 1. Welcome screen. 2. Camera setup / camera ready. 3.
Countdown. 4. Gameplay HUD. 5. Result screen.

Jangan menghabiskan waktu pada animasi kompleks sebelum tracking dan
gameplay inti berfungsi.

## 11. Non-Functional Requirements

-   Target awal: browser desktop modern, terutama Chrome.
-   Kamera memerlukan permission browser dan umumnya secure context;
    `localhost` dapat digunakan untuk development.
-   Tangani kamera yang tidak tersedia, permission ditolak, dan model
    gagal dimuat.
-   Bersihkan stream, animation loop, listener, dan resource Phaser saat
    unmount.
-   Jangan menyimpan atau mengunggah video kamera.
-   Pemrosesan kamera dilakukan lokal di browser untuk MVP.
-   Jangan menampilkan video preview jika pengguna tidak mengaktifkannya
    atau jika desain tidak memerlukannya.
-   Jaga kode modular, typed, dan mudah diuji.
-   Hindari dependency tambahan tanpa kebutuhan yang jelas.

## 12. Perintah Development

Buat project jika repository masih kosong:

``` bash
npm create vite@latest battery-rush -- --template react-ts
cd battery-rush
npm install
npm install phaser @mediapipe/tasks-vision lucide-react
npm install tailwindcss @tailwindcss/vite
npm run dev
```

Catatan: sesuaikan konfigurasi Tailwind dengan dokumentasi versi package
yang terpasang. Jangan menyalin konfigurasi Tailwind versi lama jika
menggunakan versi baru.

Perintah pemeriksaan yang perlu disediakan/dijalankan sesuai scripts
project:

``` bash
npm run dev
npm run build
npm run preview
```

Jika script lint belum ada, agent boleh menambahkan ESLint dengan
konfigurasi TypeScript yang sesuai dan mendokumentasikannya.

## 13. Instruksi Wajib untuk AI Agent

1.  Baca dokumen ini sebelum melakukan perubahan.
2.  Audit repository dan file yang sudah ada sebelum membuat,
    memindahkan, atau menghapus file.
3.  Kerjakan satu fase dalam satu waktu.
4.  Sebelum coding, sampaikan ringkasan pendek rencana fase aktif dan
    file utama yang akan dibuat/diubah.
5.  Jangan menghapus kode, asset, konfigurasi, atau fitur yang sudah ada
    tanpa alasan dan persetujuan yang jelas.
6.  Jangan membuat seluruh aplikasi dalam satu langkah besar.
7.  Jangan membuat mock sensor seolah-olah merupakan hasil kamera nyata.
    Jika memakai mock untuk UI, beri label `demo/mock`.
8.  Jangan mengarang hasil pengujian. Laporkan perintah yang benar-benar
    dijalankan dan hasilnya.
9.  Gunakan TypeScript dengan tipe eksplisit untuk kontrak sensor dan
    event game.
10. Pisahkan tracking, motion detection, game logic, dan UI.
11. Tangani cleanup kamera, MediaPipe, Phaser, event listener, dan
    timer.
12. Jangan menambahkan backend, database, autentikasi, atau multiplayer
    ke MVP.
13. Jangan mengimplementasikan Kinect sebelum perangkat dan
    kompatibilitasnya diverifikasi.
14. Setelah setiap fase, jalankan pemeriksaan yang relevan dan laporkan:
    -   file yang dibuat/diubah;
    -   fitur yang selesai;
    -   perintah test/build yang dijalankan;
    -   hasil test/build;
    -   kendala dan pekerjaan berikutnya.
15. Jika ada keputusan teknis yang belum dapat dipastikan, jelaskan
    asumsi dan pilih solusi paling sederhana yang dapat diverifikasi.

## 14. Definition of Done --- MVP

MVP dinyatakan selesai jika seluruh poin berikut terpenuhi:

-   [ ] Project dapat dijalankan dengan `npm run dev`.
-   [ ] Welcome screen dan navigasi dasar berfungsi.
-   [ ] Kamera laptop dapat diakses melalui browser.
-   [ ] Status permission dan error kamera ditangani.
-   [ ] MediaPipe mendeteksi landmark tangan.
-   [ ] Hand-wave detector menghitung satu siklus sebagai satu gerakan.
-   [ ] Gerakan valid menambah baterai.
-   [ ] Countdown dan timer berfungsi.
-   [ ] Baterai 100% menghasilkan status completed.
-   [ ] Waktu habis menghasilkan status time-up.
-   [ ] Play Again mereset sesi dengan benar.
-   [ ] Resource kamera dan game dibersihkan dengan benar.
-   [ ] `npm run build` berhasil.
-   [ ] README menjelaskan instalasi, penggunaan, dan troubleshooting
    dasar.

------------------------------------------------------------------------

## 15. Prioritas Pengerjaan Pertama

**Mulai dari Phase 0, lalu Phase 1.** Jangan langsung membuat seluruh
fitur.

Target milestone pertama adalah aplikasi React + TypeScript + Vite
berjalan dengan struktur dasar dan welcome screen. Setelah itu lanjut ke
integrasi webcam, kemudian MediaPipe Hand Landmarker.

**Prinsip utama proyek:** buktikan sensor dan deteksi gerakan terlebih
dahulu; sempurnakan visual game setelah input gerakan terbukti stabil.

## Catatan integrasi Kinect (18 November 2026)

Project sudah memiliki frontend Kinect WebSocket adapter dan detektor running-in-place, sementara webcam/MediaPipe tetap tersedia. Lihat `docs/ARCHITECTURE.md`, `docs/KINECT_BRIDGE.md`, dan `docs/RUNNING_DETECTOR.md` untuk rancangan implementasi saat ini. Catatan lama pada dokumen ini yang menyatakan Kinect belum diimplementasikan menggambarkan kondisi sebelum integrasi frontend. Build frontend sudah lulus; Bridge dan permainan menggunakan sensor nyata masih **NOT HARDWARE VERIFIED**.
