# Detektor Lambaian Tangan (Webcam Mode) — Battery Rush

Dokumen ini menjelaskan arsitektur, konsep matematika, algoritma deteksi, dan sistem perhitungan pengisian baterai untuk mode sensor tangan (**Webcam Wave Mode**) di Battery Rush.

Setiap kali ada perubahan pada algoritma deteksi tangan, sensitivitas, atau konstanta pengisian baterai webcam, dokumen ini **wajib diperbarui**.

---

## 1. Ikhtisar & Arsitektur Sistem

Mode sensor tangan menggunakan webcam standar (laptop atau USB webcam eksternal) dan pustaka machine learning **Google MediaPipe Hand Landmarker** yang berjalan 100% di sisi klien (browser) menggunakan WebAssembly (WASM).

### Alur Data:
```
Webcam (getUserMedia)
       │
       ▼
Elemen <video> (HTML5)
       │
       ▼
MediaPipe Vision Runtime (WASM + Model hand_landmarker.task)
       │  (Mendeteksi 21 titik sendi tangan, mengambil Landmark 0: Wrist)
       ▼
SensorFrame { x: normalized, confidence: score, timestamp: ms }
       │
       ▼
HandWaveDetector.ts (Algoritma Direction Flip + Travel Distance)
       │
       ▼ Event 'wave'
App.tsx (Game Controller)
       │  (charge = charge + CHARGE_PER_WAVE)
       ▼
Phaser Scene (Animasi Pengisian Baterai)
```

---

## 2. Nilai Konfigurasi Aktif

Berikut parameter yang mengatur deteksi lambaian tangan dan pengisian baterai:

| Parameter | Nilai Saat Ini | Lokasi File | Keterangan |
|:---|:---:|:---|:---|
| `CHARGE_PER_WAVE` | **10%** | `src/app/App.tsx` | Penambahan daya baterai per 1 lambaian valid |
| `sensitivity` (default) | **0.12 (12%)** | `src/app/App.tsx` & UI Slider | Jarak ayunan minimum sebelum berbalik arah (rentang slider: 6% – 24%) |
| `minDetectionConfidence` | **0.55** | `src/sensors/webcam/MediaPipeProvider.ts` | Ambang keyakinan deteksi keberadaan tangan |
| `minTrackingConfidence` | **0.50** | `src/sensors/webcam/MediaPipeProvider.ts` | Ambang keyakinan pelacakan landmark tangan |
| `deltaNoiseThreshold` | **0.008 (0.8%)** | `src/sensors/detection/HandWaveDetector.ts` | Filter getaran mikro tangan (noise rejection) |
| `cooldownMs` | **450 ms** | `src/sensors/detection/HandWaveDetector.ts` | Jeda anti-spam setelah lambaian terdeteksi |
| Target baterai full | **100%** | `src/app/App.tsx` | Ambang batas kemenangan permainan |

---

## 3. Titik Acuan Pelacakan (Landmark Reference)

MediaPipe mendeteksi 21 titik sendi tangan. Sistem Battery Rush secara spesifik menggunakan **Landmark 0 (Wrist / Pergelangan Tangan)**:
- **Alasan:** Titik pergelangan tangan adalah titik paling stabil dan tidak mudah terdistorsi oleh gerakan melipat jari saat tangan diayunkan.
- **Sistem Koordinat:**
  - Koordinat $X$ dinormalisasi ke rentang $[0.0, 1.0]$.
  - $X = 0.0$ merepresentasikan batas kiri frame video.
  - $X = 1.0$ merepresentasikan batas kanan frame video.
  - $X = 0.5$ merepresentasikan garis tengah kamera.

---

## 4. Algoritma Deteksi Gerakan: Direction Flip + Distance Travel

Detektor diimplementasikan pada kelas `HandWaveDetector` (`src/sensors/detection/HandWaveDetector.ts`). Logika kerjanya menggunakan 4 langkah perhitungan:

### Langkah 1: Filter Validitas Frame
```typescript
if (!frame || frame.confidence < 0.5) {
  this.previousX = null
  this.direction = 0
  this.travel = 0
  return
}
```
Jika tangan hilang dari kamera atau confidence $< 0.5$, state akumulasi langsung direset untuk mencegah pembacaan palsu saat tangan masuk kembali.

### Langkah 2: Perhitungan Selisih Gerakan ($\Delta X$) & Filter Noise
```typescript
const delta = frame.x - this.previousX
this.previousX = frame.x

if (Math.abs(delta) < 0.008 || frame.timestamp < this.cooldownUntil) return
```
- Gerakan dengan perpindahan horizontal kurang dari $0.008$ (0.8% lebar layar) dianggap getaran biasa/noise dan diabaikan.
- Gerakan selama masa cooldown ($450\text{ ms}$) diabaikan.

### Langkah 3: Penentuan Arah Gerak Horizontal
```typescript
const nextDirection = delta > 0 ? 1 : -1
if (this.direction === 0) this.direction = nextDirection
```
- $\Delta X > 0 \implies$ Arah ke **Kanan** (`+1`)
- $\Delta X < 0 \implies$ Arah ke **Kiri** (`-1`)

### Langkah 4: Deteksi Pembalikan Arah & Evaluasi Ambang Batas
```typescript
if (nextDirection !== this.direction) {
  if (this.travel >= sensitivity) {
    this.dispatchEvent(new Event('wave'))
    this.cooldownUntil = frame.timestamp + 450
  }
  this.direction = nextDirection
  this.travel = 0
  return
}

this.travel += Math.abs(delta)
```
- Selama arah gerak sama, jarak tempuh $|\Delta X|$ diakumulasikan ke variabel `travel`.
- Ketika arah gerak **berbalik arah** (misal dari ayunan kanan berganti ke kiri):
  - Sistem memeriksa apakah jarak ayunan yang terkumpul mencapai ambang batas: $\text{travel} \ge \text{sensitivity}$.
  - Jika ya: Event `wave` dipicu, dan cooldown anti-spam $450\text{ ms}$ diaktifkan.
  - Arah baru dicatat, dan variabel `travel` direset ke $0$ untuk siklus lambaian selanjutnya.

---

## 5. Perhitungan Pengisian Baterai Menuju Full

Dengan nilai `CHARGE_PER_WAVE = 10%`:

$$\text{Jumlah Lambaian untuk Full} = \frac{100\%}{\text{CHARGE\_PER\_WAVE}} = \frac{100\%}{10\%} = \mathbf{10\text{ kali lambaian}}$$

### Tabel Progresi Pengisian Baterai:

| Lambaian ke- | Persentase Baterai | Sisa Menuju 100% |
|:---:|:---:|:---:|
| 1 | 10% | 90% |
| 2 | 20% | 80% |
| 3 | 30% | 70% |
| 4 | 40% | 60% |
| 5 | 50% | 50% |
| 6 | 60% | 40% |
| 7 | 70% | 30% |
| 8 | 80% | 20% |
| 9 | 90% | 10% |
| 10 | **100% (SELESAI)** | **0%** |

### Estimasi Durasi Permainan:
Dengan jeda debounce anti-spam minimal $450\text{ ms}$ per lambaian:
- **Lambaian Cepat:** ~5 – 7 detik.
- **Lambaian Normal/Santai:** ~8 – 12 detik.

---

## 6. Syarat Pengisian Baterai Dihitung

Event `wave` hanya akan menambah daya baterai jika ketiga syarat ini terpenuhi di `App.tsx`:
1. `phase === 'playing'` (Permainan sedang aktif setelah countdown selesai).
2. `sensorMode === 'webcam'` (Mode sensor aktif adalah webcam wave).
3. Baterai belum mencapai 100%.

---

## 7. Penanganan Sumber Daya & Latar Belakang (DOM Resilience)

Elemen `<video>` dan `<canvas>` pelacakan webcam diletakkan di dalam container yang **tidak di-unmount** saat user berpindah antara tampilan Game dan Setting:
```tsx
<div style={{ display: view === 'setting' ? 'block' : 'none' }}>
  <SettingsView ... />
</div>
```
Hal ini memastikan MediaPipe vision loop dan webcam stream tetap aktif di latar belakang tanpa terputus ketika user kembali ke tampilan game utama.