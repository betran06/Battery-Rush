import { useEffect, useRef } from 'react'
import type { KinectSkeletonFrame, KinectJoint } from '../types/game'

interface SkeletonPreviewProps {
  frame: KinectSkeletonFrame | null
  isConnected: boolean
  isCalibrated: boolean
  calibrationMessage: string
  kneeLiftThresholdMeters?: number
}

type JointKey = keyof NonNullable<KinectSkeletonFrame['joints']>

const BONE_CONNECTIONS: [JointKey, JointKey][] = [
  ['head', 'shoulderCenter'],
  ['shoulderCenter', 'spine'],
  ['spine', 'hipCenter'],
  ['shoulderCenter', 'shoulderLeft'],
  ['shoulderCenter', 'shoulderRight'],
  ['hipCenter', 'kneeLeft'],
  ['kneeLeft', 'ankleLeft'],
  ['ankleLeft', 'footLeft'],
  ['hipCenter', 'kneeRight'],
  ['kneeRight', 'ankleRight'],
  ['ankleRight', 'footRight'],
]

export function SkeletonPreview({
  frame,
  isConnected,
  isCalibrated,
  calibrationMessage,
  kneeLiftThresholdMeters = 0.1,
}: SkeletonPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const baselineLeftRef = useRef<number | null>(null)
  const baselineRightRef = useRef<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height

    // Clear background
    ctx.save()
    ctx.fillStyle = '#0e1411'
    ctx.fillRect(0, 0, width, height)

    // Draw subtle grid
    ctx.strokeStyle = 'rgba(182, 243, 106, 0.05)'
    ctx.lineWidth = 1
    const gridSize = 30
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }

    if (!isConnected) {
      ctx.fillStyle = '#7a8779'
      ctx.font = '600 13px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('KINECT BRIDGE DISCONNECTED', width / 2, height / 2 - 10)
      ctx.fillStyle = '#4c574c'
      ctx.font = '11px monospace'
      ctx.fillText('Klik CONNECT dan jalankan KinectBridge.exe', width / 2, height / 2 + 14)
      ctx.restore()
      return
    }

    if (!frame || !frame.tracking || !frame.joints) {
      baselineLeftRef.current = null
      baselineRightRef.current = null

      // Draw faint silhouette guide
      ctx.strokeStyle = 'rgba(182, 243, 106, 0.15)'
      ctx.lineWidth = 2
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.arc(width / 2, height * 0.25, 20, 0, Math.PI * 2)
      ctx.moveTo(width / 2, height * 0.3)
      ctx.lineTo(width / 2, height * 0.6)
      ctx.moveTo(width / 2 - 40, height * 0.38)
      ctx.lineTo(width / 2 + 40, height * 0.38)
      ctx.moveTo(width / 2, height * 0.6)
      ctx.lineTo(width / 2 - 30, height * 0.9)
      ctx.moveTo(width / 2, height * 0.6)
      ctx.lineTo(width / 2 + 30, height * 0.9)
      ctx.stroke()
      ctx.setLineDash([])

      ctx.fillStyle = '#afff64'
      ctx.font = '600 13px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('MENCARI BADAN PEMAIN...', width / 2, height / 2 - 10)
      ctx.fillStyle = '#8f9d8e'
      ctx.font = '11px monospace'
      ctx.fillText('Berdiri 1.8m - 2.8m di depan sensor Kinect', width / 2, height / 2 + 14)
      ctx.fillText('Pastikan seluruh tubuh terlihat', width / 2, height / 2 + 32)
      ctx.restore()
      return
    }

    const joints = frame.joints
    const hip = joints.hipCenter

    // Calculate baseline
    const currentLeftDist = joints.kneeLeft.y - hip.y
    const currentRightDist = joints.kneeRight.y - hip.y
    if (baselineLeftRef.current === null || !isCalibrated) {
      baselineLeftRef.current = currentLeftDist
      baselineRightRef.current = currentRightDist
    }

    const leftLiftMeters = currentLeftDist - (baselineLeftRef.current ?? currentLeftDist)
    const rightLiftMeters = currentRightDist - (baselineRightRef.current ?? currentRightDist)
    const leftLiftCm = Math.round(leftLiftMeters * 100)
    const rightLiftCm = Math.round(rightLiftMeters * 100)
    const thresholdCm = Math.round(kneeLiftThresholdMeters * 100)

    // Center and scale
    const cx = width / 2
    const cy = height * 0.52
    const scale = height * 0.44

    const toCanvas = (j?: KinectJoint) => {
      if (!j) return null
      return {
        x: cx - (j.x - hip.x) * scale,
        y: cy - (j.y - hip.y) * scale,
        z: j.z,
        state: j.state,
      }
    }

    // Draw bones
    ctx.lineWidth = 4
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    for (const [keyA, keyB] of BONE_CONNECTIONS) {
      const pA = toCanvas(joints[keyA])
      const pB = toCanvas(joints[keyB])
      if (!pA || !pB) continue

      const isLegLeft = keyA.includes('Left') && keyB.includes('Left')
      const isLegRight = keyA.includes('Right') && keyB.includes('Right')

      let strokeColor = '#3f5641'
      if (isLegLeft && leftLiftCm >= thresholdCm) {
        strokeColor = '#b6f36a'
      } else if (isLegRight && rightLiftCm >= thresholdCm) {
        strokeColor = '#b6f36a'
      } else if (pA.state === 'tracked' && pB.state === 'tracked') {
        strokeColor = '#607d64'
      }

      ctx.strokeStyle = strokeColor
      ctx.beginPath()
      ctx.moveTo(pA.x, pA.y)
      ctx.lineTo(pB.x, pB.y)
      ctx.stroke()
    }

    // Fallback leg lines if only hipCenter, knee, ankle are connected
    const pLeftKnee = toCanvas(joints.kneeLeft)
    const pRightKnee = toCanvas(joints.kneeRight)
    const pLeftAnkle = toCanvas(joints.ankleLeft)
    const pRightAnkle = toCanvas(joints.ankleRight)
    const pHip = toCanvas(hip)

    if (pHip && pLeftKnee && pRightKnee) {
      // Draw Hip to Knees if spine not present
      if (!joints.spine) {
        ctx.strokeStyle = leftLiftCm >= thresholdCm ? '#b6f36a' : '#607d64'
        ctx.beginPath()
        ctx.moveTo(pHip.x, pHip.y)
        ctx.lineTo(pLeftKnee.x, pLeftKnee.y)
        ctx.stroke()

        ctx.strokeStyle = rightLiftCm >= thresholdCm ? '#b6f36a' : '#607d64'
        ctx.beginPath()
        ctx.moveTo(pHip.x, pHip.y)
        ctx.lineTo(pRightKnee.x, pRightKnee.y)
        ctx.stroke()
      }
      if (pLeftAnkle && !joints.footLeft) {
        ctx.strokeStyle = leftLiftCm >= thresholdCm ? '#b6f36a' : '#607d64'
        ctx.beginPath()
        ctx.moveTo(pLeftKnee.x, pLeftKnee.y)
        ctx.lineTo(pLeftAnkle.x, pLeftAnkle.y)
        ctx.stroke()
      }
      if (pRightAnkle && !joints.footRight) {
        ctx.strokeStyle = rightLiftCm >= thresholdCm ? '#b6f36a' : '#607d64'
        ctx.beginPath()
        ctx.moveTo(pRightKnee.x, pRightKnee.y)
        ctx.lineTo(pRightAnkle.x, pRightAnkle.y)
        ctx.stroke()
      }
    }

    // Draw Joints
    const allJointKeys: JointKey[] = [
      'hipCenter', 'kneeLeft', 'kneeRight', 'ankleLeft', 'ankleRight',
      'head', 'shoulderCenter', 'shoulderLeft', 'shoulderRight', 'spine', 'footLeft', 'footRight',
    ]

    for (const key of allJointKeys) {
      const pt = toCanvas(joints[key])
      if (!pt) continue

      if (key === 'head') {
        ctx.fillStyle = '#b6f36a'
        ctx.beginPath()
        ctx.arc(pt.x, pt.y, 14, 0, Math.PI * 2)
        ctx.fill()
        continue
      }

      const isKnee = key === 'kneeLeft' || key === 'kneeRight'
      const isLeftUp = key === 'kneeLeft' && leftLiftCm >= thresholdCm
      const isRightUp = key === 'kneeRight' && rightLiftCm >= thresholdCm
      const isLifted = isLeftUp || isRightUp

      const radius = isLifted ? 8 : isKnee ? 6 : 4
      ctx.fillStyle = isLifted
        ? '#ffffff'
        : pt.state === 'tracked'
        ? '#afff64'
        : pt.state === 'inferred'
        ? '#f59e0b'
        : '#4a594c'

      ctx.beginPath()
      ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2)
      ctx.fill()

      if (isLifted) {
        ctx.strokeStyle = '#b6f36a'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(pt.x, pt.y, radius + 4, 0, Math.PI * 2)
        ctx.stroke()
      }
    }

    // Knee Lift Indicators on canvas
    if (pLeftKnee) {
      ctx.fillStyle = leftLiftCm >= thresholdCm ? '#b6f36a' : '#9ca99b'
      ctx.font = 'bold 11px monospace'
      ctx.textAlign = 'right'
      ctx.fillText(`L: ${leftLiftCm > 0 ? '+' : ''}${leftLiftCm}cm ${leftLiftCm >= thresholdCm ? '▲ UP' : ''}`, pLeftKnee.x - 12, pLeftKnee.y + 4)
    }

    if (pRightKnee) {
      ctx.fillStyle = rightLiftCm >= thresholdCm ? '#b6f36a' : '#9ca99b'
      ctx.font = 'bold 11px monospace'
      ctx.textAlign = 'left'
      ctx.fillText(`${rightLiftCm >= thresholdCm ? '▲ UP ' : ''}${rightLiftCm > 0 ? '+' : ''}${rightLiftCm}cm :R`, pRightKnee.x + 12, pRightKnee.y + 4)
    }

    // HUD overlays
    // Distance indicator
    const distance = hip.z
    const isDistanceGood = distance >= 1.8 && distance <= 2.8
    ctx.textAlign = 'left'
    ctx.font = '10px monospace'
    ctx.fillStyle = isDistanceGood ? '#afff64' : '#eab308'
    ctx.fillText(`JARAK: ${distance.toFixed(2)}m (${isDistanceGood ? 'IDEAL' : distance < 1.8 ? 'TERLALU DEKAT' : 'TERLALU JAUH'})`, 12, 20)

    // Status / Calibration
    ctx.fillStyle = isCalibrated ? '#afff64' : '#eab308'
    ctx.fillText(`STATUS: ${isCalibrated ? 'SIAP BERLARI' : calibrationMessage}`, 12, 36)

    // Frame counter
    ctx.textAlign = 'right'
    ctx.fillStyle = '#6a7869'
    ctx.fillText(`FRAME #${frame.frame}`, width - 12, 20)
    ctx.fillText(`TARGET: +${thresholdCm}cm`, width - 12, 36)

    ctx.restore()
  }, [frame, isConnected, isCalibrated, calibrationMessage, kneeLiftThresholdMeters])

  return (
    <div className="skeleton-preview-container">
      <canvas
        ref={canvasRef}
        width={360}
        height={260}
        className="skeleton-canvas"
        aria-label="Kinect skeleton live visualizer"
      />
    </div>
  )
}