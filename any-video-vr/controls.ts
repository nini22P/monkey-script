import type { Layout } from './state'
import { ICONS, formatTime } from './ui'
import { LAYOUTS, LAYOUT_LABELS, rangeGrad } from './layout'

export class VRControls {
  video: HTMLVideoElement
  onExit: () => void
  overlay: HTMLElement
  onLayout: (layout: Layout) => void
  layout: Layout
  seeking: boolean
  hideTimer: ReturnType<typeof setTimeout> | null
  el: HTMLDivElement
  timeEl: HTMLSpanElement
  progEl: HTMLInputElement
  playBtn: HTMLButtonElement
  layoutBtn: HTMLButtonElement
  _cbs: Record<string, () => void> | null

  constructor(video: HTMLVideoElement, onExit: () => void, overlay: HTMLElement, onLayout: (layout: Layout) => void, layout: Layout) {
    this.video = video
    this.onExit = onExit
    this.overlay = overlay
    this.onLayout = onLayout
    this.layout = layout
    this.seeking = false
    this.hideTimer = null
    this._cbs = null

    this.el = document.createElement('div')
    this.el.style.cssText = 'position:absolute;bottom:28px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:4px;padding:5px 6px;border-radius:18px;background:rgba(255,255,255,0.4);backdrop-filter:blur(8px);z-index:10;pointer-events:auto;transition:opacity .3s;white-space:nowrap;opacity:1'

    this.el.innerHTML = `
      <button class="vr-btn" data-action="play">${ICONS.pause}</button>
      <span class="vr-time">00:00/00:00</span>
      <input type="range" class="vr-prog" min="0" max="1" step="0.001" value="0">
      <button class="vr-btn vr-layout" data-action="layout">M</button>
      <button class="vr-btn" data-action="exit">${ICONS.close}</button>
    `

    this.timeEl = this.el.querySelector('.vr-time')!
    this.progEl = this.el.querySelector('.vr-prog')!
    this.playBtn = this.el.querySelector('[data-action="play"]')!
    this.layoutBtn = this.el.querySelector('[data-action="layout"]')!

    overlay.appendChild(this.el)
    this.bindEvents()
    this.updateUI()
    this.updateLayout()
    this.showBar()
  }

  bindEvents(): void {
    const v = this.video
    const o = this.overlay
    const onPlayChange = () => { this.playBtn.innerHTML = v.paused ? ICONS.play : ICONS.pause }
    const cbs = this._cbs = {
      playchange: onPlayChange,
      timeupdate: () => { if (!this.seeking) this.updateUI() },
      volumechange: () => this.updateUI(),
      mousemove: () => this.showBar(),
    }

    v.addEventListener('play', onPlayChange)
    v.addEventListener('pause', onPlayChange)
    v.addEventListener('timeupdate', cbs.timeupdate)
    v.addEventListener('volumechange', cbs.volumechange)
    o.addEventListener('mousemove', cbs.mousemove)

    this.el.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest('[data-action]') as HTMLElement | null
      if (!btn) return
      switch (btn.dataset.action) {
        case 'play': v.paused ? v.play() : v.pause(); break
        case 'exit': e.stopPropagation(); this.onExit(); break
        case 'layout':
          const i = (LAYOUTS.indexOf(this.layout) + 1) % LAYOUTS.length
          this.layout = LAYOUTS[i]
          this.onLayout(this.layout)
          break
      }
    })

    this.progEl.addEventListener('input', (e) => {
      this.seeking = true
      if (v.duration) v.currentTime = Number((e.target as HTMLInputElement).value) * v.duration
      this.progEl.style.background = rangeGrad(Number((e.target as HTMLInputElement).value) * 100)
    })
    this.progEl.addEventListener('change', () => { this.seeking = false })
  }

  updateUI(): void {
    const v = this.video
    const prog = v.duration > 0 ? v.currentTime / v.duration : 0
    this.timeEl.textContent = `${formatTime(v.currentTime)}/${formatTime(v.duration)}`
    this.progEl.value = String(prog)
    this.progEl.style.background = rangeGrad(prog * 100)
  }

  showBar(): void {
    this.el.style.opacity = '1'
    clearTimeout(this.hideTimer!)
    this.hideTimer = setTimeout(() => { this.el.style.opacity = '0' }, 4000)
  }

  updateLayout(): void {
    if (this.layoutBtn) this.layoutBtn.textContent = LAYOUT_LABELS[this.layout]
  }

  destroy(): void {
    clearTimeout(this.hideTimer!)
    const v = this.video
    const o = this.overlay
    const cbs = this._cbs
    if (cbs) {
      v.removeEventListener('play', cbs.playchange)
      v.removeEventListener('pause', cbs.playchange)
      v.removeEventListener('timeupdate', cbs.timeupdate)
      v.removeEventListener('volumechange', cbs.volumechange)
      o.removeEventListener('mousemove', cbs.mousemove)
    }
    if (this.el.parentElement) this.el.parentElement.removeChild(this.el)
  }
}
