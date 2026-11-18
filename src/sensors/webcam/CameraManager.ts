export class CameraManager {
  private stream: MediaStream | null = null
  private video: HTMLVideoElement | null = null

  async start(video: HTMLVideoElement): Promise<void> {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Browser ini tidak mendukung akses kamera. Coba Chrome melalui localhost atau HTTPS.')
    }
    this.stop()
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      })
    } catch (error) {
      if (error instanceof DOMException && error.name === 'NotAllowedError') throw new Error('Izin kamera ditolak. Izinkan kamera melalui pengaturan browser, lalu coba lagi.')
      if (error instanceof DOMException && error.name === 'NotFoundError') throw new Error('Kamera tidak ditemukan. Sambungkan webcam lalu coba lagi.')
      throw new Error('Kamera gagal diakses. Pastikan tidak sedang digunakan aplikasi lain.')
    }
    this.video = video
    video.srcObject = this.stream
    try {
      await video.play()
    } catch (error) {
      this.stop()
      throw error
    }
  }

  stop(): void {
    this.stream?.getTracks().forEach((track) => track.stop())
    this.stream = null
    if (this.video) this.video.srcObject = null
    this.video = null
  }
}
