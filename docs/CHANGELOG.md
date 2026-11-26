# Changelog

## 2026-11-18
- Files: `src/types/game.ts`, `src/sensors/kinect/KinectSensor.ts`, `src/sensors/detection/RunningDetector.ts`, `src/app/App.tsx`, `kinect-bridge/KinectBridge/Program.cs`, README and Kinect documentation.
- Summary: Added local Kinect WebSocket transport, frame validation, 2-second calibration, alternating-knee cycle detection, UI status, and 2% charge integration; retained existing webcam modules and controls.
- Reason: Make Kinect V1 the primary running-in-place gameplay input.
- Verification: `npm run build` PASS sebelum pemilih mode terakhir; build setelah edit terakhir tidak dijalankan sesuai permintaan. Bridge compilation/runtime dan integrasi fisik NOT HARDWARE VERIFIED.

## 2026-11-20
- Files: kinect-bridge/KinectBridge/Program.cs, src/types/game.ts, src/app/SkeletonPreview.tsx, src/app/App.tsx, src/styles.css.
- Summary: Added real-time Skeleton Preview Visualizer Canvas inside the Kinect Link card, rendering bones, joints, knee lift centimeters (+UP/DOWN indicators), body distance in meters, and calibration status. Extended C# Kinect Bridge to include head, spine, shoulders, and feet while preserving existing JSON contract compatibility.
- Reason: User requested a visual preview to observe skeleton movement and verify detection responsiveness in real-time.
- Verification: C# build succeeded (MSBuild.exe 0 warnings, 0 errors). Frontend TypeScript typecheck passed (	sc --noEmit 0 errors).
## 2026-11-26
- Files: docs/GAMEPLAY_MECHANICS.md (file baru).
- Summary: Dibuat dokumentasi lengkap mekanik gameplay Battery Rush mencakup konsep Linear Flat Charge, nilai konfigurasi aktif, syarat charge bertambah, perhitungan siklus ke persentase ke langkah kaki, sistem state machine 4 tahap, confidence score, kondisi game selesai, sistem skor akhir (Score Curve) dengan interpolasi linear, alur sistem lengkap, dan panduan update dokumen.
- Reason: Menyediakan referensi dokumentasi gameplay yang wajib diperbarui setiap kali konsep atau nilai konfigurasi berubah.
- Verification: File dibuat dan isi dikonfirmasi sesuai dengan nilai kode aktif di src/app/App.tsx dan src/sensors/detection/RunningDetector.ts.
## 2026-11-26 (2)
- Files: src/app/App.tsx, src/styles.css.
- Summary: Memisahkan tampilan game dan setting menjadi dua view ('game' dan 'setting'). Tampilan awal hanya menampilkan stage (Live Challenge + baterai) dan launch card (START GAME). Tombol ◄ SETTING ditambahkan di topbar sebelah kanan; saat diklik bergeser menjadi SETTING ► dan menampilkan panel setting (Kinect, Camera, Input Mode, HOW TO PLAY). Tombol setting dinonaktifkan saat game berlangsung. Launch card dipindahkan ke bawah stage sebagai launch-row dengan layout horizontal.
- Reason: Permintaan pengguna agar tampilan awal bersih hanya menampilkan Live Challenge, dan setting hanya muncul saat dibutuhkan.
- Verification: TypeScript typecheck passed (	sc -p tsconfig.app.json --noEmit dan 	sc -p tsconfig.node.json --noEmit keduanya 0 errors).
## 2026-11-26 (3)
- Files: src/app/App.tsx, src/styles.css.
- Summary: Mengatasi bug canvas baterai Phaser hilang setelah berpindah view setting. Penyebab: conditional rendering {view === 'game' && ...} menyebabkan DOM baterai unmount dan instance Phaser di-destroy, namun tidak re-init karena useEffect Phaser hanya ber-dependency []. Solusi: Elemen DOM stage dipertahankan tetap mount di DOM dan hanya disembunyikan menggunakan style display: view === 'game' ? 'contents' : 'none'.
- Reason: Menjaga stabilitas engine Phaser 3 agar scene canvas baterai tetap hidup saat pengguna bolak-balik antara view Game dan Setting.
- Verification: TypeScript typecheck passed (	sc -p tsconfig.app.json --noEmit 0 errors).
## 2026-11-26 (4)
- Files: src/app/SettingsView.tsx (baru), src/app/App.tsx, src/app/SettingsDrawer.tsx (dihapus).
- Summary: Refactoring panel setting menjadi komponen terpisah SettingsView.tsx. Memperbaiki masalah sensor tangan (webcam) yang berhenti ketika kembali ke tampilan Game: container setting kini menggunakan style={{ display: view === 'setting' ? 'block' : 'none' }} sehingga elemen <video> dan <canvas> webcam tetap hidup di background DOM dan MediaPipe hand tracking terus berjalan normal. File yatim SettingsDrawer.tsx dibersihkan.
- Reason: Modularisasi kode UI agar mudah dikembangkan dan memastikan sensor kamera tetap aktif tanpa kehilangan stream video saat berpindah view.
- Verification: TypeScript typecheck passed (	sc -p tsconfig.app.json --noEmit dan 	sconfig.node.json --noEmit keduanya 0 errors).
## 2026-11-26 (5)
- Files: docs/HAND_WAVE_DETECTOR.md (baru), docs/GAMEPLAY_MECHANICS.md.
- Summary: Membuat dokumentasi komprehensif sistem sensor tangan (Webcam Wave Mode) yang mencakup arsitektur MediaPipe WASM lokal, pelacakan landmark wrist (Landmark 0), algoritma deteksi arah bolak-balik (Direction Flip + Travel Distance), filter getaran mikro (delta < 0.008), mekanisme cooldown anti-spam (450 ms), slider sensitivitas (6%–24%), serta tabel progresi pengisian baterai 10% per wave (10 wave = 100% full). Memperbarui GAMEPLAY_MECHANICS.md dengan ringkasan perhitungan mode sensor tangan.
- Reason: Menyediakan dokumentasi teknis dan referensi konsep matematika untuk pengembang mengenai deteksi sensor tangan di Battery Rush.
- Verification: File docs/HAND_WAVE_DETECTOR.md dan pembaruan docs/GAMEPLAY_MECHANICS.md berhasil ditulis dan diverifikasi.