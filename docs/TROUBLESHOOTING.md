# Troubleshooting

## Bridge does not connect
Symptoms: Kinect panel shows connection error. Confirm bridge process, `ws://127.0.0.1:8181/kinect`, port availability, SDK reference, and HttpListener URL ACL. Check bridge console. WebSocket path has NOT HARDWARE VERIFIED status.

## Skeleton/calibration unavailable
Confirm full-body view, tracked HipCenter and both knees, sensor placement, and Skeleton Basics sample. Tracking loss restarts calibration; wait standing still for 2 seconds.

## No battery progress
Confirm detector calibration message is ready, game phase is playing, both knees reach the 0.10 m relative lift threshold in alternating order, and tracking state is `tracked`. Validate cycle events before changing experimental thresholds.

No bridge/game failure has yet been reproduced in this environment; the above are diagnostic steps, not claimed fixes.
