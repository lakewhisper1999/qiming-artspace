// v-magnetic —— 磁性按钮指令（纯 JS，零依赖）
// 光标靠近元素时，元素朝鼠标方向轻微偏移，离开回弹。
// 用法：<button v-magnetic> 或 <button v-magnetic="0.4">（数值为吸附强度 0~1）
// 注意：仅用于少量关键按钮（导航胶囊 / 筛选按钮 / 头部按钮），
// 不要批量挂到长列表里的每个子元素，否则会注册大量全局 pointermove 监听。

const DEFAULT_STRENGTH = 0.35
const DEFAULT_RADIUS = 110 // px，触发半径（超出则不吸附，避免误动远处元素）
const HOVER_SCALE = 1.07   // 靠近时叠加的放大（保留按钮原有的「放大」反馈）

function handleMove(e, el, strength) {
  const rect = el.getBoundingClientRect()
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2
  const dx = e.clientX - cx
  const dy = e.clientY - cy
  const dist = Math.hypot(dx, dy)
  const reach = DEFAULT_RADIUS + Math.max(rect.width, rect.height) / 2

  if (dist < reach) {
    // 距离越近吸附越强（线性衰减），手感更自然；同时叠加轻微放大
    const falloff = 1 - dist / reach
    el.style.transform = `translate(${dx * strength * falloff}px, ${dy * strength * falloff}px) scale(${HOVER_SCALE})`
  } else {
    el.style.transform = 'translate(0px, 0px) scale(1)'
  }
}

function handleLeave(el) {
  el.style.transform = 'translate(0px, 0px) scale(1)'
}

export const magnetic = {
  mounted(el, binding) {
    const strength = typeof binding.value === 'number' ? binding.value : DEFAULT_STRENGTH
    el.style.transition = 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
    el.style.willChange = 'transform'

    const move = (e) => handleMove(e, el, strength)
    const leave = () => handleLeave(el)
    el._magnetic = { move, leave }

    // 鼠标离开窗口时复位
    window.addEventListener('pointermove', move, { passive: true })
    el.addEventListener('pointerleave', leave, { passive: true })
  },
  unmounted(el) {
    if (el._magnetic) {
      window.removeEventListener('pointermove', el._magnetic.move)
      el.removeEventListener('pointerleave', el._magnetic.leave)
      delete el._magnetic
    }
  }
}
