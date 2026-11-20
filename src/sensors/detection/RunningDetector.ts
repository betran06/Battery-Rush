import type { KinectSkeletonFrame, RunCycleEvent } from '../../types/game'

export interface RunningDetectorConfig {
  kneeLiftMeters: number
  minimumCycleIntervalMs: number
  calibrationDurationMs: number
}

type Step = 'left-up' | 'right-down' | 'right-up' | 'left-down'

export class RunningDetector extends EventTarget {
  private readonly config: RunningDetectorConfig
  private calibrationStartedAt: number | null = null
  private calibrationSamples = 0
  private leftBaseline = 0
  private rightBaseline = 0
  private leftPeak = 0
  private rightPeak = 0
  private step: Step = 'left-up'
  private previousCycleAt = -Infinity

  constructor(config: Partial<RunningDetectorConfig> = {}) {
    super()
    this.config = { kneeLiftMeters: 0.1, minimumCycleIntervalMs: 250, calibrationDurationMs: 2000, ...config }
  }

  get isCalibrated(): boolean { return this.calibrationStartedAt === -1 }

  update(frame: KinectSkeletonFrame): 'waiting' | 'calibrating' | 'calibrated' | 'tracking-lost' {
    const joints = frame.joints
    if (!frame.tracking || !joints || [joints.hipCenter, joints.kneeLeft, joints.kneeRight].some((joint) => joint.state !== 'tracked')) {
      this.resetCalibration()
      return 'tracking-lost'
    }

    const left = joints.kneeLeft.y - joints.hipCenter.y
    const right = joints.kneeRight.y - joints.hipCenter.y
    if (this.calibrationStartedAt !== -1) {
      if (this.calibrationStartedAt === null) {
        this.calibrationStartedAt = frame.timestamp
        this.leftBaseline = left
        this.rightBaseline = right
        this.calibrationSamples = 1
      }
      const elapsed = frame.timestamp - this.calibrationStartedAt
      if (elapsed >= this.config.calibrationDurationMs) {
        this.calibrationStartedAt = -1
        this.step = 'left-up'
        return 'calibrated'
      }
      this.calibrationSamples += 1
      this.leftBaseline += (left - this.leftBaseline) / this.calibrationSamples
      this.rightBaseline += (right - this.rightBaseline) / this.calibrationSamples
      return 'calibrating'
    }

    const leftLift = left - this.leftBaseline
    const rightLift = right - this.rightBaseline
    const threshold = this.config.kneeLiftMeters
    switch (this.step) {
      case 'left-up':
        if (leftLift >= threshold && rightLift < threshold * 0.7) { this.leftPeak = leftLift; this.step = 'right-down' }
        break
      case 'right-down':
        if (rightLift < threshold * 0.7) this.step = 'right-up'
        break
      case 'right-up':
        if (rightLift >= threshold && leftLift < threshold * 0.7) { this.rightPeak = rightLift; this.step = 'left-down' }
        break
      case 'left-down':
        if (leftLift < threshold * 0.7 && frame.timestamp - this.previousCycleAt >= this.config.minimumCycleIntervalMs) {
          const event: RunCycleEvent = {
            type: 'run-cycle',
            timestamp: frame.timestamp,
            confidence: Math.max(0, Math.min(1, Math.min(this.leftPeak, this.rightPeak) / (threshold * 1.5))),
          }
          this.dispatchEvent(new CustomEvent<RunCycleEvent>('run-cycle', { detail: event }))
          this.previousCycleAt = frame.timestamp
          this.step = 'left-up'
          this.leftPeak = 0
          this.rightPeak = 0
        }
        break
    }
    return 'waiting'
  }

  resetCalibration(): void {
    this.calibrationStartedAt = null
    this.calibrationSamples = 0
    this.leftPeak = 0
    this.rightPeak = 0
    this.step = 'left-up'
  }
}
