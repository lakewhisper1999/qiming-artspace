<template>
  <div class="page-transition">
    <div class="slide-panel" :class="panelPhase">
      <div class="panel-logo">
        <img src="/logo.png" :alt="logoText" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
  logoText: { type: String, default: '启明' }
})
const emit = defineEmits(['done'])

const panelPhase = ref('slide-in')

onMounted(() => {
  // 先下滑入面板并展示 logo
  setTimeout(() => {
    panelPhase.value = 'settled'
  }, 50)

  // 短暂展示后从上滑出
  setTimeout(() => {
    panelPhase.value = 'slide-out'
  }, 750)

  setTimeout(() => {
    emit('done')
  }, 1400)
})
</script>

<style scoped>
.page-transition {
  position: fixed;
  inset: 0;
  z-index: 99998;
  pointer-events: none;
}

.slide-panel {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #f9f6e8 0%, #f3ecce 65%, #ece0b4 100%);
  transform: translateY(100%);
  transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.slide-panel.slide-in {
  transform: translateY(0);
}

.slide-panel.settled {
  transform: translateY(0);
}

.slide-panel.slide-out {
  transform: translateY(-100%);
  transition: transform 0.6s cubic-bezier(0.55, 0.085, 0.68, 0.53);
}

.panel-logo {
  position: relative;
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.85);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08), inset 0 0 0 1px rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  animation: logo-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  z-index: 2;
}

/* 背面浅黄色圆形衬托，让白色logo在暖黄渐变背景中更醒目 */
.panel-logo::before {
  content: '';
  position: absolute;
  inset: -20px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(243, 236, 206, 0.8) 0%, rgba(249, 246, 232, 0.35) 70%, transparent 100%);
  z-index: -1;
}

.panel-logo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

@keyframes logo-pop {
  0% { opacity: 0; transform: scale(0.7); }
  100% { opacity: 1; transform: scale(1); }
}
</style>
