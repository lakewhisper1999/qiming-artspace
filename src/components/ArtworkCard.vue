<template>
  <div class="artwork-card" @mouseenter="hover = true" @mouseleave="hover = false">
    <div class="card-image">
      <img v-if="isImage" :src="artwork.coverUrl" :alt="artwork.title" loading="lazy" />
      <video
        v-else-if="isVideo"
        :src="artwork.coverUrl"
        class="card-video"
        loading="lazy"
        preload="metadata"
        muted
        loop
        @mouseenter="playVideo"
        @mouseleave="pauseVideo"
      ></video>
      <div v-else class="card-image-placeholder"></div>
      <div v-if="isEmbedVideo" class="card-play-badge" @click.stop="$emit('view', artwork)">
        <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor">
          <path d="M8 5v14l11-7z"/>
        </svg>
      </div>
      <div class="card-overlay" :class="{ active: hover }">
        <div class="card-actions">
          <button class="card-action" title="查看详情" @click.stop="$emit('view', artwork)">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
          </button>
          <button class="card-action card-action-download" title="下载资源" @click.stop="$emit('download', artwork)">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
    <div class="card-body">
      <span class="card-category">{{ artwork.category }}</span>
      <h3 class="card-title">{{ artwork.title }}</h3>
      <p class="card-desc">{{ artwork.description }}</p>
      <div class="card-meta">
        <span class="card-date">{{ artwork.date }}</span>
        <span class="card-views">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
          </svg>
          {{ artwork.viewCount }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({ artwork: { type: Object, required: true } })
const emit = defineEmits(['view', 'download'])
const hover = ref(false)

const isImage = computed(() => {
  if (!props.artwork?.coverUrl) return false
  return /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(props.artwork.coverUrl)
})
const isVideo = computed(() => {
  if (!props.artwork?.coverUrl) return false
  return /\.(mp4|webm|ogg|mov)$/i.test(props.artwork.coverUrl)
})
const isEmbedVideo = computed(() => !!props.artwork?.videoEmbed)

function playVideo(e) {
  const video = e.target
  if (video && video.tagName === 'VIDEO') {
    video.playbackRate = 1.0
    video.play().catch(() => {})
  }
}
function pauseVideo(e) {
  const video = e.target
  if (video && video.tagName === 'VIDEO') {
    video.pause()
    video.currentTime = 0
  }
}
</script>

<style scoped>
.artwork-card {
  background: var(--surface);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.45s ease;
  cursor: pointer;
  border: 1px solid rgba(0,0,0,0.06);
}
.artwork-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.08);
}
.card-image {
  position: relative;
  overflow: hidden;
  aspect-ratio: 3/2;
  background: #eae5d8;
}
.card-image img,
.card-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}
.card-image-placeholder {
  width: 100%;
  height: 100%;
  background: #eae5d8;
}
.card-play-badge {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(255,255,255,0.92);
  color: #1a1a1a;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 6px 24px rgba(0,0,0,0.18);
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), background 0.25s ease;
  z-index: 2;
}
.card-play-badge:hover {
  transform: translate(-50%, -50%) scale(1.1);
  background: #fff;
}
.artwork-card:hover .card-image img { transform: scale(1.04); }
.artwork-card:hover .card-video { transform: scale(1.04); }
.artwork-card:hover .card-image img { transform: scale(1.04); }
.card-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.35s ease;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}
.card-overlay.active { opacity: 1; }
.card-actions {
  display: flex;
  gap: 12px;
}
.card-action {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255,255,255,0.95);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text);
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), background 0.25s ease, color 0.25s ease;
}
.card-action:hover {
  transform: scale(1.12);
  background: var(--surface);
}
.card-action-download {
  background: rgba(255,255,255,0.9);
  color: var(--text);
}
.card-action-download:hover {
  background: var(--text);
  color: var(--surface);
}
.card-body { padding: 1.25rem 1.3rem; }
.card-category {
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--text-secondary);
  background: var(--bg);
  padding: 0.3rem 0.7rem;
  border-radius: 999px;
  margin-bottom: 0.6rem;
  border: 1px solid rgba(0,0,0,0.06);
}
.card-title {
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 0.4rem;
  letter-spacing: -0.01em;
  line-height: 1.3;
}
.card-desc {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 0.9rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  color: var(--text-secondary);
  opacity: 0.6;
}
.card-views { display: flex; align-items: center; gap: 4px; }
</style>
