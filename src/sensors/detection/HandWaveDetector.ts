import type { SensorFrame } from '../../types/game'

export class HandWaveDetector extends EventTarget {
  private previousX: number | null = null
  private direction: -1 | 0 | 1 = 0
  private travel = 0
  private cooldownUntil = 0

  update(frame: SensorFrame | null, sensitivity: number): void {
    if (!frame || frame.confidence < 0.5) { this.previousX = null; this.direction = 0; this.travel = 0; return }
    if (this.previousX === null) { this.previousX = frame.x; return }
    const delta = frame.x - this.previousX
    this.previousX = frame.x
    if (Math.abs(delta) < 0.008 || frame.timestamp < this.cooldownUntil) return
    const nextDirection = delta > 0 ? 1 : -1
    if (this.direction === 0) this.direction = nextDirection
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
  }

  reset(): void { this.previousX = null; this.direction = 0; this.travel = 0; this.cooldownUntil = 0 }
}
