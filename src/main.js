import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './styles/global.css'
import './styles/cursor.css'
import './styles/animation.css'

const app = createApp(App)
app.use(router)
app.use(ElementPlus)
app.mount('#app')

/* ============================================
   自定义光标 — 全局生效
   ============================================ */
let cursorActive = false
let cursorMain = null
let cursorTrail = null
let mx = 0, my = 0, tx = 0, ty = 0
let rafId = null

const canUseCustomCursor = () =>
  window.matchMedia('(hover: hover) and (pointer: fine)').matches

const createCursors = () => {
  if (cursorMain) return
  cursorMain = document.createElement('div')
  cursorTrail = document.createElement('div')
  cursorMain.className = 'cursor-main'
  cursorTrail.className = 'cursor-trail'
  document.body.appendChild(cursorMain)
  document.body.appendChild(cursorTrail)
}

const destroyCursors = () => {
  if (cursorMain) { cursorMain.remove(); cursorMain = null }
  if (cursorTrail) { cursorTrail.remove(); cursorTrail = null }
}

const animate = () => {
  if (!cursorMain || !cursorTrail) return
  tx += (mx - tx) * 0.12
  ty += (my - ty) * 0.12
  cursorMain.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`
  cursorTrail.style.transform = `translate(${tx}px, ${ty}px) translate(-50%, -50%)`
  rafId = requestAnimationFrame(animate)
}

const onMouseMove = (e) => {
  mx = e.clientX
  my = e.clientY
}

const onMouseLeave = () => {
  // 鼠标离开窗口时隐藏自定义光标
  if (cursorMain && cursorTrail) {
    cursorMain.style.display = 'none'
    cursorTrail.style.display = 'none'
  }
}

const onMouseEnter = () => {
  // 鼠标进入窗口时显示自定义光标
  if (cursorMain && cursorTrail) {
    cursorMain.style.display = ''
    cursorTrail.style.display = ''
  }
}

const hoverSelector = 'a, button, .clickable, [role="button"], .about-link, .skill-card, .nav-item'

const onMouseOver = (e) => {
  const el = e.target
  if (el && el.closest && el.closest(hoverSelector)) {
    cursorMain && cursorMain.classList.add('hover')
    cursorTrail && cursorTrail.classList.add('hover')
  }
}

const onMouseOut = (e) => {
  const el = e.target
  if (el && el.closest && el.closest(hoverSelector)) {
    cursorMain && cursorMain.classList.remove('hover')
    cursorTrail && cursorTrail.classList.remove('hover')
  }
}

const onMouseDown = () => {
  cursorMain && cursorMain.classList.add('click')
}
const onMouseUp = () => {
  cursorMain && cursorMain.classList.remove('click')
}

const enableCursor = () => {
  if (!canUseCustomCursor()) return
  if (cursorActive) return
  cursorActive = true

  createCursors()
  document.body.classList.add('custom-cursor-active')
  document.addEventListener('mousemove', onMouseMove, { passive: true })
  document.addEventListener('mouseenter', onMouseEnter)
  document.addEventListener('mouseleave', onMouseLeave)
  document.addEventListener('mouseover', onMouseOver)
  document.addEventListener('mouseout', onMouseOut)
  document.addEventListener('mousedown', onMouseDown)
  document.addEventListener('mouseup', onMouseUp)
  rafId = requestAnimationFrame(animate)
}

// 全局启用自定义光标
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', enableCursor)
} else {
  enableCursor()
}
