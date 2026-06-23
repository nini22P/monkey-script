import * as THREE from 'three'
import type { VRState, Layout } from './state'
import { VRControls } from './controls'
import { applyLayout } from './layout'
import { bindDrag } from './drag'

let s: VRState | null = null

export function exit360(): void {
  if (!s) return
  const st = s; s = null
  if (st.animId) cancelAnimationFrame(st.animId)
  if (st.controls) { st.controls.destroy(); st.controls = null }
  if (st.onKey) window.removeEventListener('keydown', st.onKey)
  if (st.onResize) window.removeEventListener('resize', st.onResize)
  if (st.renderer) st.renderer.dispose()
  if (st.sphere) {
    if (st.sphere.material) { (st.sphere.material as THREE.MeshBasicMaterial).map = null; (st.sphere.material as THREE.MeshBasicMaterial).dispose() }
    st.sphere.geometry.dispose()
  }
  if (st.overlay && st.overlay.parentElement) st.overlay.parentElement.removeChild(st.overlay)
}

export function enter360(video: HTMLVideoElement): void {
  if (s) return
  if (video.readyState < 1) {
    video.addEventListener('loadedmetadata', () => enter360(video), { once: true })
    return
  }

  const st: VRState = {
    overlay: null, renderer: null, scene: null, camera: null, sphere: null,
    animId: null, onKey: null, onResize: null,
    isDragging: false, prev: { x: 0, y: 0 }, rot: { x: 0, y: 0 },
    zoom: 1, isPinching: false, pinchDist: 0,
    layout: 'mono', controls: null,
  }
  s = st

  try {
    const overlay = document.createElement('div')
    overlay.id = 'vr-overlay'

    st.overlay = overlay
    document.body.appendChild(overlay)

    st.camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 1000)
    st.scene = new THREE.Scene()

    const tex = new THREE.VideoTexture(video)
    tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter
    tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(-1, 1); tex.offset.set(0, 0); tex.center.set(0.5, 0.5)

    const geo = new THREE.SphereGeometry(100, 64, 64)
    st.sphere = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide }))
    st.scene.add(st.sphere)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    st.renderer = renderer
    renderer.setSize(innerWidth, innerHeight)
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    overlay.appendChild(renderer.domElement)

    if (video.paused) video.play()

    const onLayout = (l: Layout) => applyLayout(st, l)
    const controls = new VRControls(video, exit360, overlay, onLayout, st.layout)
    st.controls = controls
    st.animId = requestAnimationFrame(() => loop(st))
    bindDrag(st, overlay)
    st.onKey = (e) => { if (e.key === 'Escape') exit360() }
    window.addEventListener('keydown', st.onKey)
    st.onResize = () => {
      if (!s) return
      if (st.camera) { st.camera.aspect = innerWidth / innerHeight; st.camera.updateProjectionMatrix() }
      if (st.renderer) st.renderer.setSize(innerWidth, innerHeight)
    }
    window.addEventListener('resize', st.onResize)
  } catch (e) {
    console.error(e)
    exit360()
  }
}

function loop(st: VRState): void {
  st.animId = requestAnimationFrame(() => loop(st))
  try { st.renderer!.render(st.scene!, st.camera!) } catch (_) { }
}
