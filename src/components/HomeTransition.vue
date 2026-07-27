<template>
  <div class="home-transition" :class="{ leaving: phase === 'leaving' }">
    <!-- 加载阶段：灰色背景 + 中央 logo + loading 文字 -->
    <div class="ht-loading" :class="{ hidden: phase !== 'loading' }">
      <div class="ht-logo">
        <img src="/logo.png" alt="启明" />
      </div>
      <div class="ht-text">loading</div>
    </div>

    <!-- 收束阶段：logo 居中，圆形蒙版从四周收束到中心 -->
    <div v-if="phase !== 'loading'" class="ht-iris-mask" :class="phase">
      <div class="ht-center">
        <div class="ht-logo-small">
          <img src="/logo.png" alt="启明" />
        </div>
      </div>
      <div class="ht-iris" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const emit = defineEmits(['done'])
const phase = ref('loading')

onMounted(() => {
  // 停留 1.5s 展示 loading，然后进入 iris 收束
  setTimeout(() => {
    phase.value = 'iris'
  }, 1500)

  // iris 动画约 1s，完成后发出 done
  setTimeout(() => {
    phase.value = 'leaving'
  }, 1500 + 1000)

  setTimeout(() => {
    emit('done')
  }, 1500 + 1000 + 350)
})
</script>

<style scoped>
.home-transition {
  position: fixed;
  inset: 0;
  z-index: 99999;
  pointer-events: none;
  background: #c4c4c4;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.35s ease;
}

.home-transition.leaving {
  opacity: 0;
}

.ht-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  animation: loading-fade 0.4s ease-out;
  transition: opacity 0.4s ease, transform 0.4s ease;
}

.ht-loading.hidden {
  opacity: 0;
  transform: scale(0.96);
  pointer-events: none;
}

.ht-logo {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.85);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1), inset 0 0 0 1px rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  animation: logo-breathe 1.2s ease-in-out infinite alternate;
}

.ht-logo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 3px 12px rgba(0, 0, 0, 0.12));
}

.ht-text {
  font-size: 0.95rem;
  font-weight: 500;
  letter-spacing: 0.25em;
  color: #ffffff;
  text-transform: lowercase;
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.15);
}

.ht-iris-mask {
  position: fixed;
  inset: 0;
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #c4c4c4;
}

.ht-center {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.ht-logo-small {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.85);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1), inset 0 0 0 1px rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
}

.ht-logo-small img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.ht-iris {
  position: absolute;
  inset: 0;
  z-index: 3;
  background: #c4c4c4;
  clip-path: circle(150% at 50% 50%);
  transition: clip-path 1s cubic-bezier(0.77, 0, 0.175, 1);
}

.ht-iris-mask.iris .ht-iris {
  clip-path: circle(0% at 50% 50%);
}

.ht-iris-mask.iris .ht-center {
  animation: center-shrink 1s cubic-bezier(0.77, 0, 0.175, 1) forwards;
}

@keyframes loading-fade {
  0% { opacity: 0; transform: translateY(10px); }
  100% { opacity: 1; transform: translateY(0); }
}

@keyframes logo-breathe {
  0% { transform: scale(1); opacity: 0.95; }
  100% { transform: scale(1.04); opacity: 1; }
}

@keyframes center-shrink {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(0.2); opacity: 0; }
}
</style>
