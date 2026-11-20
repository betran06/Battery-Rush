# Changelog

## 2026-11-18
- Files: `src/types/game.ts`, `src/sensors/kinect/KinectSensor.ts`, `src/sensors/detection/RunningDetector.ts`, `src/app/App.tsx`, `kinect-bridge/KinectBridge/Program.cs`, README and Kinect documentation.
- Summary: Added local Kinect WebSocket transport, frame validation, 2-second calibration, alternating-knee cycle detection, UI status, and 2% charge integration; retained existing webcam modules and controls.
- Reason: Make Kinect V1 the primary running-in-place gameplay input.
- Verification: `npm run build` PASS sebelum pemilih mode terakhir; build setelah edit terakhir tidak dijalankan sesuai permintaan. Bridge compilation/runtime dan integrasi fisik NOT HARDWARE VERIFIED.
