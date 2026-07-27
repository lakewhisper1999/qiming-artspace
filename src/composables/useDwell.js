/**
 * 停留检测组合式函数
 * 用于检测鼠标在某一位置停留指定时间
 */
import { ref } from 'vue'
import { DWELL_MS } from '../constants/home.js'

/**
 * @param {Function} onDwell - 停留达到指定时间后的回调函数
 * @param {number} [dwellMs=DWELL_MS] - 停留时间阈值（毫秒）
 * @returns {Object} 停留检测相关方法和状态
 */
export function useDwell(onDwell, dwellMs = DWELL_MS) {
  const isHovering = ref(false)
  const hoverPos = ref({ x: 0, y: 0 })
  const dwellTimer = ref(null)

  /**
   * 开始停留计时
   * @param {number} x - 鼠标 X 坐标
   * @param {number} y - 鼠标 Y 坐标
   */
  const startDwell = (x, y) => {
    resetDwell()
    hoverPos.value = { x, y }
    isHovering.value = true

    dwellTimer.value = setTimeout(() => {
      if (isHovering.value && onDwell) {
        onDwell(hoverPos.value.x, hoverPos.value.y)
      }
    }, dwellMs)
  }

  /**
   * 重置停留计时
   */
  const resetDwell = () => {
    isHovering.value = false
    if (dwellTimer.value) {
      clearTimeout(dwellTimer.value)
      dwellTimer.value = null
    }
  }

  /**
   * 更新鼠标位置（继续计时）
   * @param {number} x - 鼠标 X 坐标
   * @param {number} y - 鼠标 Y 坐标
   */
  const updatePosition = (x, y) => {
    hoverPos.value = { x, y }
  }

  /**
   * 处理鼠标进入
   */
  const onMouseEnter = () => {
    isHovering.value = true
  }

  /**
   * 处理鼠标离开
   */
  const onMouseLeave = () => {
    resetDwell()
  }

  return {
    isHovering,
    hoverPos,
    startDwell,
    resetDwell,
    updatePosition,
    onMouseEnter,
    onMouseLeave,
  }
}
