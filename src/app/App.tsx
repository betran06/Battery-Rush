import { useCallback, useEffect, useRef, useState } from 'react'
import { BatteryCharging, Camera, CameraOff, ChevronRight, Expand, Hand, RotateCcw, ShieldCheck, Sparkles, Timer } from 'lucide-react'
import Phaser from 'phaser'
import { createVisionRuntime, type VisionRuntime } from '../sensors/webcam/MediaPipeProvider'
import { CameraManager } from '../sensors/webcam/CameraManager'
import { HandWaveDetector } from '../sensors/detection/HandWaveDetector'
import type { CameraStatus, GamePhase } from '../types/game'

const CHARGE_PER_WAVE = 10
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
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('idle')
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
  const gameHostRef = useRef<HTMLDivElement>(null)
  const phaserRef = useRef<Phaser.Game | null>(null)
  const cameraRequestRef = useRef(0)
  const sensitivityRef = useRef(sensitivity)
  const phaseRef = useRef(phase)

  sensitivityRef.current = sensitivity
  phaseRef.current = phase
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
    const detector = detectorRef.current
    const onWave = () => {
      if (phaseRef.current !== 'playing') return
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
    setCharge(0); setWaves(0); setFinalScore(0); setElapsedSeconds(0); setCountdown(3); detectorRef.current.reset(); setPhase('countdown')
  }

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen()
    else await document.exitFullscreen()
  }

  const minute = String(Math.floor(elapsedSeconds / 60)).padStart(2, '0')
  const second = String(elapsedSeconds % 60).padStart(2, '0')

  return <main className="app-shell">
    <div className="grain" aria-hidden="true" />
    <header className="topbar">
      <a className="brand" href="#home" onClick={(event) => { event.preventDefault(); setPhase('welcome') }}><span className="brand-mark"><BatteryCharging size={19} /></span> VOLT / PLAY</a>
      <div className="topbar-right"><span className="edition"><span className="live-dot" /> MOTION ARCADE <i>·</i> 001</span><button className="icon-button fullscreen" onClick={toggleFullscreen} aria-label="Toggle fullscreen"><Expand size={17} /></button></div>
    </header>

    <section className="stage">
      <div className="stage-copy">
        <div className="eyebrow"><span className="eyebrow-line" /> THE ENERGY IS YOURS</div>
        
        <p className="lede">A little movement.<br />A lot of power.</p>
        <div className="challenge-tag"><Hand size={15} /><span>CHALLENGE 01</span><b>HAND WAVE</b></div>
      </div>

      <div className="game-panel">
        <div className="panel-head"><div><span className="panel-label">LIVE CHALLENGE</span><span className="panel-title">Charge sequence</span></div><span className="session-code">BR—001</span></div>
        <div className="game-display">
          <div className="display-orbit orbit-one" /><div className="display-orbit orbit-two" />
          <div className="battery-wrap"><div className="phaser-holder" ref={gameHostRef} /><div className="battery-cap" /></div>
          <div className="charge-readout"><span className="charge-number">{String(charge).padStart(2, '0')}</span><span className="charge-unit">%</span></div>
          <div className="display-bottom"><span>ENERGY LEVEL</span><span>{charge < 30 ? 'LOW' : charge < 70 ? 'BUILDING' : 'ALMOST THERE'}</span></div>
          {phase === 'countdown' && <div className="countdown-overlay"><span>GET READY</span><strong>{countdown || 'GO!'}</strong></div>}
          {phase === 'won' && <div className="result-overlay"><Sparkles size={22} /><span>FULLY CHARGED</span><strong>{finalScore} PTS</strong><small>COMPLETED IN {minute}:{second}</small></div>}
        </div>
        <div className="game-stats"><div className="stat"><span className="stat-icon"><Timer size={16} /></span><div><small>TIME ELAPSED</small><strong>{minute}:{second}</strong></div></div><div className="stat-divider" /><div className="stat"><span className="stat-icon wave-icon"><Hand size={16} /></span><div><small>WAVES</small><strong>{String(waves).padStart(2, '0')} <small className="goal">/ 10</small></strong></div></div><button className="reset-button" onClick={beginGame} aria-label="Reset game"><RotateCcw size={16} /></button></div>
      </div>

      <aside className="side-rail"><span>MOVE TO CHARGE</span><div className="rail-mark"><span>01</span><i /></div><span>UNTIL FULL</span></aside>
    </section>

    <section className="control-deck">
      <div className="camera-card">
        <div className="camera-header"><div className="camera-heading"><span className={`camera-indicator ${cameraStatus}`} /><div><strong>CAMERA LINK</strong><small>{cameraMessage}</small></div></div><button className="camera-toggle" onClick={cameraStatus === 'active' ? stopCamera : startCamera} disabled={cameraBusy}>{cameraStatus === 'active' ? <><CameraOff size={15} /> DISCONNECT</> : <><Camera size={15} /> {cameraBusy ? 'CONNECTING...' : 'CONNECT'}</>}</button></div>
        <div className={`camera-preview ${cameraStatus === 'active' && showPreview ? 'visible' : ''}`}>
          <video ref={videoRef} autoPlay muted playsInline aria-label="Camera preview" />
          <canvas ref={landmarkCanvasRef} className="landmark-overlay" aria-hidden="true" />
          {cameraStatus !== 'active' && <div className="preview-placeholder"><Camera size={18} /><span>CAMERA PREVIEW</span></div>}
          {cameraStatus === 'active' && <span className="preview-live"><i /> LIVE</span>}
        </div>
        <div className="camera-foot"><span><ShieldCheck size={13} /> VIDEO STAYS ON DEVICE <b>{handDetected ? ' · HAND DETECTED' : ''}</b></span><button onClick={() => setShowPreview((value) => !value)}>{showPreview ? 'HIDE PREVIEW' : 'SHOW PREVIEW'}</button></div>
      </div>
      <div className="instructions-card"><div className="instructions-top"><span className="panel-label">HOW TO PLAY</span><span className="step-count">01 <i>/</i> 03</span></div><div className="instruction-main"><div className="instruction-icon"><Hand size={27} /></div><div><h2>Wave it.<br /><em>Charge it.</em></h2><p>Stand in frame and sweep one hand from side to side. Every full wave adds 10%.</p></div></div><div className="instructions-bottom"><label htmlFor="sensitivity">SENSITIVITY <span>{Math.round(sensitivity * 100)}%</span></label><input id="sensitivity" type="range" min="6" max="24" value={Math.round(sensitivity * 100)} onChange={(event) => setSensitivity(Number(event.target.value) / 100)} /><span className="sensor-label">SENSOR <b>WEBCAM / HAND TRACKING</b></span></div></div>
      <div className="launch-card"><div className="launch-orb"><span /></div><span className="launch-kicker">READY WHEN YOU ARE</span><button className="start-button" onClick={beginGame} disabled={phase === 'countdown' || phase === 'playing'}><span>{phase === 'won' || phase === 'lost' ? 'PLAY AGAIN' : 'START GAME'}</span><ChevronRight size={19} /></button><p><ShieldCheck size={12} /> {cameraStatus === 'active' ? 'TRACKING READY' : 'You can start before connecting camera'}</p></div>
    </section>
    <footer className="footer"><span>BATTERY RUSH <i>©</i> 2026</span><span>NO DATA STORED <b>·</b> ALL PLAY, NO PLUG</span><a href="#about" onClick={(event) => event.preventDefault()}>BUILT FOR MOVEMENT <ChevronRight size={12} /></a></footer>
  </main>
}
