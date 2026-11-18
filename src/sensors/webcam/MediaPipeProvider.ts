import { DrawingUtils, FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision'
import type { SensorFrame } from '../../types/game'

export interface VisionRuntime { stop(): void }

export interface VisionCallbacks {
  onFrame(frame: SensorFrame | null): void
  onHandPresenceChange?(detected: boolean): void
  onRuntimeError?(error: Error): void
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export async function createVisionRuntime(video: HTMLVideoElement, canvas: HTMLCanvasElement, callbacks: VisionCallbacks): Promise<VisionRuntime> {
  let vision
  try {
    vision = await FilesetResolver.forVisionTasks('/mediapipe/wasm')
  } catch (error) {
    throw new Error(`WASM MediaPipe lokal gagal dimuat: ${errorText(error)}`)
  }

  let landmarker: HandLandmarker
  try {
    landmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: '/models/hand_landmarker.task' },
      runningMode: 'VIDEO',
      numHands: 1,
      minHandDetectionConfidence: 0.55,
      minHandPresenceConfidence: 0.55,
      minTrackingConfidence: 0.5,
    })
  } catch (error) {
    throw new Error(`Hand Landmarker gagal dibuat dari /models/hand_landmarker.task: ${errorText(error)}`)
  }

  const context = canvas.getContext('2d')
  if (!context) {
    landmarker.close()
    throw new Error('Canvas landmark tidak dapat diinisialisasi.')
  }
  const drawingUtils = new DrawingUtils(context)
  let animationFrame = 0
  let lastVideoTime = -1
  let lastHandPresence: boolean | null = null
  const detect = () => {
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.currentTime !== lastVideoTime) {
      lastVideoTime = video.currentTime
      try {
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
        }
        context.clearRect(0, 0, canvas.width, canvas.height)
        const result = landmarker.detectForVideo(video, performance.now())
        const landmarks = result.landmarks[0]
        const detected = Boolean(landmarks)
        if (detected && landmarks) {
          drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, { color: '#b6f36a', lineWidth: 4 })
          drawingUtils.drawLandmarks(landmarks, { color: '#f6ffe9', fillColor: '#b6f36a', lineWidth: 2, radius: 4 })
        }
        if (lastHandPresence !== detected) {
          lastHandPresence = detected
          callbacks.onHandPresenceChange?.(detected)
        }
        const point = landmarks?.[0]
        callbacks.onFrame(point ? {
          x: point.x,
          confidence: result.handedness[0]?.[0]?.score ?? 1,
          timestamp: performance.now(),
        } : null)
      } catch (error) {
        context.clearRect(0, 0, canvas.width, canvas.height)
        callbacks.onRuntimeError?.(new Error(`Inferensi hand tracking gagal: ${errorText(error)}`))
        return
      }
    }
    animationFrame = requestAnimationFrame(detect)
  }
  animationFrame = requestAnimationFrame(detect)
  return {
    stop() {
      cancelAnimationFrame(animationFrame)
      context.clearRect(0, 0, canvas.width, canvas.height)
      landmarker.close()
    },
  }
}