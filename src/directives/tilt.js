// v-tilt —— 3D 倾斜指令（纯 JS，零依赖）
// 光标在元素上移动时，元素随光标位置做轻微 3D 倾斜（rotateX/rotateY），离开回弹。
// 用法：<div v-tilt> 或 <div v-tilt="8">（数值为最大倾斜角度，默认 10°）
// 注意：仅用于少量卡片/可点区块，不要批量挂到长列表的每个子元素。
// 与 ArtworkCard 的 tilt 同源，但做成通用指令，便于在关于页、提问箱等处复用。

const DEFAULT_MAX = 10
const PERSPECTIVE = 800

export const tilt = {
  mounted(el, binding) {
    const max = typeof binding.value === 'number' ? binding.value : DEFAULT_MAX
    el.style.transformStyle = 'preserve-3d'
    el.style.willChange = 'transform'

    const setBase = () => {
      // 回弹态：无旋转，但保留 perspective 让 3D 生效
      el.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
      el.style.transform = `perspective(${PERSPECTIVE}px) rotateX(0deg) rotateY(0deg)`
    }

    const onMove = (e) => {
      const rect = el.getBoundingClientRect()
      const px = (e.clientX - rect.left) / rect.width
      const py = (e.clientY - rect.top) / rect.height
      const ry = (px - 0.5) * max * 2   // 左右 → rotateY
      const rx = (0.5 - py) * max * 2   // 上下 → rotateX
      // 跟随光标时贴近实时，几乎无过渡延迟
      el.style.transition = 'transform 0.08s linear'
      el.style.transform = `perspective(${PERSPECTIVE}px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`
    }

    const onLeave = () => setBase()

    setBase()
    el._tilt = { onMove, onLeave }
    el.addEventListener('mousemove', onMove, { passive: true })
    el.addEventListener('mouseleave', onLeave, { passive: true })
  },
  unmounted(el) {
    if (el._tilt) {
      el.removeEventListener('mousemove', el._tilt.onMove)
      el.removeEventListener('mouseleave', el._tilt.onLeave)
      delete el._tilt
    }
  }
}
