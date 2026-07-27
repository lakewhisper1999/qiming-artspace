/**
 * WebGL 水波纹管理组合式函数
 * 管理水波纹的状态和生命周期
 */
import { ref } from 'vue'
import { MAX_RIPPLES, RIPPLE_LIFETIME, RIPPLE_STRENGTH } from '../constants/ripple.js'

/**
 * @returns {Object} 水波纹管理相关方法和状态
 */
export function useRipples() {
  const ripples = ref([])
  let idCounter = 0

  /**
   * 添加涟漪
   * @param {number} x - 归一化 X 坐标 (0-1)
   * @param {number} y - 归一化 Y 坐标 (0-1)
   * @param {number} [strength=RIPPLE_STRENGTH.default] - 涟漪强度
   * @returns {number} 新涟漪的 ID
   */
  const addRipple = (x, y, strength = RIPPLE_STRENGTH.default) => {
    const id = ++idCounter

    const ripple = {
      id,
      x,
      y,
      time: performance.now() * 0.001,
      strength,
    }

    ripples.value = [...ripples.value, ripple]

    // 超过最大数量时移除最早的涟漪
    if (ripples.value.length > MAX_RIPPLES) {
      ripples.value.shift()
    }

    return id
  }

  /**
   * 更新涟漪状态（清理过期涟漪）
   * @param {number} currentTime - 当前时间（秒）
   */
  const updateRipples = (currentTime) => {
    const lifetime = RIPPLE_LIFETIME / 1000
    ripples.value = ripples.value.filter(r => currentTime - r.time < lifetime)
  }

  /**
   * 获取当前活跃的涟漪（用于 WebGL 渲染）
   * @returns {Array} 活跃涟漪数组
   */
  const getActiveRipples = () => {
    return ripples.value.slice(-MAX_RIPPLES)
  }

  /**
   * 清除所有涟漪
   */
  const clearAll = () => {
    ripples.value = []
  }

  return {
    ripples,
    addRipple,
    updateRipples,
    getActiveRipples,
    clearAll,
  }
}
