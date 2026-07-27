/**
 * Logo 标记管理组合式函数
 * 管理点击/停留后浮现的 logo 标记
 */
import { ref } from 'vue'
import { MAX_MARKS, LIFETIME_MS, MARK_SIZE } from '../constants/home.js'

/**
 * @returns {Object} 标记管理相关方法和状态
 */
export function useMarks() {
  const marks = ref([])
  let idCounter = 0

  /**
   * 添加标记
   * @param {number} x - X 坐标
   * @param {number} y - Y 坐标
   * @returns {number} 新标记的 ID
   */
  const addMark = (x, y) => {
    const id = ++idCounter
    const size = MARK_SIZE.min + Math.random() * (MARK_SIZE.max - MARK_SIZE.min)

    const mark = {
      id,
      x,
      y,
      size,
      leaving: false,
    }

    // 使用展开运算符确保响应式更新
    marks.value = [...marks.value, mark]

    // 超过最大数量时移除最早的标记
    if (marks.value.length > MAX_MARKS) {
      removeMark(marks.value[0].id)
    }

    // 设置自动移除定时器
    setTimeout(() => {
      removeMark(id)
    }, LIFETIME_MS)

    return id
  }

  /**
   * 移除标记
   * @param {number} id - 标记 ID
   */
  const removeMark = (id) => {
    const idx = marks.value.findIndex(m => m.id === id)
    if (idx === -1) return

    const mark = marks.value[idx]
    if (mark.leaving) return

    // 标记为离开状态，触发离开动画
    mark.leaving = true

    // 动画完成后从数组中移除
    setTimeout(() => {
      const currentIdx = marks.value.findIndex(m => m.id === id)
      if (currentIdx !== -1) {
        marks.value.splice(currentIdx, 1)
      }
    }, 500)
  }

  /**
   * 清除所有标记
   */
  const clearAll = () => {
    marks.value.forEach(mark => {
      mark.leaving = true
    })

    setTimeout(() => {
      marks.value = []
    }, 500)
  }

  return {
    marks,
    addMark,
    removeMark,
    clearAll,
  }
}
