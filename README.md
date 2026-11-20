# Battery Rush

Battery Rush is a React, TypeScript, Vite, and Phaser motion game. Kinect V1 running-in-place is the primary challenge; the existing webcam/MediaPipe hand-wave adapter remains available in the UI. Kinect mode works without webcam permission or MediaPipe model access.

## Requirements

- Node.js 20.19+ or 22.12+ and npm.
- Windows with Kinect for Windows V1, Kinect Runtime/SDK 1.8, and the .NET Framework 4.8 Developer Pack for the bridge.
- A modern desktop browser and the local Kinect Bridge at `ws://127.0.0.1:8181/kinect`.

## Run

```sh
npm install
npm run dev
npm run build
```

Start `kinect-bridge/KinectBridge/KinectBridge.csproj` from Visual Studio, then open the Vite localhost page and connect the Kinect panel. Full-body tracking starts a 2-second standing calibration; after it completes, start the round and alternate knee lifts. The experimental defaults are 10 cm knee lift, 250 ms minimum cycle interval, and 2% battery per valid cycle.

Webcam controls remain as a separate fallback and still use the local MediaPipe assets/model. Neither sensor sends video to a server.

## Verification status

Frontend production build has been run. Kinect Bridge compilation, Windows 11 runtime, WebSocket hardware connection, calibration, and real running cycles have NOT HARDWARE VERIFIED. See `docs/TESTING.md` and `docs/KINECT_BRIDGE.md`.
## Menghubungkan Kinect

Kinect V1 adalah sensor utama untuk mode **KINECT RUN**. Sambungkan perangkat, jalankan bridge C# dari Visual Studio, lalu buka aplikasi dan pilih mode tersebut. Tekan **CONNECT** pada kartu Kinect; setelah skeleton tubuh terlacak, berdiri tegak selama kalibrasi 2 detik. Tombol mulai hanya menerima ronde Kinect setelah bridge tersambung dan kalibrasi selesai. Langkah build, endpoint, dan troubleshooting tersedia di `docs/KINECT_BRIDGE.md` serta `docs/KINECT_SETUP.md`.

Mode webcam-wave tetap tersedia sebagai alternatif dan tidak dibutuhkan saat mode Kinect dipilih.

Untuk memakai fallback webcam, pilih **WEBCAM WAVE** pada pemilih mode. Tracking webcam tetap menggunakan model MediaPipe lokal `public/models/hand_landmarker.task`; mode Kinect tidak membutuhkan izin kamera atau file model tersebut.
