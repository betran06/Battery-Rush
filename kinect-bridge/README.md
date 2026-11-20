# Battery Rush â€” Kinect Bridge (Kinect for Windows V1)

Aplikasi Windows kecil untuk membaca Skeleton Tracking dari Kinect for Windows V1 menggunakan Kinect SDK 1.8 dan mengirim frame skeleton ke browser melalui WebSocket lokal.

## Persyaratan

- Windows 10/11 (kompatibilitas runtime/driver pada Windows 11 harus diuji; SDK 1.8 tidak mencantumkan Windows 11 sebagai OS yang didukung resmi).
- Kinect for Windows V1 dengan adaptor daya yang benar.
- Kinect for Windows Runtime/SDK 1.8 sudah terpasang.
- Visual Studio dengan workload **.NET desktop development** dan .NET Framework 4.8 Developer Pack.
- File `Microsoft.Kinect.dll` tersedia pada lokasi default SDK: `C:\Program Files\Microsoft SDKs\Kinect\v1.8\Assemblies\Microsoft.Kinect.dll`.

## Membuka dan membangun

1. Buka `KinectBridge/KinectBridge.csproj` menggunakan Visual Studio.
2. Pastikan reference `Microsoft.Kinect` tidak memiliki tanda warning. Jika tidak ditemukan, perbaiki `HintPath` pada `.csproj` sesuai lokasi instalasi SDK 1.8.
3. Pilih **Build > Build Solution**.
4. Jalankan aplikasi (`F5` atau `Ctrl+F5`). Jika akses URL/port ditolak, tutup aplikasi lalu coba **Run as administrator**.
5. Console harus menampilkan `[OK] Kinect connected`, `[OK] Skeleton stream enabled`, dan `[READY] WebSocket: ws://127.0.0.1:8181/kinect`.

## Pesan WebSocket

Endpoint: `ws://127.0.0.1:8181/kinect`

Saat skeleton terdeteksi, bridge mengirim:

```json
{
  "type": "skeleton-frame",
  "tracking": true,
  "frame": 1,
  "timestamp": 1795000000000,
  "joints": {
    "hipCenter": { "x": 0.0, "y": 1.0, "z": 2.0, "state": "tracked" },
    "kneeLeft": { "x": -0.1, "y": 0.5, "z": 2.0, "state": "tracked" },
    "kneeRight": { "x": 0.1, "y": 0.5, "z": 2.0, "state": "tracked" },
    "ankleLeft": { "x": -0.1, "y": 0.1, "z": 2.0, "state": "tracked" },
    "ankleRight": { "x": 0.1, "y": 0.1, "z": 2.0, "state": "tracked" }
  }
}
```

Ketika tidak ada skeleton utuh yang dilacak, bridge mengirim `{"type":"skeleton-frame","tracking":false,...}`.

## Catatan keamanan dan jaringan

- Server hanya bind ke `127.0.0.1` (loopback), tidak diekspos ke jaringan lokal.
- Port default `8181`.
- Bridge hanya membaca koordinat skeleton; tidak mengirim gambar/video.
- Frontend React/TypeScript kini memiliki adapter Kinect dan mode running-in-place; panduan penyambungan berbahasa Indonesia ada di `../docs/KINECT_BRIDGE.md`. Integrasi ini belum diuji melalui bridge/perangkat nyata dan tetap berstatus NOT HARDWARE VERIFIED.

Catatan: folder .vs adalah cache/metadata lokal Visual Studio. Folder ini tidak diperlukan oleh Vite atau bridge, diabaikan oleh Git dan watcher Vite, dan tidak perlu dihapus.
