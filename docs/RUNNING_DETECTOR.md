# Detektor Lari di Tempat

`RunningDetector` membandingkan posisi Y lutut terhadap `HipCenter` untuk mengurangi pengaruh pergeseran badan. Sebelum permainan, pemain berdiri tegak selama 2 detik; baseline relatif lutut dihitung dari sampel selama kalibrasi.

Nilai awal yang masih eksperimental:

- Angkat lutut minimum: 0,10 m (10 cm).
- Jeda minimum antar siklus: 250 ms.
- Kalibrasi: 2.000 ms.
- Charge per siklus valid: 2% (konstanta gameplay di `App.tsx`).

Urutan deteksi: lutut kiri naik, lutut kanan berada di bawah ambang, lutut kanan naik, lalu lutut kiri turun. Satu urutan lengkap menghasilkan satu `run-cycle`. Sendi pinggul dan kedua lutut harus berstatus `tracked`; status `inferred` dan `nottracked` diabaikan. Hilangnya tracking membatalkan kalibrasi dan pemain harus mengkalibrasi ulang.

Nilai confidence dihitung dari lift terkecil kedua lutut dibanding 1,5 kali ambang lift, lalu dibatasi pada 0–1. Nilai ini berasal dari amplitudo terukur, bukan konstanta buatan.

Uji manual setelah bridge berjalan: berdiri diam (tidak ada siklus), tahan satu lutut terangkat (tidak berulang), lakukan urutan kiri-kanan lengkap (satu siklus), lalu hilangkan tracking sebentar (kalibrasi harus dimulai ulang). Detektor dan ambang belum diuji pada Kinect nyata melalui aplikasi: **NOT HARDWARE VERIFIED**.
