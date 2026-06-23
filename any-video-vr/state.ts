import type * as THREE from 'three'
import type { VRControls } from './controls'

export type Layout = 'mono' | 'tb' | 'sbs'

export interface VRState {
  overlay: HTMLDivElement | null
  renderer: THREE.WebGLRenderer | null
  scene: THREE.Scene | null
  camera: THREE.PerspectiveCamera | null
  sphere: THREE.Mesh | null
  animId: number | null
  onKey: ((e: KeyboardEvent) => void) | null
  onResize: (() => void) | null
  isDragging: boolean
  prev: { x: number; y: number }
  rot: { x: number; y: number }
  zoom: number
  isPinching: boolean
  pinchDist: number
  layout: Layout
  controls: VRControls | null
}
