export type GamePhase = 'welcome' | 'countdown' | 'playing' | 'won' | 'lost'
export type CameraStatus = 'idle' | 'requesting' | 'active' | 'error'

export interface SensorFrame {
  x: number
  confidence: number
  timestamp: number
}

export interface SensorSource {
  readonly kind: 'webcam' | 'kinect'
  start(): Promise<void>
  stop(): void
}
