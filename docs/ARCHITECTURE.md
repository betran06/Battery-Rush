# Architecture

## Data flow

Kinect V1 -> Kinect SDK 1.8 SkeletonFrame -> C# .NET Framework 4.8 bridge -> `ws://127.0.0.1:8181/kinect` JSON -> `KinectSensor` validation -> `RunningDetector` calibration and alternating-step state machine -> React session state -> Phaser battery rendering.

The bridge sends hip center, knees, ankles, tracking state, frame number, and Unix-millisecond timestamp. The TypeScript transport validates the frame envelope and required joints. The detector ignores frames without tracked hip/knees and emits one `run-cycle` event only after the alternating sequence. React accepts those events only during active gameplay; Phaser receives charge as a display update. React remains the game-state source of truth.

The webcam and MediaPipe modules remain isolated as a fallback input path. Kinect mode does not request camera permission or depend on MediaPipe.

## Lifecycle

Connect opens the loopback WebSocket; disconnect/unmount closes it. Bridge and sensor errors appear in the sensor panel. Physical-device validation is still required.
