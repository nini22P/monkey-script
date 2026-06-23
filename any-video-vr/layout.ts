import type * as THREE from 'three'
import type { VRState, Layout } from './state'

export const rangeGrad = (pct: number) => `linear-gradient(to right,#000 0%,#000 ${pct}%,rgba(0,0,0,0.12) ${pct}%,rgba(0,0,0,0.12) 100%)`

export const LAYOUTS: Layout[] = ['mono', 'tb', 'sbs']
export const LAYOUT_LABELS: Record<Layout, string> = { mono: 'M', tb: 'TB', sbs: 'SBS' }

export function applyLayout(st: VRState, layout: Layout): void {
  const tex = (st.sphere?.material as THREE.MeshBasicMaterial | undefined)?.map
  if (!tex) return
  st.layout = layout
  if (layout === 'mono') { tex.repeat.set(-1, 1); tex.offset.set(0, 0); tex.center.set(0.5, 0.5) }
  else if (layout === 'tb') { tex.repeat.set(-1, 0.5); tex.offset.set(0, 0); tex.center.set(0.5, 0) }
  else if (layout === 'sbs') { tex.repeat.set(-0.5, 1); tex.offset.set(-0.25, 0); tex.center.set(0.5, 0.5) }
  st.controls?.updateLayout()
}
