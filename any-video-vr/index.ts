import cssStr from './style.css?inline'
import { injectStyle } from './ui'
import { enter360 } from './viewer'

injectStyle(cssStr)

function attach(video: HTMLVideoElement): void {
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

document.querySelectorAll<HTMLVideoElement>('video:not([data-vr-btn])').forEach(attach)
const mo = new MutationObserver((ms) => {
  for (const m of ms)
    for (const n of m.addedNodes)
      if (n.nodeName === 'VIDEO') { if (!(n as HTMLVideoElement).dataset.vrBtn) attach(n as HTMLVideoElement) }
      else if (n.nodeType === 1) (n as Element).querySelectorAll<HTMLVideoElement>('video:not([data-vr-btn])').forEach(attach)
})
mo.observe(document.body, { childList: true, subtree: true })
