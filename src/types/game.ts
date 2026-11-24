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

export type JointTrackingState = 'tracked' | 'inferred' | 'nottracked'

export interface KinectJoint {
  x: number
  y: number
  z: number
  state: JointTrackingState
}

export interface KinectSkeletonFrame {
  type: 'skeleton-frame'
  tracking: boolean
  frame: number
  timestamp: number
  joints?: {
    hipCenter: KinectJoint
    kneeLeft: KinectJoint
    kneeRight: KinectJoint
    ankleLeft: KinectJoint
    ankleRight: KinectJoint
    head?: KinectJoint
    shoulderCenter?: KinectJoint
    shoulderLeft?: KinectJoint
    shoulderRight?: KinectJoint
    spine?: KinectJoint
    footLeft?: KinectJoint
    footRight?: KinectJoint
  }
}

export interface RunCycleEvent {
  type: 'run-cycle'
  timestamp: number
  confidence: number
}