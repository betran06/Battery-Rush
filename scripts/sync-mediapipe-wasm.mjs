import { cpSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const source = resolve(root, 'node_modules/@mediapipe/tasks-vision/wasm')
const destination = resolve(root, 'public/mediapipe/wasm')

mkdirSync(dirname(destination), { recursive: true })
cpSync(source, destination, { recursive: true, force: true })
console.log('Synced local MediaPipe WASM assets.')