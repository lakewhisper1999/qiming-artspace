<template>
  <div ref="wrapperRef" class="glass-nav-wrapper" :class="{ expanded }">
    <!-- 展开导航组，固定在 wrapper 上方 -->
    <Transition name="nav-fade">
      <div v-if="expanded" class="nav-expanded" @click.stop>
        <div class="nav-side nav-left">
        <!-- 首页按钮 -->
        <div
          class="nav-item"
          :class="{ active: currentRoute === 'Home' }"
          :style="{ transitionDelay: expanded ? '0.05s' : '0s' }"
          @click="selectRoute('Home')"
        >
          <span class="nav-item-icon">⌂</span>
          <span class="nav-item-label">首页</span>
        </div>

        <!-- 目录项：直接在导航栏中显示 -->
        <div
          v-for="(item, idx) in CATALOG_ITEMS"
          :key="item.label"
          class="nav-item"
          :class="{ active: isItemActive(item) }"
          :style="{ transitionDelay: expanded ? (0.08 + idx * 0.04) + 's' : '0s' }"
          @click.stop="handleItemClick(item)"
        >
          <span class="nav-item-icon">{{ item.icon }}</span>
          <span class="nav-item-label">{{ item.label }}</span>
        </div>
      </div>

      <div class="nav-side nav-right">
        <!-- 关于按钮 -->
        <div
          class="nav-item"
          :class="{ active: currentRoute === 'About' }"
          :style="{ transitionDelay: expanded ? '0.15s' : '0s' }"
          @click="selectRoute('About')"
        >
          <span class="nav-item-icon">✦</span>
          <span class="nav-item-label">关于</span>
        </div>
      </div>

    </div>
    </Transition>

    <!-- 液态玻璃按钮（始终在中间底部） -->
    <div
      class="glass-brick"
      :class="{ expanded }"
      role="button"
      aria-label="打开导航"
      @click.stop="toggle"
    >
      <!-- 液态光泽层 -->
      <div class="liquid-shimmer"></div>
      <div class="brick-inner">
        <img class="nav-logo" src="/logo.png" alt="启明" />
        <span class="nav-label">导航</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'

// Props & Emits
const props = defineProps({
  currentRoute: { type: String, default: '' }
})

const emit = defineEmits(['navigate'])

// 路由（仅用于目录激活判断）
const route = useRoute()

// Refs
const wrapperRef = ref(null)

// 状态
const expanded = ref(false)

// 常量
const CATALOG_ITEMS = [
  { label: '平面及动效作品', icon: '✧', route: 'Artwork' },
  { label: '素材库', icon: '◈', route: 'Artwork' },
  { label: '学习工程', icon: '⌬', route: 'Artwork' },
  { label: '图文笔记', icon: '✎', route: 'Article' },
  { label: '提问箱', icon: '◉', route: 'AskBox' },
]
const NAVIGATE_DELAY = 250

// 方法

/**
 * 检查目录项是否处于激活状态
 */
const isItemActive = (item) => {
  if (item.route === 'AskBox') {
    return route.name === 'AskBox'
  }
  if (item.route === 'Article') {
    return route.name === 'Article'
  }
  return route.name === 'Artwork' && route.query.category === item.label
}

const handleItemClick = (item) => {
  if (item.route === 'AskBox') {
    selectRoute('AskBox')
  } else if (item.route === 'Article') {
    selectRoute('Article')
  } else {
    selectRoute('Artwork', item.label)
  }
}

/**
 * 切换导航展开/收起
 * @param {MouseEvent} [e] - 点击事件
 */
const toggle = (e) => {
  if (e) e.stopPropagation()
  expanded.value = !expanded.value
}

const closeNav = () => {
  expanded.value = false
}

const selectRoute = (routeName, category = null) => {
  expanded.value = false

  setTimeout(() => {
    emit('navigate', routeName, category)
  }, NAVIGATE_DELAY)
}

/**
 * 处理点击外部关闭
 * @param {MouseEvent} e - 点击事件
 */
const onClickOutside = (e) => {
  if (!expanded.value) return
  if (wrapperRef.value && !wrapperRef.value.contains(e.target)) {
    closeNav()
  }
}

// 生命周期
onMounted(() => {
  document.addEventListener('click', onClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', onClickOutside)
})
</script>

<style scoped>
/* 导航容器 */
.glass-nav-wrapper {
  position: fixed;
  bottom: 34px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9000;
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: auto;
}

/* 展开的导航项容器 */
.nav-expanded {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.65);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.08),
    0 2px 8px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  position: absolute;
  bottom: 68px;
  left: 50%;
  transform: translateX(-50%) translateY(12px) scale(0.9);
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition:
    opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1),
    visibility 0.35s;
}

.glass-nav-wrapper.expanded .nav-expanded {
  opacity: 1;
  visibility: visible;
  transform: translateX(-50%) translateY(0) scale(1);
}

/* 导航左右分区 */
.nav-side {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* 导航项 */
.nav-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-weight: 500;
  opacity: 0;
  transform: translateY(8px);
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.glass-nav-wrapper.expanded .nav-item {
  opacity: 1;
  transform: translateY(0);
  transition:
    opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.35s cubic-bezier(0.16, 1, 0.3, 1),
    background 0.25s ease;
}

.nav-item:hover {
  background: rgba(0, 0, 0, 0.06);
  color: var(--text);
}

.nav-item.active {
  background: var(--text);
  color: var(--surface);
  font-weight: 600;
}

.nav-item-icon {
  font-size: 1rem;
  line-height: 1;
}

.nav-item-label {
  line-height: 1;
}

/* Transition 动画 */
.nav-fade-enter-active { transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1); }
.nav-fade-leave-active { transition: all 0.25s cubic-bezier(0.4, 0, 0.6, 1); }
.nav-fade-enter-from,
.nav-fade-leave-to { opacity: 0; transform: translateX(-50%) translateY(10px) scale(0.92); }

/* ===== 液态玻璃按钮 ===== */
.glass-brick {
  height: 52px;
  padding: 0 20px;
  border-radius: 999px;
  cursor: pointer;
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  touch-action: manipulation;

  /* 多层玻璃基底 */
  background:
    radial-gradient(ellipse 120% 80% at 50% 30%, rgba(255,255,255,0.55), rgba(255,255,255,0.2));
  backdrop-filter: blur(30px) saturate(220%);
  -webkit-backdrop-filter: blur(30px) saturate(220%);

  /* 液态边框 */
  border: 1.5px solid;
  border-color: rgba(255,255,255,0.7) rgba(255,255,255,0.3) rgba(255,255,255,0.5) rgba(255,255,255,0.6);

  /* 多层阴影（外投影 + 液态光晕） */
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.08),
    0 2px 8px rgba(0, 0, 0, 0.04),
    0 0 0 1px rgba(255, 255, 255, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.85),
    inset 0 -2px 4px rgba(0, 0, 0, 0.02);

  transition:
    transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.4s ease,
    border-color 0.4s ease,
    background 0.4s ease,
    padding 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* 液态光泽层 */
.liquid-shimmer {
  position: absolute;
  inset: -50%;
  background: radial-gradient(
    ellipse 60% 30% at 50% 0%,
    rgba(255, 255, 255, 0.5) 0%,
    transparent 70%
  );
  opacity: 0.7;
  pointer-events: none;
  transition: opacity 0.5s ease, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  transform: translateY(-10%);
}

.glass-brick:hover .liquid-shimmer {
  opacity: 1;
  transform: translateY(0%);
}

/* hover 状态 */
.glass-brick:hover {
  transform: scale(1.04);
  border-color: rgba(255,255,255,0.9) rgba(255,255,255,0.4) rgba(255,255,255,0.6) rgba(255,255,255,0.7);
  box-shadow:
    0 14px 44px rgba(0, 0, 0, 0.1),
    0 4px 14px rgba(0, 0, 0, 0.05),
    0 0 0 1px rgba(255, 255, 255, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.95),
    inset 0 -2px 4px rgba(0, 0, 0, 0.03);
}

/* 展开状态 */
.glass-brick.expanded {
  background:
    radial-gradient(ellipse 120% 80% at 50% 30%, rgba(0,0,0,0.08), rgba(0,0,0,0.04));
  border-color: rgba(0, 0, 0, 0.12) rgba(0,0,0,0.06) rgba(0,0,0,0.1) rgba(0,0,0,0.08);
  backdrop-filter: blur(30px) saturate(120%);
  -webkit-backdrop-filter: blur(30px) saturate(120%);
}

/* 内容区 */
.brick-inner {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 10px;
}

/* Logo 图片 */
.nav-logo {
  width: 30px;
  height: 30px;
  border-radius: 6px;
  object-fit: contain;
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
}

.glass-brick:hover .nav-logo {
  transform: scale(1.08);
}

/* "导航" 文字 */
.nav-label {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text);
  letter-spacing: 0.04em;
  transition: color 0.3s ease;
  white-space: nowrap;
}

/* 移动端适配 */
@media (max-width: 640px) {
  .glass-nav-wrapper { bottom: 22px; }
  .glass-brick {
    height: 44px;
    padding: 0 16px;
  }
  .nav-logo { width: 26px; height: 26px; }
  .nav-label { font-size: 0.85rem; }
  .nav-item { padding: 6px 14px; font-size: 0.85rem; }
  .nav-item-label { display: none; }
  .nav-item-icon { font-size: 1.2rem; }
  .nav-expanded { padding: 8px 14px; bottom: 58px; }
}
</style>
