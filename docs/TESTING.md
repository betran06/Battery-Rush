# Testing

## Automated

- `npm run build` — PASS sebelum penambahan pemilih mode Kinect/webcam terakhir. Build tidak dijalankan ulang atas permintaan pengguna; perubahan terakhir belum diverifikasi compile.

## Manual / hardware

| Scenario | Expected | Actual |
|---|---|---|
| Kinect Bridge compile and launch on Windows 11 | Bridge starts and reports sensor/endpoint | NOT HARDWARE VERIFIED |
| Browser WebSocket connection | Connected status and incoming frame payload | NOT HARDWARE VERIFIED |
| Full-body tracking and 2-second calibration | Ready message after stable standing | NOT HARDWARE VERIFIED |
| Alternating leg cycle | Single run-cycle and +2% charge while playing | NOT HARDWARE VERIFIED |
| Held knee / tracking loss | No repeat event; recalibration after loss | NOT HARDWARE VERIFIED |
| Webcam fallback | Existing MediaPipe hand challenge remains available | NOT RETESTED |

Environment for automated check: project workspace with installed npm dependencies. The physical Kinect and C# SDK build were not run in this check.
