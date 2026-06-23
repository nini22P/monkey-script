// ==UserScript==
// @name         Any Video VR
// @namespace    https://github.com/nini22P/monkey-script/tree/main/any-video-vr
// @version      2026-06-23
// @description  对任意视频开启 VR 模式 | Enable VR mode for any video
// @author       22
// @match        *://*/*
// @grant        none
// @require      https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js
// @license      MIT
// @downloadURL  https://github.com/nini22P/monkey-script/raw/refs/heads/main/any-video-vr/any-video-vr.user.js
// @updateURL    https://github.com/nini22P/monkey-script/raw/refs/heads/main/any-video-vr/any-video-vr.user.js
// ==/UserScript==

; (function () {
  'use strict'

  if (typeof THREE === 'undefined') return

  const style = document.createElement('style')
  style.textContent = `#vr-overlay{position:fixed;inset:0;z-index:99999;background:#000;overflow:hidden}
.vr-time{color:rgba(0,0,0,0.6);font-size:11px;font-family:monospace;user-select:none}
.vr-btn{display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border:none;border-radius:50%;background:transparent;color:#000;cursor:pointer;padding:0}
.vr-btn:hover{background:rgba(0,0,0,0.1) !important}
.vr-layout{font-size:10px;font-weight:700}
#vr-overlay input[type=range]{-webkit-appearance:none;appearance:none;height:10px;border-radius:5px;outline:none;cursor:pointer}
#vr-overlay input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:3px;height:20px;border-radius:2px;background:#000;cursor:pointer;border:none}
#vr-overlay input[type=range]::-moz-range-thumb{width:2px;height:20px;border-radius:3px;background:#000;cursor:pointer;border:none}
#vr-overlay input[type=range]::-moz-range-track{height:10px;border-radius:5px;background:rgba(0,0,0,0.12);border:none}
.vr-prog{width:200px}`
  document.head.appendChild(style)

  const ICONS = {
    play: '<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M8 5v14l11-7z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>',
  }

  document.querySelectorAll('video:not([data-vr-btn])').forEach(attach)
  const mo = new MutationObserver((ms) => {
    for (const m of ms)
      for (const n of m.addedNodes)
        if (n.nodeName === 'VIDEO') { if (!n.dataset.vrBtn) attach(n) }
        else if (n.nodeType === 1) n.querySelectorAll('video:not([data-vr-btn])').forEach(attach)
  })
  mo.observe(document.body, { childList: true, subtree: true })

  function attach(video) {
    video.dataset.vrBtn = '1'
    const btn = document.createElement('button')
    btn.textContent = 'VR'
    Object.assign(btn.style, {
      position: 'absolute', top: '8px', right: '8px', zIndex: '9999',
      width: 'fit-content', height: 'fit-content',
      padding: '4px 10px', fontSize: '13px', fontWeight: 'bold',
      background: 'rgba(0,0,0,0.6)', color: '#fff',
      border: '1px solid rgba(255,255,255,0.3)', borderRadius: '4px',
      cursor: 'pointer', opacity: '0', transition: 'opacity 0.2s',
      pointerEvents: 'none', fontFamily: 'inherit',
    })
    btn.addEventListener('click', (e) => { e.stopPropagation(); enter360(video) })
    const parent = video.parentElement
    if (!parent) return
    if (getComputedStyle(parent).position === 'static') parent.style.position = 'relative'
    parent.appendChild(btn)
    parent.addEventListener('mouseenter', () => { btn.style.opacity = '1'; btn.style.pointerEvents = 'auto' })
    parent.addEventListener('mouseleave', () => { btn.style.opacity = '0'; btn.style.pointerEvents = 'none' })
    if (parent.matches(':hover')) { btn.style.opacity = '1'; btn.style.pointerEvents = 'auto' }
  }

  let s = null

  function exit360() {
    if (!s) return
    const st = s; s = null
    if (st.animId) cancelAnimationFrame(st.animId)
    if (st.controls) { st.controls.destroy(); st.controls = null }
    if (st.onKey) window.removeEventListener('keydown', st.onKey)
    if (st.onResize) window.removeEventListener('resize', st.onResize)
    if (st.renderer) st.renderer.dispose()
    if (st.sphere) {
      if (st.sphere.material) { st.sphere.material.map = null; st.sphere.material.dispose() }
      st.sphere.geometry.dispose()
    }
    if (st.overlay && st.overlay.parentElement) st.overlay.parentElement.removeChild(st.overlay)
  }

  function enter360(video) {
    if (s) return
    if (video.readyState < 1) {
      video.addEventListener('loadedmetadata', () => enter360(video), { once: true })
      return
    }

    const st = {
      overlay: null, renderer: null, scene: null, camera: null, sphere: null,
      animId: null, onKey: null, onResize: null,
      isDragging: false, prev: { x: 0, y: 0 }, rot: { x: 0, y: 0 },
      zoom: 1, isPinching: false, pinchDist: 0,
      layout: 'mono',
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

      const onLayout = (l) => applyLayout(st, l)
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

  function loop(st) {
    st.animId = requestAnimationFrame(() => loop(st))
    try { st.renderer.render(st.scene, st.camera) } catch (_) { }
  }

  const rangeGrad = (pct) => `linear-gradient(to right,#000 0%,#000 ${pct}%,rgba(0,0,0,0.12) ${pct}%,rgba(0,0,0,0.12) 100%)`
  const LAYOUTS = ['mono', 'tb', 'sbs']
  const LAYOUT_LABELS = { mono: 'M', tb: 'TB', sbs: 'SBS' }

  function applyLayout(st, layout) {
    const tex = st.sphere?.material?.map
    if (!tex) return
    st.layout = layout
    if (layout === 'mono') { tex.repeat.set(-1, 1); tex.offset.set(0, 0); tex.center.set(0.5, 0.5) }
    else if (layout === 'tb') { tex.repeat.set(-1, 0.5); tex.offset.set(0, 0); tex.center.set(0.5, 0) }
    else if (layout === 'sbs') { tex.repeat.set(-0.5, 1); tex.offset.set(-0.25, 0); tex.center.set(0.5, 0.5) }
    if (st.controls) st.controls.updateLayout()
  }

  function formatTime(t) {
    const m = Math.floor((t || 0) / 60)
    const sec = Math.floor((t || 0) % 60)
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }



  class VRControls {
    constructor(video, onExit, overlay, onLayout, layout) {
      this.video = video
      this.onExit = onExit
      this.overlay = overlay
      this.onLayout = onLayout
      this.layout = layout
      this.seeking = false
      this.hideTimer = null

      this.el = document.createElement('div')
      this.el.style.cssText = 'position:absolute;bottom:28px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:4px;padding:5px 6px;border-radius:18px;background:rgba(255,255,255,0.4);backdrop-filter:blur(8px);z-index:10;pointer-events:auto;transition:opacity .3s;white-space:nowrap;opacity:1'

      this.el.innerHTML = `
        <button class="vr-btn" data-action="play">${ICONS.pause}</button>
        <span class="vr-time">00:00/00:00</span>
        <input type="range" class="vr-prog" min="0" max="1" step="0.001" value="0">
        <button class="vr-btn vr-layout" data-action="layout">M</button>
        <button class="vr-btn" data-action="exit">${ICONS.close}</button>
      `

      this.timeEl = this.el.querySelector('.vr-time')
      this.progEl = this.el.querySelector('.vr-prog')
      this.playBtn = this.el.querySelector('[data-action="play"]')
      this.layoutBtn = this.el.querySelector('[data-action="layout"]')

      overlay.appendChild(this.el)
      this.bindEvents()
      this.updateUI()
      this.updateLayout()
      this.showBar()
    }

    bindEvents() {
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
        const btn = e.target.closest('[data-action]')
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
        if (v.duration) v.currentTime = Number(e.target.value) * v.duration
        this.progEl.style.background = rangeGrad(Number(e.target.value) * 100)
      })
      this.progEl.addEventListener('change', () => { this.seeking = false })
    }

    updateUI() {
      const v = this.video
      const prog = v.duration > 0 ? v.currentTime / v.duration : 0
      this.timeEl.textContent = `${formatTime(v.currentTime)}/${formatTime(v.duration)}`
      this.progEl.value = prog
      this.progEl.style.background = rangeGrad(prog * 100)
    }

    showBar() {
      this.el.style.opacity = '1'
      clearTimeout(this.hideTimer)
      this.hideTimer = setTimeout(() => { this.el.style.opacity = '0' }, 4000)
    }

    updateLayout() {
      if (this.layoutBtn) this.layoutBtn.textContent = LAYOUT_LABELS[this.layout]
    }

    destroy() {
      clearTimeout(this.hideTimer)
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

  function applyDrag(st, clientX, clientY) {
    const dx = clientX - st.prev.x; const dy = clientY - st.prev.y
    st.rot.y -= dx * 0.005; st.rot.x -= dy * 0.005
    st.rot.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, st.rot.x))
    st.sphere.rotation.x = st.rot.x; st.sphere.rotation.y = st.rot.y
    st.prev.x = clientX; st.prev.y = clientY
  }

  function applyZoom(st, factor) {
    st.zoom = Math.max(0.3, Math.min(5, st.zoom * factor))
    if (st.camera) { st.camera.fov = 75 / st.zoom; st.camera.updateProjectionMatrix() }
  }

  function touchDist(e) {
    const t = e.touches; return Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY)
  }

  function bindDrag(st, overlay) {
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
})()
