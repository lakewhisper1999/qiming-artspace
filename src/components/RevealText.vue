<template>
  <component :is="tag" class="reveal-text" :aria-label="text">
    <span
      v-for="(ch, i) in chars"
      :key="i"
      class="reveal-char"
      :style="{ animationDelay: (delay + i * 0.04) + 's' }"
      aria-hidden="true"
    >{{ ch === ' ' ? '\u00A0' : ch }}</span>
  </component>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  text: { type: String, required: true },
  tag: { type: String, default: 'span' },
  delay: { type: Number, default: 0 }
})

// 用 Array.from 正确处理中文/emoji 等多字节字符
const chars = computed(() => Array.from(props.text))
</script>

<style scoped>
.reveal-char {
  display: inline-block;
  opacity: 0;
  transform: translateY(0.5em) rotateX(-40deg);
  transform-origin: bottom;
  animation: revealChar 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  will-change: transform, opacity;
}

@keyframes revealChar {
  to {
    opacity: 1;
    transform: translateY(0) rotateX(0);
  }
}

/* 尊重系统「减少动态效果」偏好 */
@media (prefers-reduced-motion: reduce) {
  .reveal-char {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
</style>
