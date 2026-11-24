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