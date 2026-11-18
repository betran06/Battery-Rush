# Battery Rush

Browser-based motion game MVP. React owns the game session state; Phaser renders the battery display. Webcam hand landmarks are processed locally by MediaPipe. No video is stored or uploaded.

## Requirements

- Node.js 20.19+ or 22.12+ and npm.
- A modern desktop browser. Camera access requires localhost or HTTPS.
- A compatible MediaPipe Hand Landmarker model at `public/models/hand_landmarker.task` for real tracking.

## Run locally

```sh
npm install
npm run dev
```

Open the localhost address shown by Vite. Connect the camera and allow permission. If the model file is missing, camera access remains local and the UI displays an actionable error; obtain a compatible model from the official MediaPipe Hand Landmarker model documentation and place it at the path above. The MediaPipe WASM files are copied from the installed package into a local public path before development and production builds; tracking does not need a CDN.

## Checks

```sh
npm run build
npm run preview
```

## Gameplay

Start a 45-second round and complete ten side-to-side hand-wave cycles. Each cycle adds 10% charge. Sensitivity can be adjusted in the controls. Play Again resets the round without refreshing.

## Sensor architecture

`SensorSource` is the boundary for future sensor adapters. The MVP connects only the webcam adapter. Kinect Xbox 360, running-in-place detection, and device compatibility are intentionally not implemented or claimed.
