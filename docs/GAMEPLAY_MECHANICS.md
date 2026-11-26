# Gameplay Mechanics — Battery Rush

Dokumen ini menjelaskan konsep dan perhitungan sistem gameplay Battery Rush secara lengkap.
Setiap kali ada perubahan pada nilai konfigurasi, sistem pengisian baterai, atau sistem skor,
dokumen ini **wajib diperbarui** bersama perubahan kode terkait.

---

## 1. Konsep Pengisian Baterai: Linear Flat Charge

Sistem pengisian baterai menggunakan konsep **Linear Flat Charge**, yaitu:

- Setiap satu siklus lari yang valid **selalu menambah jumlah persentase yang sama**.
- Tidak ada akselerasi, penalti, maupun bonus kecepatan pada pengisian baterai.
- Kenaikan bersifat **tetap dan dapat diprediksi** oleh pemain.

```
Charge Baru = Charge Lama + CHARGE_PER_RUN_CYCLE
```

Visualisasi kenaikan bersifat linear / lurus:

```
Siklus:   0    1    2    3    4   ...   25
Charge:   0%   4%   8%  12%  16%  ...  100%
```

---

## 2. Nilai Konfigurasi Aktif

Berikut adalah nilai-nilai yang menentukan sistem pengisian baterai dan deteksi lari saat ini.
Jika nilai diubah, perbarui tabel ini sekaligus.

| Parameter | Nilai Saat Ini | Lokasi File | Keterangan |
|:---|:---:|:---|:---|
| `CHARGE_PER_RUN_CYCLE` | **4%** | `src/app/App.tsx` baris 13 | Persentase baterai per siklus lari valid |
| `CHARGE_PER_WAVE` | **10%** | `src/app/App.tsx` baris 12 | Persentase per wave tangan (mode webcam) |
| `kneeLiftMeters` | **0.10 m (10 cm)** | `src/sensors/detection/RunningDetector.ts` | Angkat lutut minimum agar dihitung valid |
| `minimumCycleIntervalMs` | **250 ms** | `src/sensors/detection/RunningDetector.ts` | Jeda minimum antar siklus (anti-spam) |
| `calibrationDurationMs` | **2000 ms (2 detik)** | `src/sensors/detection/RunningDetector.ts` | Durasi kalibrasi postur berdiri diam |
| Target baterai full | **100%** | Logika di `App.tsx` | Tidak dapat dikonfigurasi saat ini |

---

## 3. Syarat Charge Bertambah

Charge baterai **hanya bertambah** apabila **ketiga syarat berikut terpenuhi sekaligus**:

| No | Syarat | Penjelasan |
|:---:|:---|:---|
| 1 | `phase === 'playing'` | Game harus dalam fase bermain aktif, bukan welcome / countdown / won |
| 2 | `sensorMode === 'kinect'` | Mode sensor aktif adalah Kinect, bukan webcam |
| 3 | `confidence > 0` | Siklus lari terdeteksi dengan angkatan kaki yang nyata (bukan noise) |

Jika salah satu syarat tidak terpenuhi, siklus diabaikan dan baterai tidak berubah.

---

## 4. Batas Atas Baterai (Ceiling)

Baterai tidak dapat melebihi 100% meskipun siklus masuk saat baterai sudah hampir penuh.

```typescript
setCharge((value) => Math.min(100, value + CHARGE_PER_RUN_CYCLE))
```

Contoh kasus:
```
Charge saat ini = 98%
Siklus masuk    → 98 + 4 = 102
Hasil akhir     → dipotong menjadi 100% (FULL)
```

---

## 5. Perhitungan Lengkap: Siklus → Persentase → Langkah Kaki

Dengan `CHARGE_PER_RUN_CYCLE = 4%` dan `1 siklus = 2 langkah kaki (kiri + kanan)`:

| Siklus ke- | Charge Setelah Siklus | Total Langkah Kaki |
|:---:|:---:|:---:|
| 1 | 4% | 2 |
| 2 | 8% | 4 |
| 3 | 12% | 6 |
| 4 | 16% | 8 |
| 5 | 20% | 10 |
| 10 | 40% | 20 |
| 15 | 60% | 30 |
| 20 | 80% | 40 |
| 25 | **100% ✅ FULL** | **50** |

**Rumus umum:**

```
Jumlah Siklus untuk Full  = 100 / CHARGE_PER_RUN_CYCLE
                          = 100 / 4
                          = 25 siklus

Total Langkah Kaki        = Jumlah Siklus x 2
                          = 25 x 2
                          = 50 langkah kaki
```

**Estimasi durasi lari (dengan `minimumCycleIntervalMs = 250 ms`):**

| Kecepatan Lari Pemain | Siklus per Detik | Estimasi Waktu Full |
|:---|:---:|:---:|
| Santai / jogging ringan | ~1.0 – 1.5 siklus/detik | ~18 – 25 detik |
| Normal / jogging kiosk | ~1.5 – 2.0 siklus/detik | ~13 – 18 detik |
| Cepat / sprint di tempat | ~2.0 – 3.0 siklus/detik | ~9 – 13 detik |

---


---

## 5B. Perhitungan Mode Sensor Tangan (Webcam Wave Mode)

Pada mode webcam, pemain melambaikan tangan ke kiri dan ke kanan di depan kamera.
Penjelasan teknis mendalam didokumentasikan di `docs/HAND_WAVE_DETECTOR.md`.

- Nilai pengisian: `CHARGE_PER_WAVE = 10%` per satu lambaian valid.
- Rumus jumlah lambaian hingga full:
  $$\text{Target Lambaian} = 100\% \div 10\% = \mathbf{10\text{ kali lambaian tangan}}$$
- Cooldown antar lambaian: $450\text{ ms}$ (mencegah spam/false trigger).
- Estimasi durasi penyelesaian: ~6 sampai 10 detik.

## 6. Sistem Deteksi Siklus Lari (State Machine)

Setiap satu siklus lari yang valid wajib melewati **4 tahap berurutan** (Finite State Machine):

```
[LEFT-UP] → [RIGHT-DOWN] → [RIGHT-UP] → [LEFT-DOWN] → (1 Siklus Selesai)
     ↑_______________________________________________|
```

Syarat transisi setiap tahap:

| Tahap Aktif | Syarat Pindah ke Tahap Berikutnya |
|:---|:---|
| `left-up` | Lutut kiri naik ≥ 10 cm **DAN** lutut kanan di bawah 70% threshold |
| `right-down` | Lutut kanan turun ke bawah 70% threshold |
| `right-up` | Lutut kanan naik ≥ 10 cm **DAN** lutut kiri di bawah 70% threshold |
| `left-down` | Lutut kiri turun di bawah 70% threshold **DAN** jeda ≥ 250 ms dari siklus sebelumnya |

Angkatan lutut dihitung relatif terhadap baseline posisi berdiri diam:

```
leftLift  = posisi Y lutut kiri saat ini  - leftBaseline
rightLift = posisi Y lutut kanan saat ini - rightBaseline
```

---

## 7. Sistem Confidence Score

Setelah satu siklus lengkap terdeteksi, sistem menghitung nilai kepercayaan (confidence)
berdasarkan seberapa tinggi angkatan kaki dibandingkan threshold minimum:

```
confidence = min(leftPeak, rightPeak) / (kneeLiftMeters x 1.5)
           → dibatasi antara 0.0 sampai 1.0
```

Contoh dengan `kneeLiftMeters = 0.10 m`:

| Tinggi Angkatan Kaki | Confidence | Dihitung? |
|:---:|:---:|:---:|
| < 1 cm (noise) | ~0.00 – 0.06 | ❌ Diabaikan (confidence ≤ 0) |
| Tepat 10 cm (minimum) | ~0.67 | ✅ Valid |
| 12 cm | ~0.80 | ✅ Valid |
| 15 cm ke atas | 1.00 (maksimal) | ✅ Valid |

Charge **hanya dihitung jika confidence > 0**. Ini mencegah gerakan terlalu kecil atau
noise sensor dari Kinect terhitung sebagai siklus lari.

---

## 8. Kondisi Game Selesai

Game otomatis berpindah ke fase `won` ketika:

```typescript
if (phase === 'playing' && charge >= 100) {
  setFinalScore(scoreForElapsedSeconds(elapsedSeconds))
  setPhase('won')
}
```

Kondisi ini dipantau secara reaktif setiap kali `charge` atau `elapsedSeconds` berubah.

---

## 9. Sistem Skor Akhir (Score Curve)

Skor akhir pemain **bukan dari jumlah siklus**, melainkan dari **seberapa cepat baterai penuh**
menggunakan tabel interpolasi linear berikut:

```typescript
const SCORE_CURVE = [
  [0, 100], [7, 100], [8, 98], [9, 97], [10, 96], [12, 94], [15, 90],
  [20, 84], [30, 72], [45, 54], [60, 36], [90, 15], [120, 5], [180, 1],
]
```

Tabel nilai skor:

| Waktu Selesai (detik) | Skor |
|:---:|:---:|
| ≤ 7 detik | **100 poin** (sempurna) |
| 8 detik | 98 poin |
| 9 detik | 97 poin |
| 10 detik | 96 poin |
| 12 detik | 94 poin |
| 15 detik | 90 poin |
| 20 detik | 84 poin |
| 30 detik | 72 poin |
| 45 detik | 54 poin |
| 60 detik | 36 poin |
| 90 detik | 15 poin |
| 120 detik | 5 poin |
| ≥ 180 detik | **1 poin** (minimum) |

Untuk waktu di antara dua titik pada tabel, skor dihitung dengan **interpolasi linear**:

```
progress = (waktuSelesai - waktuAwal) / (waktuAkhir - waktuAwal)
skor     = waktuAwal + (skorAkhir - skorAwal) x progress
```

Contoh: Pemain selesai dalam 25 detik (antara titik 20 detik=84 dan 30 detik=72):
```
progress = (25 - 20) / (30 - 20) = 0.5
skor     = 84 + (72 - 84) x 0.5 = 84 - 6 = 78 poin
```

---

## 10. Alur Sistem Lengkap

```
START GAME (fase: countdown 3 detik)
         ↓
    fase: playing
         ↓
Kinect mengirim frame skeleton (~30 fps)
         ↓
Validasi joint: HipCenter, KneeLeft, KneeRight harus "tracked"
         ↓
Hitung relative lift:
  leftLift  = kneeLeft.y  - leftBaseline
  rightLift = kneeRight.y - rightBaseline
         ↓
State Machine 4 Tahap (left-up → right-down → right-up → left-down)
         ↓
Hitung confidence score
         ↓
   confidence > 0?
    /           \
  TIDAK          YA
    ↓              ↓
  Abaikan    dispatch "run-cycle" event
                   ↓
            charge = charge + 4%
                   ↓
           charge >= 100%?
            /           \
          TIDAK           YA
            ↓               ↓
        Lanjut lari     fase: won
                     Hitung skor dari waktu
                     Tampilkan hasil akhir
```

---

## 11. Panduan Update Dokumen Ini

Jika salah satu hal berikut berubah, **perbarui dokumen ini sekaligus**:

| Perubahan | Bagian yang Perlu Diperbarui |
|:---|:---|
| Nilai `CHARGE_PER_RUN_CYCLE` | Bagian 2, 5 (tabel & rumus), 10 |
| Nilai `kneeLiftMeters` | Bagian 2, 6, 7 |
| Nilai `minimumCycleIntervalMs` | Bagian 2, 5 (estimasi durasi) |
| Nilai `calibrationDurationMs` | Bagian 2 |
| Perubahan `SCORE_CURVE` | Bagian 9 |
| Perubahan logika state machine | Bagian 6, 10 |
| Perubahan kondisi charge / syarat | Bagian 3, 10 |
| Perubahan kondisi game selesai | Bagian 8, 10 |