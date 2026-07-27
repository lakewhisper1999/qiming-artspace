<template>
  <Transition name="lightbox" appear>
    <div
      v-if="visible"
      class="lightbox-overlay"
      role="dialog"
      aria-modal="true"
      @click="handleBackdropClick"
    >
      <button
        class="lightbox-close"
        aria-label="关闭预览"
        @click.stop="close"
      >
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>

      <!-- 左右导航箭头 -->
      <button
        v-if="mediaList.length > 1"
        class="lightbox-nav lightbox-prev"
        aria-label="上一张"
        @click.stop="prev"
      >
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
      <button
        v-if="mediaList.length > 1"
        class="lightbox-nav lightbox-next"
        aria-label="下一张"
        @click.stop="next"
      >
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>

      <div class="lightbox-stage" @click.stop>
        <img
          v-if="currentMedia && isImage(currentMedia)"
          :key="currentIndex"
          :src="currentMedia"
          :alt="title"
          class="lightbox-image"
          @load="loaded = true"
          @error="loaded = true"
        />
        <video
          v-else-if="currentMedia && isVideo(currentMedia)"
          :key="currentIndex"
          :src="currentMedia"
          class="lightbox-video"
          controls
          autoplay
          @loadeddata="loaded = true"
          @error="loaded = true"
        />
        <div v-if="!loaded" class="lightbox-loader">
          <span class="loader-dot"></span>
          <span class="loader-dot"></span>
          <span class="loader-dot"></span>
        </div>
      </div>

      <div class="lightbox-footer">
        <div v-if="title" class="lightbox-caption">
          <span class="lightbox-title">{{ title }}</span>
        </div>
        <div v-if="mediaList.length > 1" class="lightbox-counter">
          <span class="counter-current">{{ currentIndex + 1 }}</span>
          <span class="counter-divider">/</span>
          <span class="counter-total">{{ mediaList.length }}</span>
        </div>
        <!-- 缩略图指示器 -->
        <div v-if="mediaList.length > 1 && mediaList.length <= 8" class="lightbox-thumbs">
          <button
            v-for="(url, i) in mediaList"
            :key="i"
            class="thumb-dot"
            :class="{ active: i === currentIndex }"
            @click.stop="goTo(i)"
          >
            <img v-if="isImage(url)" :src="url" alt="" />
            <span v-else class="thumb-video-icon">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            </span>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  mediaList: { type: Array, default: () => [] },
  imageUrl: { type: String, default: '' },
  title: { type: String, default: '' }
})

const emit = defineEmits(['update:visible', 'close'])
const loaded = ref(false)
const currentIndex = ref(0)

const resolvedList = computed(() => {
  if (props.mediaList && props.mediaList.length > 0) return props.mediaList
  if (props.imageUrl) return [props.imageUrl]
  return []
})

const currentMedia = computed(() => resolvedList.value[currentIndex.value] || '')

function isImage(url) {
  return /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(url)
}
function isVideo(url) {
  return /\.(mp4|webm|ogg|mov|avi)$/i.test(url)
}

const close = () => {
  emit('update:visible', false)
  emit('close')
}

const handleBackdropClick = () => close()

const prev = () => {
  if (resolvedList.value.length <= 1) return
  loaded.value = false
  currentIndex.value = (currentIndex.value - 1 + resolvedList.value.length) % resolvedList.value.length
}
const next = () => {
  if (resolvedList.value.length <= 1) return
  loaded.value = false
  currentIndex.value = (currentIndex.value + 1) % resolvedList.value.length
}
const goTo = (i) => {
  if (i === currentIndex.value) return
  loaded.value = false
  currentIndex.value = i
}

const handleKeydown = (e) => {
  if (!props.visible) return
  if (e.key === 'Escape') close()
  else if (e.key === 'ArrowLeft') prev()
  else if (e.key === 'ArrowRight') next()
}

watch(() => props.visible, (val) => {
  if (val) {
    loaded.value = false
    currentIndex.value = 0
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

onMounted(() => document.addEventListener('keydown', handleKeydown))
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})
</script>

<style scoped>
.lightbox-overlay {
  position: fixed;
  inset: 0;
  z-index: 99999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.62);
  backdrop-filter: blur(18px) saturate(160%);
  -webkit-backdrop-filter: blur(18px) saturate(160%);
  padding: 2rem;
  cursor: zoom-out;
}

.lightbox-stage {
  position: relative;
  max-width: 92vw;
  max-height: 78vh;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: default;
}

.lightbox-image,
.lightbox-video {
  max-width: 92vw;
  max-height: 78vh;
  object-fit: contain;
  border-radius: 12px;
  box-shadow: 0 32px 80px rgba(0, 0, 0, 0.35);
}

.lightbox-image {
  opacity: 0;
  transform: scale(0.96);
  transition: opacity 0.4s ease, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.lightbox-image[src] {
  opacity: 1;
  transform: scale(1);
}

.lightbox-close {
  position: absolute;
  top: 24px;
  right: 24px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.92);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.25s ease, transform 0.25s ease;
  z-index: 10;
}
.lightbox-close:hover {
  background: rgba(255, 255, 255, 0.22);
  transform: rotate(90deg);
}

.lightbox-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.25s ease, transform 0.25s ease;
  z-index: 10;
}
.lightbox-nav:hover {
  background: rgba(255, 255, 255, 0.22);
  transform: translateY(-50%) scale(1.08);
}
.lightbox-prev { left: 24px; }
.lightbox-next { right: 24px; }

.lightbox-footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-top: 1.25rem;
}

.lightbox-caption {
  padding: 0.5rem 1.2rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.9rem;
  font-weight: 500;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.lightbox-counter {
  display: flex;
  align-items: center;
  gap: 4px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.82rem;
  font-variant-numeric: tabular-nums;
}
.counter-current { color: rgba(255, 255, 255, 0.95); font-weight: 600; }
.counter-divider { opacity: 0.4; }

.lightbox-thumbs {
  display: flex;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.thumb-dot {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  border: 2px solid transparent;
  overflow: hidden;
  cursor: pointer;
  padding: 0;
  background: rgba(255, 255, 255, 0.08);
  transition: border-color 0.2s, transform 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.thumb-dot img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.thumb-dot.active {
  border-color: rgba(255, 255, 255, 0.9);
  transform: scale(1.1);
}
.thumb-video-icon {
  color: rgba(255, 255, 255, 0.7);
}
.thumb-dot:hover {
  border-color: rgba(255, 255, 255, 0.5);
}

.lightbox-loader {
  position: absolute;
  display: flex;
  gap: 8px;
}
.loader-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.7);
  animation: loader-bounce 1.2s infinite ease-in-out both;
}
.loader-dot:nth-child(1) { animation-delay: -0.32s; }
.loader-dot:nth-child(2) { animation-delay: -0.16s; }

@keyframes loader-bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

.lightbox-enter-active,
.lightbox-leave-active {
  transition: opacity 0.35s ease, backdrop-filter 0.35s ease;
}
.lightbox-enter-from,
.lightbox-leave-to {
  opacity: 0;
  backdrop-filter: blur(0px);
}

@media (max-width: 640px) {
  .lightbox-overlay { padding: 1rem; }
  .lightbox-close { top: 16px; right: 16px; width: 44px; height: 44px; }
  .lightbox-nav { width: 44px; height: 44px; }
  .lightbox-prev { left: 12px; }
  .lightbox-next { right: 12px; }
  .lightbox-stage { max-height: 70vh; }
  .lightbox-image, .lightbox-video { max-height: 70vh; }
}
</style>
