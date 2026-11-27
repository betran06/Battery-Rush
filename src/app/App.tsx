import { useCallback, useEffect, useRef, useState } from 'react'
import { BatteryCharging, ChevronLeft, ChevronRight, Expand, Hand, RotateCcw, Settings, ShieldCheck, Sparkles, Timer } from 'lucide-react'
import Phaser from 'phaser'
import { createVisionRuntime, type VisionRuntime } from '../sensors/webcam/MediaPipeProvider'
import { CameraManager } from '../sensors/webcam/CameraManager'
import { HandWaveDetector } from '../sensors/detection/HandWaveDetector'
import { RunningDetector } from '../sensors/detection/RunningDetector'
import { KinectSensor, type KinectConnectionState } from '../sensors/kinect/KinectSensor'
import { SettingsView, type DisplayOrientation } from './SettingsView'
import type { CameraStatus, GamePhase, KinectSkeletonFrame } from '../types/game'

const CHARGE_PER_WAVE = 10
const CHARGE_PER_RUN_CYCLE = 4
const SCORE_CURVE = [
  [0, 100], [7, 100], [8, 98], [9, 97], [10, 96], [12, 94], [15, 90],
  [20, 84], [30, 72], [45, 54], [60, 36], [90, 15], [120, 5], [180, 1],
] as const

function scoreForElapsedSeconds(elapsedSeconds: number): number {
  for (let index = 1; index < SCORE_CURVE.length; index += 1) {
    const [endTime, endScore] = SCORE_CURVE[index]
    if (elapsedSeconds <= endTime) {
      const [startTime, startScore] = SCORE_CURVE[index - 1]
      const progress = (elapsedSeconds - startTime) / (endTime - startTime)
      return Math.max(1, Math.min(100, Math.round(startScore + (endScore - startScore) * progress)))
    }
  }
  return 1
}

class BatteryScene extends Phaser.Scene {
  private fill?: Phaser.GameObjects.Rectangle
  private label?: Phaser.GameObjects.Text
  private charge = 0

  constructor() { super('battery') }

  create() {
    const { width, height } = this.scale
    this.add.rectangle(width / 2, height / 2, 210, 350, 0x202a24, 1).setStrokeStyle(2, 0x506354)
    this.add.rectangle(width / 2, 30, 72, 16, 0x506354)
    this.fill = this.add.rectangle(width / 2, height - 28, 176, 0xafff64).setOrigin(0.5, 1)
    this.label = this.add.text(width / 2, height / 2, '0%', { fontFamily: 'monospace', fontSize: '44px', color: '#efffe5', fontStyle: 'bold' }).setOrigin(0.5)
    this.renderCharge()
  }

  setCharge(value: number) { this.charge = Math.min(100, value); this.renderCharge() }

  private renderCharge() {
    if (!this.fill || !this.label) return
    const amount = this.charge / 100 * 294
    this.fill.setSize(176, amount)
    this.fill.setFillStyle(this.charge >= 100 ? 0xd4ff58 : 0xafff64)
    this.label.setText(`${this.charge}%`)
  }
}

export default function App() {
  const [view, setView] = useState<'game' | 'setting'>('game')
  const [orientation, setOrientation] = useState<DisplayOrientation>(() => {
    try {
      const saved = localStorage.getItem('kiosk_orientation')
      return (saved === 'portrait' || saved === 'landscape') ? saved : 'landscape'
    } catch {
      return 'landscape'
    }
  })

  const handleSelectOrientation = (mode: DisplayOrientation) => {
    setOrientation(mode)
    try {
      localStorage.setItem('kiosk_orientation', mode)
    } catch {
      // ignore
    }
  }
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('idle')
  const [sensorMode, setSensorMode] = useState<'kinect' | 'webcam'>('kinect')
  const [kinectStatus, setKinectStatus] = useState<KinectConnectionState>('disconnected')
  const [kinectMessage, setKinectMessage] = useState('Bridge belum tersambung')
  const [calibrationMessage, setCalibrationMessage] = useState('Sambungkan Kinect untuk kalibrasi')
  const [latestKinectFrame, setLatestKinectFrame] = useState<KinectSkeletonFrame | null>(null)
  const [showKinectPreview, setShowKinectPreview] = useState(true)
  const [isKinectCalibrated, setIsKinectCalibrated] = useState(false)
  const [runCycles, setRunCycles] = useState(0)
  const [cameraMessage, setCameraMessage] = useState('Kamera belum dinyalakan')
  const [phase, setPhase] = useState<GamePhase>('welcome')
  const [charge, setCharge] = useState(0)
  const [waves, setWaves] = useState(0)
  const [finalScore, setFinalScore] = useState(0)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [countdown, setCountdown] = useState(3)
  const [showPreview, setShowPreview] = useState(true)
  const [cameraBusy, setCameraBusy] = useState(false)
  const [handDetected, setHandDetected] = useState(false)
  const [sensitivity, setSensitivity] = useState(0.12)
  const videoRef = useRef<HTMLVideoElement>(null)
  const landmarkCanvasRef = useRef<HTMLCanvasElement>(null)
  const cameraRef = useRef<CameraManager | null>(null)
  const visionRef = useRef<VisionRuntime | null>(null)
  const detectorRef = useRef(new HandWaveDetector())
  const runningDetectorRef = useRef(new RunningDetector())
  const kinectRef = useRef<KinectSensor | null>(null)

  const isGameActive = phase === 'playing' || phase === 'countdown'

  const toggleView = () => {
    if (isGameActive) return
    setView((v) => v === 'game' ? 'setting' : 'game')
  }

  const connectKinect = () => {
    const sensor = new KinectSensor((frame) => {
      setLatestKinectFrame(frame)
      const result = runningDetectorRef.current.update(frame)
      if (result === 'tracking-lost') {
        setIsKinectCalibrated(false)
        setCalibrationMessage('Skeleton tidak terlacak; berdiri penuh di depan sensor.')
      } else if (result === 'calibrating') {
        setIsKinectCalibrated(false)
        setCalibrationMessage('Kalibrasi postur... berdiri tegak selama 2 detik.')
      } else if (result === 'calibrated') {
        setIsKinectCalibrated(true)
        setCalibrationMessage('Kalibrasi siap; mulai berlari di tempat.')
      }
    }, (state, message) => {
      setKinectStatus(state)
      setKinectMessage(message)
      if (state !== 'connected') {
        setLatestKinectFrame(null)
        setIsKinectCalibrated(false)
      }
    })
    kinectRef.current?.stop()
    kinectRef.current = sensor
    void sensor.start().catch((error: unknown) => setKinectMessage(error instanceof Error ? error.message : 'Koneksi gagal.'))
  }

  const disconnectKinect = () => {
    kinectRef.current?.stop()
    kinectRef.current = null
    runningDetectorRef.current.resetCalibration()
    setKinectStatus('disconnected')
    setKinectMessage('Bridge diputuskan')
    setLatestKinectFrame(null)
    setIsKinectCalibrated(false)
  }

  const gameHostRef = useRef<HTMLDivElement>(null)
  const phaserRef = useRef<Phaser.Game | null>(null)
  const cameraRequestRef = useRef(0)
  const sensitivityRef = useRef(sensitivity)
  const phaseRef = useRef(phase)
  const sensorModeRef = useRef(sensorMode)

  sensitivityRef.current = sensitivity
  phaseRef.current = phase
  sensorModeRef.current = sensorMode

  useEffect(() => { phaserRef.current?.events.emit('charge', charge) }, [charge])

  useEffect(() => {
    if (!gameHostRef.current) return
    const game = new Phaser.Game({
      type: Phaser.CANVAS,
      parent: gameHostRef.current,
      width: 240,
      height: 390,
      transparent: true,
      scene: [BatteryScene],
      render: { antialias: true, pixelArt: false },
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    })
    game.events.on('charge', (value: number) => (game.scene.getScene('battery') as BatteryScene).setCharge(value))
    phaserRef.current = game
    return () => { game.destroy(true); phaserRef.current = null }
  }, [])

  const stopCamera = useCallback(() => {
    cameraRequestRef.current += 1
    setCameraBusy(false)
    visionRef.current?.stop()
    visionRef.current = null
    cameraRef.current?.stop()
    cameraRef.current = null
    detectorRef.current.reset()
    setHandDetected(false)
    setCameraStatus('idle')
    setCameraMessage('Kamera belum dinyalakan')
  }, [])

  const startCamera = useCallback(async () => {
    if (!videoRef.current || !landmarkCanvasRef.current || cameraBusy) return
    setCameraBusy(true)
    const requestId = ++cameraRequestRef.current
    setCameraStatus('requesting')
    setCameraMessage('Meminta izin kamera...')
    try {
      const camera = new CameraManager()
      await camera.start(videoRef.current)
      if (requestId !== cameraRequestRef.current) { camera.stop(); return }
      cameraRef.current = camera
      setCameraStatus('active')
      setHandDetected(false)
      setCameraMessage('Kamera aktif — menyiapkan hand tracking...')
      try {
        const runtime = await createVisionRuntime(videoRef.current, landmarkCanvasRef.current, {
          onFrame: (frame) => detectorRef.current.update(frame, sensitivityRef.current),
          onHandPresenceChange: (detected) => {
            setHandDetected(detected)
            setCameraMessage(detected ? 'Tangan terdeteksi; lambaikan kiri-kanan.' : 'Tracking aktif; arahkan tangan ke kamera.')
          },
          onRuntimeError: (error) => setCameraMessage(error.message),
        })
        if (requestId !== cameraRequestRef.current) { runtime.stop(); return }
        visionRef.current = runtime
        setCameraMessage('Tracking aktif; arahkan tangan ke kamera.')
      } catch (error) {
        if (requestId !== cameraRequestRef.current) return
        setCameraMessage(error instanceof Error ? `Kamera aktif, tracking belum siap: ${error.message}` : 'Kamera aktif, tetapi tracking gagal disiapkan.')
      }
    } catch (error) {
      if (requestId !== cameraRequestRef.current) return
      stopCamera()
      const message = error instanceof Error ? error.message : 'Kamera gagal diakses.'
      setCameraStatus('error')
      setCameraMessage(message)
    } finally { if (requestId === cameraRequestRef.current) setCameraBusy(false) }
  }, [cameraBusy, stopCamera])

  useEffect(() => {
    const detector = runningDetectorRef.current
    const onCycle = (event: Event) => {
      const confidence = (event as CustomEvent<{ confidence: number }>).detail.confidence
      if (phaseRef.current !== 'playing' || sensorModeRef.current !== 'kinect' || confidence <= 0) return
      setRunCycles((value) => value + 1)
      setCharge((value) => Math.min(100, value + CHARGE_PER_RUN_CYCLE))
    }
    detector.addEventListener('run-cycle', onCycle)
    return () => detector.removeEventListener('run-cycle', onCycle)
  }, [])

  useEffect(() => () => kinectRef.current?.stop(), [])

  useEffect(() => {
    const detector = detectorRef.current
    const onWave = () => {
      if (phaseRef.current !== 'playing' || sensorModeRef.current !== 'webcam') return
      setWaves((value) => value + 1)
      setCharge((value) => Math.min(100, value + CHARGE_PER_WAVE))
    }
    detector.addEventListener('wave', onWave)
    return () => detector.removeEventListener('wave', onWave)
  }, [])

  useEffect(() => () => stopCamera(), [stopCamera])

  useEffect(() => {
    if (phase !== 'countdown') return
    if (countdown <= 0) { setPhase('playing'); return }
    const timer = window.setTimeout(() => setCountdown((value) => value - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [phase, countdown])

  useEffect(() => {
    if (phase !== 'playing') return
    const timer = window.setInterval(() => setElapsedSeconds((value) => value + 1), 1000)
    return () => window.clearInterval(timer)
  }, [phase])

  useEffect(() => {
    if (phase === 'playing' && charge >= 100) {
      setFinalScore(scoreForElapsedSeconds(elapsedSeconds))
      setPhase('won')
    }
  }, [charge, elapsedSeconds, phase])

  const beginGame = () => {
    if (sensorMode === 'kinect' && (kinectStatus !== 'connected' || !runningDetectorRef.current.isCalibrated)) {
      setCalibrationMessage(kinectStatus !== 'connected' ? 'Hubungkan Kinect Bridge terlebih dahulu.' : 'Tunggu kalibrasi postur 2 detik sebelum memulai.')
      return
    }
    if (sensorMode === 'webcam' && cameraStatus !== 'active') { setCameraMessage('Hubungkan webcam sebelum memulai mode ini.'); return }
    setCharge(0); setWaves(0); setRunCycles(0); setFinalScore(0); setElapsedSeconds(0); setCountdown(3); detectorRef.current.reset(); setPhase('countdown')
  }

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen()
    else await document.exitFullscreen()
  }

  const minute = String(Math.floor(elapsedSeconds / 60)).padStart(2, '0')
  const second = String(elapsedSeconds % 60).padStart(2, '0')

  return <main className={`app-shell mode-${orientation}`}><div className="orientation-indicator" aria-hidden="true" />
    <div className="grain" aria-hidden="true" />

    {/* ── TOPBAR ── */}
    <header className="topbar">
      <a className="brand" href="#home" onClick={(event) => { event.preventDefault(); setPhase('welcome') }}>
        <span className="brand-mark"><BatteryCharging size={19} /></span> VOLT / PLAY
      </a>
      <div className="topbar-right">
        <span className="edition"><span className="live-dot" /> MOTION ARCADE <i>·</i> 001</span>
        <button
          className={`setting-toggle${isGameActive ? ' disabled' : ''}${view === 'setting' ? ' active' : ''}`}
          onClick={toggleView}
          disabled={isGameActive}
          aria-label={view === 'setting' ? 'Kembali ke game' : 'Buka setting'}
        >
          {view === 'setting' ? (
            <><Settings size={14} /> SETTING <ChevronRight size={13} /></>
          ) : (
            <><ChevronLeft size={13} /> SETTING</>
          )}
        </button>
        <button className="icon-button fullscreen" onClick={toggleFullscreen} aria-label="Toggle fullscreen">
          <Expand size={17} />
        </button>
      </div>
    </header>

    {/* ── VIEW: GAME (DOM tetap ada di memori agar Phaser baterai tidak di-destroy) ── */}
    <div className="game-view-container" style={{ display: view === 'game' ? 'contents' : 'none' }}>
      <section className="stage">
        <div className="game-panel">
          <div className="panel-head">
            <div><span className="panel-label">LIVE CHALLENGE</span><span className="panel-title">Charge sequence</span></div>
            <span className="session-code">BR—001</span>
          </div>
          <div className="game-display">
            <div className="display-orbit orbit-one" /><div className="display-orbit orbit-two" />
            <div className="battery-wrap"><div className="phaser-holder" ref={gameHostRef} /><div className="battery-cap" /></div>
            <div className="charge-readout"><span className="charge-number">{String(charge).padStart(2, '0')}</span><span className="charge-unit">%</span></div>
            <div className="display-bottom"><span>ENERGY LEVEL</span><span>{charge < 30 ? 'LOW' : charge < 70 ? 'BUILDING' : 'ALMOST THERE'}</span></div>
            {phase === 'countdown' && <div className="countdown-overlay"><span>GET READY</span><strong>{countdown || 'GO!'}</strong></div>}
            {phase === 'won' && <div className="result-overlay"><Sparkles size={22} /><span>FULLY CHARGED</span><strong>{finalScore} PTS</strong><small>COMPLETED IN {minute}:{second}</small></div>}
          </div>
          <div className="game-stats">
            <div className="stat"><span className="stat-icon"><Timer size={16} /></span><div><small>TIME ELAPSED</small><strong>{minute}:{second}</strong></div></div>
            <div className="stat-divider" />
            <div className="stat"><span className="stat-icon wave-icon"><Hand size={16} /></span><div><small>{sensorMode === 'kinect' ? 'RUN CYCLES' : 'WAVES'}</small><strong>{String(sensorMode === 'kinect' ? runCycles : waves).padStart(2, '0')} <small className="goal">RUNS</small></strong></div></div>
            <button className="reset-button" onClick={beginGame} aria-label="Reset game"><RotateCcw size={16} /></button>
          </div>
        </div>

        <aside className="side-rail"><span>MOVE TO CHARGE</span><div className="rail-mark"><span>01</span><i /></div><span>UNTIL FULL</span></aside>
      </section>

      <div className="launch-row">
        <div className="launch-card">
          <div className="launch-orb"><span /></div>
          <span className="launch-kicker">READY WHEN YOU ARE</span>
          <button className="start-button" onClick={beginGame} disabled={phase === 'countdown' || phase === 'playing'}>
            <span>{phase === 'won' || phase === 'lost' ? 'PLAY AGAIN' : 'START GAME'}</span>
            <ChevronRight size={19} />
          </button>
          <p>
            <ShieldCheck size={12} />
            {sensorMode === 'kinect'
              ? (kinectStatus === 'connected' ? calibrationMessage : 'Connect Kinect and complete calibration')
              : (cameraStatus === 'active' ? 'WEBCAM TRACKING READY' : 'Connect webcam for webcam mode')}
          </p>
        </div>
      </div>
    </div>

    {/* ── VIEW: SETTING (DOM tetap ada di memori agar video/webcam hand tracking tidak terputus) ── */}
    <div className="setting-view-container" style={{ display: view === 'setting' ? 'block' : 'none' }}>
      <SettingsView
        orientation={orientation}
        onSelectOrientation={handleSelectOrientation}
        sensorMode={sensorMode}
        onSelectSensorMode={setSensorMode}
        isGameActive={isGameActive}
        kinectStatus={kinectStatus}
        kinectMessage={kinectMessage}
        calibrationMessage={calibrationMessage}
        latestKinectFrame={latestKinectFrame}
        showKinectPreview={showKinectPreview}
        isKinectCalibrated={isKinectCalibrated}
        onConnectKinect={connectKinect}
        onDisconnectKinect={disconnectKinect}
        onToggleKinectPreview={() => setShowKinectPreview((v) => !v)}
        cameraStatus={cameraStatus}
        cameraMessage={cameraMessage}
        cameraBusy={cameraBusy}
        showWebcamPreview={showPreview}
        handDetected={handDetected}
        videoRef={videoRef}
        landmarkCanvasRef={landmarkCanvasRef}
        onStartCamera={startCamera}
        onStopCamera={stopCamera}
        onToggleWebcamPreview={() => setShowPreview((v) => !v)}
        sensitivity={sensitivity}
        onChangeSensitivity={setSensitivity}
      />
    </div>

    <footer className="footer">
      <span>BATTERY RUSH <i>©</i> 2026</span>
      <span>NO DATA STORED <b>·</b> ALL PLAY, NO PLUG</span>
      <a href="#about" onClick={(event) => event.preventDefault()}>BUILT FOR MOVEMENT <ChevronRight size={12} /></a>
    </footer>
  </main>
}