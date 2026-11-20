import type { KinectSkeletonFrame } from '../../types/game'
export type KinectConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error'
export class KinectSensor {
  private socket: WebSocket | null = null
  constructor(private readonly onFrame: (frame: KinectSkeletonFrame) => void, private readonly onState: (state: KinectConnectionState, message: string) => void, private readonly endpoint = 'ws://127.0.0.1:8181/kinect') {}
  start(): Promise<void> {
    this.stop(); this.onState('connecting', 'Menghubungkan ke Kinect Bridge...')
    return new Promise((resolve, reject) => {
      const socket = new WebSocket(this.endpoint); this.socket = socket; let settled = false
      socket.onopen = () => { settled = true; this.onState('connected', 'Bridge tersambung; menunggu skeleton.'); resolve() }
      socket.onmessage = ({ data }) => {
        try { const payload: unknown = JSON.parse(String(data)); if (isFrame(payload)) this.onFrame(payload); else this.onState('error', 'Format frame Kinect tidak valid.') }
        catch { this.onState('error', 'Payload Kinect bukan JSON yang valid.') }
      }
      socket.onerror = () => { this.onState('error', 'Tidak dapat menghubungi Kinect Bridge di port 8181.'); if (!settled) { settled = true; reject(new Error('Kinect Bridge tidak dapat dihubungi.')) } }
      socket.onclose = () => { if (this.socket === socket) this.socket = null; this.onState('disconnected', 'Kinect Bridge terputus.'); if (!settled) { settled = true; reject(new Error('Koneksi Kinect Bridge ditutup.')) } }
    })
  }
  stop(): void { const socket = this.socket; this.socket = null; if (!socket) return; socket.onclose = null; socket.onerror = null; socket.onmessage = null; socket.close() }
}
function isJoint(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false
  const j = value as Record<string, unknown>
  return ['x','y','z'].every((key) => typeof j[key] === 'number' && Number.isFinite(j[key])) && ['tracked','inferred','nottracked'].includes(String(j.state))
}
function isFrame(value: unknown): value is KinectSkeletonFrame {
  if (!value || typeof value !== 'object') return false
  const f = value as Record<string, unknown>
  if (f.type !== 'skeleton-frame' || typeof f.tracking !== 'boolean' || typeof f.frame !== 'number' || typeof f.timestamp !== 'number') return false
  if (!f.tracking) return true
  const joints = f.joints as Record<string, unknown> | undefined
  return Boolean(joints && ['hipCenter','kneeLeft','kneeRight','ankleLeft','ankleRight'].every((key) => isJoint(joints[key])))
}
