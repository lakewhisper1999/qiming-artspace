<template>
  <div
    class="home-page"
    @click="onClick"
    @mousemove="onMouseMove"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
  >
    <!-- WebGL 水波纹背景（PNG 扭曲） -->
    <HomeBg ref="homeBgRef" />

    <!-- 点击/停留后浮现的 logo -->
    <LogoMarks :marks="marks" />

    <!-- 首页内容区（可覆盖在水波纹上） -->
    <div class="home-content">
      <!-- 用户可在此添加文字/按钮等内容 -->
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import HomeBg from '../components/HomeBg.vue'
import LogoMarks from '../components/LogoMarks.vue'
import { useMarks } from '../composables/useMarks.js'
import { useDwell } from '../composables/useDwell.js'

// WebGL 背景组件引用
const homeBgRef = ref(null)

// 使用 composable 管理标记
const { marks, addMark } = useMarks()

// 处理添加标记（同时触发水波纹）
const handleAddMark = (x, y) => {
  // 添加 logo 标记
  addMark(x, y)

  // 触发 WebGL 水波纹
  // 注意：浏览器 Y 轴向下（0=顶），WebGL Y 轴向上（0=底），需要翻转 Y
  if (homeBgRef.value?.addRipple) {
    const normX = x / window.innerWidth
    const normY = 1 - y / window.innerHeight
    homeBgRef.value.addRipple(normX, normY, 0.03)
  }
}

// 使用 composable 管理停留检测
const { startDwell, resetDwell, updatePosition, onMouseEnter, onMouseLeave } = useDwell(
  handleAddMark
)

/**
 * 处理点击事件
 * @param {MouseEvent} e
 */
const onClick = (e) => {
  handleAddMark(e.clientX, e.clientY)
  resetDwell()
}

/**
 * 处理鼠标移动
 * @param {MouseEvent} e
 */
const onMouseMove = (e) => {
  updatePosition(e.clientX, e.clientY)
  startDwell(e.clientX, e.clientY)
}
</script>

<style scoped>
.home-page {
  position: relative;
  width: 100%;
  min-height: 100vh;
  overflow: hidden;
}

.home-content {
  position: relative;
  z-index: 5;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
