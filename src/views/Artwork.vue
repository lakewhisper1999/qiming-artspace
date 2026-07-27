<template>
  <div class="artwork-page">
    <!-- 页面头部：SECTION 标签 + 大标题 + 操作按钮（参考截图排版） -->
    <section class="page-header">
      <div class="container">
        <span class="section-label">SECTION</span>
        <h1 class="page-title">{{ pageTitleLine1 }}<br/>{{ pageTitleLine2 }}</h1>
        <div class="header-actions">
          <button class="header-btn">{{ headerBtnText }}</button>
        </div>
      </div>
    </section>

    <section class="artwork-section">
      <div class="container">
        <div class="filter-bar">
          <button
            v-for="cat in categories"
            :key="cat"
            class="filter-btn"
            :class="{ active: activeCategory === cat }"
            @click="selectCategory(cat)"
          >{{ cat }}</button>
        </div>
      </div>

      <div class="grid-wide">
        <div class="artwork-grid">
          <ArtworkCard
            v-for="art in filteredArtworks"
            :key="art.id"
            :artwork="art"
            @view="handleView"
            @download="handleDownload"
          />
        </div>

        <div v-if="filteredArtworks.length === 0" class="empty">
          <p>该分类下暂无作品。</p>
        </div>
      </div>
    </section>

    <ImageLightbox
      v-model:visible="lightboxVisible"
      :media-list="lightboxMediaList"
      :image-url="lightboxArtwork?.coverUrl"
      :title="lightboxArtwork?.title"
    />

    <!-- 视频作品播放弹窗：B站/YouTube 嵌入 iframe -->
    <div v-if="videoModalVisible" class="video-modal" @click.self="videoModalVisible = false">
      <button class="video-modal-close" @click="videoModalVisible = false" aria-label="关闭">×</button>
      <div class="video-modal-frame">
        <iframe
          :src="videoEmbedUrl"
          frameborder="0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowfullscreen
        ></iframe>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ArtworkCard from '../components/ArtworkCard.vue'
import ImageLightbox from '../components/ImageLightbox.vue'
// 本地 mock 数据：当后端不可用时（如纯静态部署）兜底展示
import { artworks as mockArtworks, categories as mockCategories } from '../mock/artworks'
// 静态部署数据加载器：优先读 public/data/works.json（真实作品）
import { getArtworks, getCategories } from '../data/works'

const route = useRoute()
const router = useRouter()

/** 后端数据（原始列表） */
const artworks = ref([])
const categoryList = ref([])
const loading = ref(true)

const activeCategory = ref(route.query.category || '全部')
const lightboxVisible = ref(false)
const lightboxArtwork = ref(null)
const lightboxMediaList = ref([])
const videoModalVisible = ref(false)
const videoEmbedUrl = ref('')


/** 格式化日期：ISO → "2025.08" */
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}.${m}`
}

/** 将后端 Artwork 映射为前端 ArtworkCard 期望的字段 */
const mapArtwork = (a) => ({
  id: a.id,
  title: a.title,
  description: a.description,
  coverUrl: a.coverUrl,
  imageUrls: a.imageUrls,
  category: a.categoryName || '未分类',
  date: formatDate(a.createdAt),
  viewCount: a.viewCount || 0,
  downloadUrl: a.downloadUrl,
  fileSize: a.fileSize,
  downloadCount: a.downloadCount || 0,
  categoryId: a.categoryId,
  videoEmbed: a.videoEmbed || null,
})

/** 页面加载：优先用真实数据 works.json，失败回退 mock */
onMounted(async () => {
  try {
    const [arts, cats] = await Promise.all([getArtworks(), getCategories()])
    if (arts && arts.length) {
      artworks.value = arts.map(mapArtwork)
      categoryList.value = cats && cats.length ? cats : (mockCategories
        .filter(name => name !== '全部')
        .map(name => ({ name })))
      return
    }
    throw new Error('empty')
  } catch (e) {
    // 真实数据不可用（未导出 / 未部署）时回退到本地 mock，保证页面不空白
    console.warn('[Artwork] 真实数据不可用，回退 mock', e)
    artworks.value = mockArtworks.map(a => ({
      ...a,
      imageUrls: null,
      categoryId: null,
    }))
    categoryList.value = mockCategories
      .filter(name => name !== '全部')
      .map(name => ({ name }))
  } finally {
    loading.value = false
  }
})

/** 筛选栏选项：'全部' + 后端分类名列表（排除图文笔记，图文笔记在 /article 页面） */
const categories = computed(() => {
  return ['全部', ...categoryList.value.filter(c => c.name !== '图文笔记').map(c => c.name)]
})

/** 页面标题 */
const pageTitleLine1 = computed(() => {
  if (activeCategory.value === '全部') return '作品集'
  return activeCategory.value
})
const pageTitleLine2 = computed(() => {
  const map = {
    '全部': '美术资源',
    '平面及动效作品': '2024–2026',
    '素材库': '',
    '学习工程': '',
    '图文笔记': '',
  }
  return map[activeCategory.value] || ''
})

/** 顶部按钮文案 */
const headerBtnText = computed(() => {
  if (loading.value) return '加载中...'
  return filteredArtworks.value.length > 0
    ? `${filteredArtworks.value.length} 件作品`
    : '暂无完整资源'
})

/** 按分类名过滤（匹配 categoryName） */
const filteredArtworks = computed(() =>
  activeCategory.value === '全部'
    ? artworks.value
    : artworks.value.filter(a => a.category === activeCategory.value)
)

const selectCategory = (cat) => {
  activeCategory.value = cat
  router.replace({ query: { ...route.query, category: cat } })
}

// 仅允许 B站/YouTube 官方嵌入地址，防止 XSS / 恶意站点的 iframe 注入
const isSafeEmbed = (url) =>
  /^https?:\/\/(player\.)?bilibili\.com\/player\.html/i.test(url) ||
  /^https?:\/\/www\.youtube\.com\/embed\//i.test(url)

const handleView = async (artwork) => {
  // 视频作品：直接打开 B站/YouTube 嵌入播放器
  if (artwork?.videoEmbed && isSafeEmbed(artwork.videoEmbed)) {
    videoEmbedUrl.value = artwork.videoEmbed
    videoModalVisible.value = true
    return
  }
  const cover = artwork?.coverUrl
  if (!cover) {
    alert('该资源暂无可预览内容。')
    return
  }

  // 调用详情接口触发后端浏览量 +1
  try {
    await fetch(`/api/public/artworks/${artwork.id}`)
  } catch (e) {
    console.warn('[Artwork] 浏览量统计接口失败', e)
  }

  // 解析多图列表：coverUrl + imageUrls(JSON数组)
  let extraImages = []
  if (artwork.imageUrls) {
    try {
      const parsed = JSON.parse(artwork.imageUrls)
      if (Array.isArray(parsed)) extraImages = parsed
    } catch { /* ignore */ }
  }
  const fullList = [cover, ...extraImages]
  const isMedia = fullList.some(url =>
    /\.(png|jpe?g|gif|webp|avif|svg|mp4|webm|ogg|mov|avi)$/i.test(url)
  )
  if (!isMedia) {
    alert('该资源暂不支持预览。')
    return
  }
  lightboxArtwork.value = artwork
  lightboxMediaList.value = fullList
  lightboxVisible.value = true
}

const handleDownload = (artwork) => {
  const url = artwork.downloadUrl
  if (!url) {
    console.warn('[Artwork] 该资源暂无可下载文件:', artwork.title)
    alert('该作品暂未提供下载资源。')
    return
  }
  console.log('[Artwork] 下载触发:', artwork.title, url)
  window.open(url, '_blank')
}

watch(() => route.query.category, (newCat) => {
  activeCategory.value = newCat || '全部'
})
</script>

<style scoped>
/* ===== 页面基底 ===== */
.artwork-page {
  min-height: 100vh;
  padding-bottom: 120px;
  background: var(--artwork-bg);
  color: var(--text);
}

/* ===== 页面头部（参考截图排版） ===== */
.page-header {
  padding: 7rem 0 3rem;
  text-align: left;
  background: var(--artwork-bg);
}

.section-label {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.12em;
  color: var(--text-secondary);
  opacity: 0.5;
  text-transform: uppercase;
  margin-bottom: 1rem;
}

.page-title {
  font-size: clamp(2.25rem, 5vw, 3.25rem);
  color: var(--text);
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.15;
  margin-bottom: 2rem;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.header-btn {
  padding: 0.7rem 2rem;
  border-radius: 999px;
  border: none;
  background: #1a1a1a;
  color: #fff;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.header-btn:hover {
  background: #333;
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.18);
}

/* ===== 作品区域 ===== */
.artwork-section {
  padding: 2.5rem 0;
}

/* 宽排版容器，让瀑布流铺满更多横向空间 */
.grid-wide {
  width: 96vw;
  max-width: 1600px;
  margin: 0 auto;
}

/* ===== 筛选栏 ===== */
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: center;
  margin-bottom: 3rem;
}

.filter-btn {
  padding: 0.6rem 1.4rem;
  border-radius: 999px;
  border: 1px solid rgba(0,0,0,0.08);
  background: rgba(255,255,255,0.55);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.filter-btn:hover {
  background: rgba(255,255,255,0.85);
  border-color: rgba(0,0,0,0.15);
  color: var(--text);
  transform: translateY(-1px);
}

.filter-btn.active {
  background: var(--text);
  color: var(--surface);
  border-color: var(--text);
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
}

/* ===== 排版网格（行优先：从左到右、从上到下） ===== */
.artwork-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

/* ===== 空状态 ===== */
.empty {
  text-align: center;
  color: var(--text-secondary);
  opacity: 0.5;
  padding: 5rem 0;
  font-size: 1.05rem;
}

/* ===== 视频播放弹窗 ===== */
.video-modal {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0,0,0,0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}
.video-modal-close {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: rgba(255,255,255,0.15);
  color: #fff;
  font-size: 1.6rem;
  line-height: 1;
  cursor: pointer;
  transition: background 0.25s ease;
}
.video-modal-close:hover { background: rgba(255,255,255,0.3); }
.video-modal-frame {
  width: min(1000px, 100%);
  aspect-ratio: 16/9;
  background: #000;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 24px 80px rgba(0,0,0,0.5);
}
.video-modal-frame iframe {
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
}

/* ===== 响应式 ===== */
@media (max-width: 1024px) {
  .artwork-grid {
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 1.2rem;
  }
}

@media (max-width: 640px) {
  .artwork-grid {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 1rem;
  }
  .page-title { font-size: 1.8rem; }
  .filter-btn { padding: 0.5rem 1.1rem; font-size: 0.85rem; }
}
</style>
