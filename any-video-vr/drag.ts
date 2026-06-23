import type { VRState } from './state'

function applyDrag(st: VRState, clientX: number, clientY: number): void {
  const dx = clientX - st.prev.x; const dy = clientY - st.prev.y
  st.rot.y -= dx * 0.005; st.rot.x -= dy * 0.005
  st.rot.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, st.rot.x))
  st.sphere!.rotation.x = st.rot.x; st.sphere!.rotation.y = st.rot.y
  st.prev.x = clientX; st.prev.y = clientY
}

function applyZoom(st: VRState, factor: number): void {
  st.zoom = Math.max(0.3, Math.min(5, st.zoom * factor))
  if (st.camera) { st.camera.fov = 75 / st.zoom; st.camera.updateProjectionMatrix() }
}

function touchDist(e: TouchEvent): number {
  const t = e.touches; return Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY)
}

export function bindDrag(st: VRState, overlay: HTMLElement): void {
  overlay.addEventListener('mousedown', (e) => {
    if (e.target !== st.renderer?.domElement) return
    st.isDragging = true; st.prev.x = e.clientX; st.prev.y = e.clientY
    overlay.style.cursor = 'grabbing'
  })
  window.addEventListener('mousemove', (e) => {
    if (!st.isDragging) return
    applyDrag(st, e.clientX, e.clientY)
  })
  window.addEventListener('mouseup', () => { if (st.isDragging) { st.isDragging = false; overlay.style.cursor = 'default' } })
  overlay.addEventListener('wheel', (e) => {
    if (e.target !== st.renderer?.domElement) return
    e.preventDefault()
    applyZoom(st, e.deltaY > 0 ? 0.9 : 1.1)
  })
  overlay.addEventListener('touchstart', (e) => {
    if (e.target !== st.renderer?.domElement) return
    if (e.touches.length === 2) {
      st.isDragging = false; st.isPinching = true; st.pinchDist = touchDist(e)
    } else if (e.touches.length === 1) {
      st.isDragging = true; st.isPinching = false
      const t = e.touches[0]; st.prev.x = t.clientX; st.prev.y = t.clientY
    }
  }, { passive: true })
  overlay.addEventListener('touchmove', (e) => {
    if (st.isPinching && e.touches.length === 2) {
      const d = touchDist(e); applyZoom(st, d / st.pinchDist); st.pinchDist = d
    } else if (st.isDragging) {
      applyDrag(st, e.touches[0].clientX, e.touches[0].clientY)
    }
  }, { passive: true })
  overlay.addEventListener('touchend', () => { st.isDragging = false; st.isPinching = false }, { passive: true })
}
