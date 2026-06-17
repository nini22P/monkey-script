// ==UserScript==
// @name         Any Video VR
// @namespace    https://github.com/nini22P/monkey-script/tree/main/any-video-vr
// @version      2026-06-17
// @description  任意视频 360° 沉浸查看 | Immersive 360° view for any video
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
  style.textContent = `
#vr-overlay {
  position: fixed; inset: 0; z-index: 99999; background: #000; overflow: hidden;
}
#vr-overlay .vr-bar {
  position: absolute; bottom: 28px; left: 50%; transform: translateX(-50%);
  display: flex; align-items: center; gap: 2px;
  padding: 4px 12px;
  border-radius: 40px;
  background: rgba(20,20,20,0.65);
  border: 1px solid rgba(255,255,255,0.06);
  box-shadow: 0 4px 24px rgba(0,0,0,0.5);
  z-index: 10; pointer-events: auto; transition: opacity 0.3s;
  white-space: nowrap;
}
#vr-overlay .vr-time {
  color: rgba(255,255,255,0.45);
  font-size: 11px; font-family: monospace;
  min-width: 95px; text-align: center;
  user-select: none;
}
#vr-overlay .vr-btn {
  background: transparent; border: none; cursor: pointer;
  color: rgba(255,255,255,0.75);
  width: 32px; height: 32px; padding: 0;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.15s;
}
#vr-overlay .vr-btn:hover {
  background: rgba(255,255,255,0.08);
}
#vr-overlay input[type=range] {
  -webkit-appearance: none; appearance: none;
  background: transparent; cursor: pointer;
  height: 20px; margin: 0;
  --pct: 0%;
}
#vr-overlay input[type=range]::-webkit-slider-runnable-track {
  height: 4px; border-radius: 2px;
  background: linear-gradient(to right, rgba(255,255,255,0.65) var(--pct), rgba(255,255,255,0.12) var(--pct));
}
#vr-overlay input[type=range]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 11px; height: 11px; border-radius: 50%;
  background: #fff;
  box-shadow: 0 0 6px rgba(0,0,0,0.3);
  margin-top: -3.5px;
}
#vr-overlay input[type=range]::-moz-range-track {
  height: 4px; border-radius: 2px;
  background: rgba(255,255,255,0.12); border: none;
}
#vr-overlay input[type=range]::-moz-range-thumb {
  width: 11px; height: 11px; border-radius: 50%;
  background: #fff; border: none;
}
#vr-overlay .vr-prog {
  flex: 1 1 200px; min-width: 80px; max-width: min(400px, 35vw);
}
#vr-overlay .vr-vol {
  width: 56px; flex-shrink: 0;
}
`
  document.head.appendChild(style)

  const ICONS = {
    play_arrow: '<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M8 5v14l11-7z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>',
    volume_up: '<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>',
    volume_off: '<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>',
  }

  setInterval(() => {
    document.querySelectorAll('video:not([data-vr-btn])').forEach(attach)
  }, 2000)

  function attach(video) {
    video.dataset.vrBtn = '1'
    const btn = document.createElement('button')
    btn.textContent = 'VR'
    Object.assign(btn.style, {
      position: 'absolute', top: '8px', right: '8px', zIndex: '9999',
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
  }

  let s = null

  function exit360() {
    if (!s) return
    const st = s; s = null
    if (st.hideTimer) clearTimeout(st.hideTimer)
    if (st.animId) cancelAnimationFrame(st.animId)
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
      hideTimer: null,
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

      const geo = new THREE.SphereGeometry(100, 64, 64)
      st.sphere = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide }))
      st.scene.add(st.sphere)

      const renderer = new THREE.WebGLRenderer({ antialias: true })
      st.renderer = renderer
      renderer.setSize(innerWidth, innerHeight)
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
      overlay.appendChild(renderer.domElement)

      if (video.paused) video.play()

      buildUI(st, video, overlay)
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
      console.error('[VVR]', e)
      exit360()
    }
  }

  function loop(st) {
    st.animId = requestAnimationFrame(() => loop(st))
    try { st.renderer.render(st.scene, st.camera) } catch (_) { }
  }

  function fmt(t) {
    const m = Math.floor((t || 0) / 60)
    const sec = Math.floor((t || 0) % 60)
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  function pct(val) { return String(val * 100) + '%' }

  function btn(html) {
    const el = document.createElement('button')
    el.className = 'vr-btn'
    el.innerHTML = html
    return el
  }

  function buildUI(st, video, overlay) {
    const bar = document.createElement('div')
    bar.className = 'vr-bar'

    const playBtn = btn(ICONS.pause)
    playBtn.addEventListener('click', () => {
      if (video.paused) { video.play(); playBtn.innerHTML = ICONS.pause }
      else { video.pause(); playBtn.innerHTML = ICONS.play_arrow }
    })
    video.addEventListener('play', () => { if (playBtn.isConnected) playBtn.innerHTML = ICONS.pause })
    video.addEventListener('pause', () => { if (playBtn.isConnected) playBtn.innerHTML = ICONS.play_arrow })

    const timeEl = document.createElement('span')
    timeEl.className = 'vr-time'
    timeEl.textContent = '00:00 / 00:00'
    video.addEventListener('loadedmetadata', () => {
      if (timeEl.isConnected) timeEl.textContent = `${fmt(0)} / ${fmt(video.duration)}`
    })
    video.addEventListener('timeupdate', () => {
      if (timeEl.isConnected) timeEl.textContent = `${fmt(video.currentTime)} / ${fmt(video.duration)}`
    })

    const prog = document.createElement('input')
    prog.type = 'range'
    prog.className = 'vr-prog'
    prog.min = '0'; prog.max = '1'; prog.step = '0.001'; prog.value = '0'
    let seeking = false
    prog.addEventListener('input', () => {
      seeking = true
      if (video.duration) video.currentTime = Number(prog.value) * video.duration
    })
    prog.addEventListener('change', () => { seeking = false })
    video.addEventListener('timeupdate', () => {
      if (!seeking && video.duration && prog.isConnected) {
        const v = video.currentTime / video.duration
        prog.value = String(v)
        prog.style.setProperty('--pct', pct(v))
      }
    })

    const volBtn = btn(ICONS.volume_up)
    volBtn.addEventListener('click', () => {
      video.muted = !video.muted
      volBtn.innerHTML = video.muted ? ICONS.volume_off : ICONS.volume_up
    })

    const vol = document.createElement('input')
    vol.type = 'range'
    vol.className = 'vr-vol'
    vol.min = '0'; vol.max = '1'; vol.step = '0.01'; vol.value = String(video.volume)
    vol.style.setProperty('--pct', pct(video.volume))
    vol.addEventListener('input', () => {
      video.volume = Number(vol.value)
      video.muted = false
      volBtn.innerHTML = ICONS.volume_up
      vol.style.setProperty('--pct', pct(Number(vol.value)))
    })

    const exitBtn = btn(ICONS.close)
    exitBtn.addEventListener('click', (e) => { e.stopPropagation(); exit360() })

    bar.append(playBtn, timeEl, prog, volBtn, vol, exitBtn)
    overlay.appendChild(bar)

    function show() {
      bar.style.opacity = '1'
      clearTimeout(st.hideTimer)
      st.hideTimer = setTimeout(() => { bar.style.opacity = '0' }, 4000)
    }
    show()
    overlay.addEventListener('mousemove', show)
  }

  function bindDrag(st, overlay) {
    overlay.addEventListener('mousedown', (e) => {
      if (e.target !== st.renderer?.domElement) return
      st.isDragging = true; st.prev.x = e.clientX; st.prev.y = e.clientY
      overlay.style.cursor = 'grabbing'
    })
    window.addEventListener('mousemove', (e) => {
      if (!st.isDragging) return
      const dx = e.clientX - st.prev.x; const dy = e.clientY - st.prev.y
      st.rot.y -= dx * 0.005; st.rot.x -= dy * 0.005
      st.rot.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, st.rot.x))
      st.sphere.rotation.x = st.rot.x; st.sphere.rotation.y = st.rot.y
      st.prev.x = e.clientX; st.prev.y = e.clientY
    })
    window.addEventListener('mouseup', () => { if (st.isDragging) { st.isDragging = false; overlay.style.cursor = 'default' } })
    overlay.addEventListener('touchstart', (e) => {
      if (e.target !== st.renderer?.domElement) return
      const t = e.touches[0]; st.isDragging = true; st.prev.x = t.clientX; st.prev.y = t.clientY
    }, { passive: true })
    overlay.addEventListener('touchmove', (e) => {
      if (!st.isDragging) return
      const t = e.touches[0]; const dx = t.clientX - st.prev.x; const dy = t.clientY - st.prev.y
      st.rot.y -= dx * 0.005; st.rot.x -= dy * 0.005
      st.rot.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, st.rot.x))
      st.sphere.rotation.x = st.rot.x; st.sphere.rotation.y = st.rot.y
      st.prev.x = t.clientX; st.prev.y = t.clientY
    }, { passive: true })
    overlay.addEventListener('touchend', () => { st.isDragging = false }, { passive: true })
  }
})()
