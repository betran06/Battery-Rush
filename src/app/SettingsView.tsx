import type { RefObject } from 'react'
import { Camera, CameraOff, Hand, Monitor, ShieldCheck, Smartphone } from 'lucide-react'
import { SkeletonPreview } from './SkeletonPreview'
import type { CameraStatus, KinectSkeletonFrame } from '../types/game'
import type { KinectConnectionState } from '../sensors/kinect/KinectSensor'

export type DisplayOrientation = 'landscape' | 'portrait'

export interface SettingsViewProps {
  // Orientation mode
  orientation: DisplayOrientation
  onSelectOrientation: (orientation: DisplayOrientation) => void

  // Sensor mode
  sensorMode: 'kinect' | 'webcam'
  onSelectSensorMode: (mode: 'kinect' | 'webcam') => void
  isGameActive: boolean

  // Kinect
  kinectStatus: KinectConnectionState
  kinectMessage: string
  calibrationMessage: string
  latestKinectFrame: KinectSkeletonFrame | null
  showKinectPreview: boolean
  isKinectCalibrated: boolean
  onConnectKinect: () => void
  onDisconnectKinect: () => void
  onToggleKinectPreview: () => void

  // Webcam
  cameraStatus: CameraStatus
  cameraMessage: string
  cameraBusy: boolean
  showWebcamPreview: boolean
  handDetected: boolean
  videoRef: RefObject<HTMLVideoElement | null>
  landmarkCanvasRef: RefObject<HTMLCanvasElement | null>
  onStartCamera: () => void
  onStopCamera: () => void
  onToggleWebcamPreview: () => void

  // Sensitivity
  sensitivity: number
  onChangeSensitivity: (val: number) => void
}

export function SettingsView({
  orientation,
  onSelectOrientation,
  sensorMode,
  onSelectSensorMode,
  isGameActive,
  kinectStatus,
  kinectMessage,
  calibrationMessage,
  latestKinectFrame,
  showKinectPreview,
  isKinectCalibrated,
  onConnectKinect,
  onDisconnectKinect,
  onToggleKinectPreview,
  cameraStatus,
  cameraMessage,
  cameraBusy,
  showWebcamPreview,
  handDetected,
  videoRef,
  landmarkCanvasRef,
  onStartCamera,
  onStopCamera,
  onToggleWebcamPreview,
  sensitivity,
  onChangeSensitivity,
}: SettingsViewProps) {
  return (
    <section className="setting-panel">
      <div className="setting-panel-head">
        <span className="panel-label">KIOSK CONFIGURATION</span>
        <div className="setting-controls-top">
          {/* Orientation switch */}
          <span className="orientation-switch">
            <span className="panel-label">ORIENTATION</span>
            <button
              className="camera-toggle"
              onClick={() => onSelectOrientation('landscape')}
              aria-pressed={orientation === 'landscape'}
              type="button"
            >
              <Monitor size={12} /> LANDSCAPE
            </button>
            <button
              className="camera-toggle"
              onClick={() => onSelectOrientation('portrait')}
              aria-pressed={orientation === 'portrait'}
              type="button"
            >
              <Smartphone size={12} /> PORTRAIT
            </button>
          </span>

          {/* Input Mode switch */}
          <span className="sensor-mode-switch">
            <span className="panel-label">INPUT MODE</span>
            <button
              className="camera-toggle"
              onClick={() => onSelectSensorMode('kinect')}
              aria-pressed={sensorMode === 'kinect'}
              disabled={isGameActive}
              type="button"
            >
              KINECT RUN
            </button>
            <button
              className="camera-toggle"
              onClick={() => onSelectSensorMode('webcam')}
              aria-pressed={sensorMode === 'webcam'}
              disabled={isGameActive}
              type="button"
            >
              WEBCAM WAVE
            </button>
          </span>
        </div>
      </div>

      <div className="setting-grid">
        {/* Kinect Card */}
        <div className="camera-card kinect-card">
          <div className="camera-header">
            <div className="camera-heading">
              <span className={`camera-indicator ${kinectStatus === 'connected' ? 'active' : kinectStatus}`} />
              <div>
                <strong>KINECT V1 LINK</strong>
                <small>{kinectMessage}</small>
              </div>
            </div>
            <button
              className="camera-toggle"
              onClick={kinectStatus === 'connected' ? onDisconnectKinect : onConnectKinect}
              type="button"
            >
              <Camera size={15} /> {kinectStatus === 'connected' ? 'DISCONNECT' : 'CONNECT'}
            </button>
          </div>
          <div className={`skeleton-preview ${showKinectPreview ? 'visible' : ''}`}>
            <SkeletonPreview
              frame={latestKinectFrame}
              isConnected={kinectStatus === 'connected'}
              isCalibrated={isKinectCalibrated}
              calibrationMessage={calibrationMessage}
              kneeLiftThresholdMeters={0.1}
            />
          </div>
          <div className="camera-foot">
            <span><ShieldCheck size={13} /> {calibrationMessage}</span>
            <button onClick={onToggleKinectPreview} type="button">
              {showKinectPreview ? 'HIDE PREVIEW' : 'SHOW PREVIEW'}
            </button>
          </div>
        </div>

        {/* Webcam Card */}
        <div className="camera-card">
          <div className="camera-header">
            <div className="camera-heading">
              <span className={`camera-indicator ${cameraStatus}`} />
              <div><strong>CAMERA LINK</strong><small>{cameraMessage}</small></div>
            </div>
            <button
              className="camera-toggle"
              onClick={cameraStatus === 'active' ? onStopCamera : onStartCamera}
              disabled={cameraBusy}
              type="button"
            >
              {cameraStatus === 'active' ? <><CameraOff size={15} /> DISCONNECT</> : <><Camera size={15} /> {cameraBusy ? 'CONNECTING...' : 'CONNECT'}</>}
            </button>
          </div>
          <div className={`camera-preview ${cameraStatus === 'active' && showWebcamPreview ? 'visible' : ''}`}>
            <video ref={videoRef} autoPlay muted playsInline aria-label="Camera preview" />
            <canvas ref={landmarkCanvasRef} className="landmark-overlay" aria-hidden="true" />
            {cameraStatus !== 'active' && <div className="preview-placeholder"><Camera size={18} /><span>CAMERA PREVIEW</span></div>}
            {cameraStatus === 'active' && <span className="preview-live"><i /> LIVE</span>}
          </div>
          <div className="camera-foot">
            <span><ShieldCheck size={13} /> VIDEO STAYS ON DEVICE <b>{handDetected ? ' · HAND DETECTED' : ''}</b></span>
            <button onClick={onToggleWebcamPreview} type="button">{showWebcamPreview ? 'HIDE PREVIEW' : 'SHOW PREVIEW'}</button>
          </div>
        </div>

        {/* HOW TO PLAY */}
        <div className="instructions-card">
          <div className="instructions-top"><span className="panel-label">HOW TO PLAY</span><span className="step-count">01 <i>/</i> 03</span></div>
          <div className="instruction-main">
            <div className="instruction-icon"><Hand size={27} /></div>
            <div>
              <h2>Run it.<br /><em>Charge it.</em></h2>
              <p>Stand where Kinect can see your full body, calibrate, then alternate knee lifts. Each valid run cycle adds 4%.</p>
            </div>
          </div>
          <div className="instructions-bottom">
            <label htmlFor="sensitivity">SENSITIVITY <span>{Math.round(sensitivity * 100)}%</span></label>
            <input
              id="sensitivity"
              type="range"
              min="6"
              max="24"
              value={Math.round(sensitivity * 100)}
              onChange={(event) => onChangeSensitivity(Number(event.target.value) / 100)}
            />
            <span className="sensor-label">SENSOR <b>KINECT V1 / SKELETON TRACKING</b></span>
          </div>
        </div>
      </div>
    </section>
  )
}