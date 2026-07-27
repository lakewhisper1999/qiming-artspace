<template>
  <div class="logo-marks-layer">
    <div
      v-for="mark in marks"
      :key="mark.id"
      class="logo-mark"
      :class="{ leaving: mark.leaving }"
      :style="markStyle(mark)"
    >
      <img src="/logo.png" alt="logo" />
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  marks: { type: Array, default: () => [] }
})

const markStyle = (mark) => ({
  left: mark.x + 'px',
  top: mark.y + 'px',
  width: mark.size + 'px',
  height: mark.size + 'px',
})
</script>

<style scoped>
.logo-marks-layer {
  position: fixed;
  inset: 0;
  z-index: 100;
  pointer-events: none;
}

.logo-mark {
  position: absolute;
  transform: translate(-50%, -50%) scale(0.6);
  opacity: 0;
  animation: mark-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  filter: drop-shadow(0 4px 16px rgba(0, 0, 0, 0.12));
}

.logo-mark::before {
  content: '';
  position: absolute;
  inset: -10%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0) 70%);
  opacity: 0.6;
  z-index: -1;
  animation: glow-pulse 1.5s ease-in-out infinite alternate;
  pointer-events: none;
}

.logo-mark.leaving::before {
  animation: glow-fade 0.5s ease forwards;
}

.logo-mark.leaving {
  animation: mark-leave 0.5s cubic-bezier(0.4, 0, 0.6, 1) forwards;
}

.logo-mark img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

@keyframes mark-pop {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.3);
  }
  100% {
    opacity: 0.9;
    transform: translate(-50%, -50%) scale(1);
  }
}

@keyframes mark-leave {
  0% {
    opacity: 0.9;
    transform: translate(-50%, -50%) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.5);
  }
}

@keyframes glow-pulse {
  0% { opacity: 0.35; transform: scale(1); }
  100% { opacity: 0.7; transform: scale(1.15); }
}

@keyframes glow-fade {
  0% { opacity: 0.6; transform: scale(1.1); }
  100% { opacity: 0; transform: scale(0.8); }
}
</style>
