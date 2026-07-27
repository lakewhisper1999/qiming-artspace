<template>
  <div class="article-page">
    <!-- 页面头部 -->
    <section class="page-header">
      <div class="container">
        <span class="section-label">NOTES</span>
        <h1 class="page-title">图文<br/>笔记</h1>
        <div class="header-actions">
          <button class="header-btn">{{ headerBtnText }}</button>
        </div>
      </div>
    </section>

    <!-- 分类筛选：本页为图文笔记专属页，仅保留一个静态标签 -->
    <section class="article-section">
      <div class="container">
        <div class="filter-bar filter-bar--single">
          <button class="filter-btn active">图文笔记</button>
        </div>
      </div>

      <!-- 文章列表 -->
      <div class="grid-wide">
        <!-- 加载中 -->
        <div v-if="loading" class="loading-state">
          <div v-for="i in 6" :key="i" class="skeleton-card"></div>
        </div>

        <!-- 空状态 -->
        <div v-else-if="articles.length === 0" class="empty">
          <p>该分类下暂无图文内容。</p>
        </div>

        <!-- 文章卡片列表 -->
        <div v-else class="article-grid">
          <div
            v-for="art in articles"
            :key="art.id"
            class="article-card"
            @click="openDetail(art)"
          >
            <div v-if="art.coverUrl" class="card-cover">
              <img :src="resolveUrl(art.coverUrl)" :alt="art.title" loading="lazy" @error="$event.target.src=''" />
            </div>
            <div class="card-cover card-cover--placeholder" v-else>
              <span class="placeholder-icon">✎</span>
            </div>
            <div class="card-body">
              <div class="card-meta">
                <span class="card-category">{{ art.categoryName || '笔记' }}</span>
                <span class="card-date">{{ formatDate(art.createdAt) }}</span>
              </div>
              <h3 class="card-title">{{ art.title }}</h3>
              <p class="card-excerpt">{{ art.excerpt }}</p>
              <div class="card-footer">
                <span class="view-count">{{ art.viewCount || 0 }} 次阅读</span>
                <span class="read-more">阅读全文 →</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 分页 -->
        <div v-if="total > pageSize && !loading" class="pagination">
          <button
            class="page-btn"
            :disabled="page <= 1"
            @click="loadPage(page - 1)"
          >← 上一页</button>
          <span class="page-info">{{ page }} / {{ Math.ceil(total / pageSize) }}</span>
          <button
            class="page-btn"
            :disabled="page >= Math.ceil(total / pageSize)"
            @click="loadPage(page + 1)"
          >下一页 →</button>
        </div>
      </div>
    </section>

    <!-- 详情弹窗 -->
    <Transition name="modal-fade">
      <div v-if="detailVisible" class="modal-overlay" @click.self="closeDetail">
        <div class="modal-box">
          <button class="modal-close" @click="closeDetail">✕</button>
          <div v-if="detailLoading" class="modal-loading">加载中…</div>
          <div v-else-if="detail" class="modal-content">
            <div v-if="detail.coverUrl" class="modal-cover">
              <img :src="resolveUrl(detail.coverUrl)" :alt="detail.title" @error="$event.target.style.display='none'" />
            </div>
            <div class="modal-meta">
              <span class="card-category">{{ detail.categoryName || '笔记' }}</span>
              <span class="card-date">{{ formatDate(detail.createdAt) }}</span>
              <span class="view-count">{{ detail.viewCount || 0 }} 次阅读</span>
            </div>
            <h2 class="modal-title">{{ detail.title }}</h2>
            <!-- 渲染富文本 / HTML 内容 -->
            <div class="modal-body" v-html="detail.content"></div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getArticles } from '../data/works'

// —— 状态 ——
const articles     = ref([])
const allArticles = ref([])
const categoryList = ref([])
const loading     = ref(true)
const total       = ref(0)
const page        = ref(1)
const pageSize    = 12
const activeCategoryId = ref(null)

const detailVisible = ref(false)
const detailLoading = ref(false)
const detail        = ref(null)

// —— 工具 ——
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`
}

const makeExcerpt = (content) => {
  if (!content) return ''
  // 去掉 HTML 标签后截取前 80 字
  const text = content.replace(/<[^>]+>/g, '')
  return text.length > 80 ? text.slice(0, 80) + '…' : text
}

// 本地 mock 图文：后端不可用时（纯静态部署）兜底展示
const mockArticles = [
  {
    id: 101,
    title: '从零搭建个人作品集网站的思考',
    categoryName: '图文笔记',
    createdAt: '2026-03-12T10:00:00',
    viewCount: 1280,
    coverUrl: 'https://picsum.photos/seed/note1/600/400',
    content: '<p>做一个作品集网站，最重要的不是技术栈，而是「你想让谁来读」。</p><p>先确定受众，再决定信息架构，最后才是视觉。本文记录我从空白页到上线的全过程。</p>',
  },
  {
    id: 102,
    title: '配色不是玄学：我的 3 条实用原则',
    categoryName: '图文笔记',
    createdAt: '2026-02-20T14:30:00',
    viewCount: 2034,
    coverUrl: 'https://picsum.photos/seed/note2/600/400',
    content: '<p>1. 限制主色数量；2. 用中性色托底；3. 留白即设计。</p><p>掌握这三条，大部分页面都不会丑。</p>',
  },
  {
    id: 103,
    title: '动效的克制：什么时候不该加动画',
    categoryName: '图文笔记',
    createdAt: '2026-01-08T09:15:00',
    viewCount: 1760,
    coverUrl: 'https://picsum.photos/seed/note3/600/400',
    content: '<p>动画是调味料，不是主菜。当页面信息密度高时，多余的动效只会分散注意力。</p>',
  },
]

/** 将 /uploads/ 相对路径解析为可访问的完整 URL */
const resolveUrl = (url) => {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  if (url.startsWith('/uploads/')) return `http://localhost:8088${url}`
  return url
}

// —— 数据加载 ——
const loadArticles = async () => {
  loading.value = true
  try {
    const list = await getArticles()
    allArticles.value = (list && list.length)
      ? list.map(a => ({ ...a, excerpt: makeExcerpt(a.content) }))
      : []
    if (!allArticles.value.length) throw new Error('empty')
  } catch (e) {
    // 真实数据不可用（未导出 / 未部署）时回退到本地 mock，保证页面不空白
    console.warn('[Article] 真实数据不可用，回退 mock', e)
    allArticles.value = mockArticles.map(a => ({ ...a, excerpt: makeExcerpt(a.content) }))
  } finally {
    loading.value = false
  }
  applyPage()
}

// 客户端分页：从已加载列表中截取当前页
const applyPage = () => {
  const start = (page.value - 1) * pageSize
  articles.value = allArticles.value.slice(start, start + pageSize)
  total.value = allArticles.value.length
}

const loadCategories = async () => {
  try {
    const res  = await fetch('/api/public/categories')
    const json = await res.json()
    categoryList.value = json.data || []
  } catch (e) {
    console.warn('[Article] 分类加载失败', e)
  }
}

onMounted(async () => {
  await Promise.all([loadArticles(), loadCategories()])
})

// —— 交互 ——
const selectCategory = (id) => {
  activeCategoryId.value = id
  page.value = 1
  loadArticles()
}

const loadPage = (p) => {
  page.value = p
  applyPage()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const openDetail = async (art) => {
  detailVisible.value = true
  detailLoading.value = false
  detail.value = art
}

const closeDetail = () => {
  detailVisible.value = false
  detail.value = null
}

// —— 计算属性 ——
const headerBtnText = computed(() => {
  if (loading.value) return '加载中...'
  return total.value > 0 ? `${total.value} 篇笔记` : '暂无内容'
})
</script>

<style scoped>
/* ===== 页面基底 ===== */
.article-page {
  min-height: 100vh;
  padding-bottom: 120px;
  background: var(--artwork-bg);
  color: var(--text);
}

/* ===== 页面头部 ===== */
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

.header-actions { display: flex; gap: 1rem; }

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

/* ===== 内容区 ===== */
.article-section { padding: 2.5rem 0; }

.container {
  width: min(92%, 1400px);
  margin: 0 auto;
}

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

/* ===== 文章列表（行优先 grid） ===== */
.article-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

/* ===== 文章卡片 ===== */
.article-card {
  background: rgba(255,255,255,0.65);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  flex-direction: column;
}
.article-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 40px rgba(0,0,0,0.12);
  border-color: rgba(0,0,0,0.12);
}

/* 封面图 */
.card-cover {
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: rgba(0,0,0,0.04);
}
.card-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.article-card:hover .card-cover img {
  transform: scale(1.04);
}
.card-cover--placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(0,0,0,0.03), rgba(0,0,0,0.06));
}
.placeholder-icon {
  font-size: 2.5rem;
  opacity: 0.25;
}

/* 卡片内容 */
.card-body {
  padding: 1.2rem 1.4rem 1.4rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.card-category {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-secondary);
  background: rgba(0,0,0,0.05);
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
}
.card-date {
  font-size: 0.78rem;
  color: var(--text-secondary);
  opacity: 0.6;
}

.card-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text);
  line-height: 1.35;
  margin: 0;
}

.card-excerpt {
  font-size: 0.88rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  padding-top: 0.6rem;
  border-top: 1px solid rgba(0,0,0,0.05);
}
.view-count {
  font-size: 0.78rem;
  color: var(--text-secondary);
  opacity: 0.55;
}
.read-more {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text);
  opacity: 0.7;
  transition: opacity 0.2s;
}
.article-card:hover .read-more {
  opacity: 1;
}

/* ===== 骨架屏 ===== */
.loading-state {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}
.skeleton-card {
  height: 320px;
  border-radius: 16px;
  background: linear-gradient(90deg,
    rgba(0,0,0,0.04) 25%,
    rgba(0,0,0,0.08) 50%,
    rgba(0,0,0,0.04) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ===== 空状态 ===== */
.empty {
  text-align: center;
  color: var(--text-secondary);
  opacity: 0.5;
  padding: 5rem 0;
  font-size: 1.05rem;
}

/* ===== 分页 ===== */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1.5rem;
  margin-top: 3rem;
}
.page-btn {
  padding: 0.6rem 1.4rem;
  border-radius: 999px;
  border: 1px solid rgba(0,0,0,0.1);
  background: rgba(255,255,255,0.6);
  backdrop-filter: blur(8px);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.25s ease;
}
.page-btn:hover:not(:disabled) {
  background: var(--text);
  color: var(--surface);
  transform: translateY(-1px);
}
.page-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.page-info {
  font-size: 0.88rem;
  color: var(--text-secondary);
}

/* ===== 详情弹窗 ===== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem 1rem;
  overflow-y: auto;
}
.modal-box {
  position: relative;
  background: var(--surface, #fdfcf8);
  border-radius: 20px;
  width: min(90vw, 760px);
  max-height: 85vh;
  overflow-y: auto;
  padding: 2.5rem 2.5rem 3rem;
  box-shadow: 0 32px 80px rgba(0,0,0,0.2);
}
.modal-close {
  position: absolute;
  top: 1.2rem;
  right: 1.4rem;
  width: 2rem;
  height: 2rem;
  border: none;
  background: rgba(0,0,0,0.06);
  border-radius: 50%;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}
.modal-close:hover { background: rgba(0,0,0,0.12); }

.modal-loading {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
  opacity: 0.6;
}
.modal-cover {
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 1.5rem;
}
.modal-cover img {
  width: 100%;
  max-height: 360px;
  object-fit: cover;
}
.modal-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}
.modal-title {
  font-size: clamp(1.4rem, 3vw, 2rem);
  font-weight: 700;
  color: var(--text);
  margin: 0 0 1.5rem;
  line-height: 1.2;
}
.modal-body {
  font-size: 1rem;
  line-height: 1.8;
  color: var(--text-secondary);
  white-space: pre-wrap; /* 保留 textarea 中的换行与段落 */
}
.modal-body :deep(img) { max-width: 100%; border-radius: 8px; margin: 1rem 0; }
.modal-body :deep(h1),
.modal-body :deep(h2),
.modal-body :deep(h3) { color: var(--text); margin: 1.5rem 0 0.75rem; }
.modal-body :deep(p) { margin: 0 0 1rem; }
.modal-body :deep(code) {
  background: rgba(0,0,0,0.06);
  padding: 0.1em 0.4em;
  border-radius: 4px;
  font-size: 0.9em;
}
.modal-body :deep(pre) {
  background: rgba(0,0,0,0.04);
  padding: 1rem;
  border-radius: 8px;
  overflow-x: auto;
}

/* ===== 弹窗动画 ===== */
.modal-fade-enter-active { animation: modal-in 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.modal-fade-leave-active { animation: modal-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) reverse; }
@keyframes modal-in {
  from { opacity: 0; transform: scale(0.94) translateY(12px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}

/* ===== 响应式 ===== */
@media (max-width: 1024px) {
  .article-grid {
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 1.2rem;
  }
  .loading-state { grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); }
}
@media (max-width: 640px) {
  .article-grid {
    grid-template-columns: 1fr 1fr;
    gap: 0.9rem;
  }
  .loading-state { grid-template-columns: 1fr 1fr; }
  .page-title { font-size: 1.8rem; }
  .modal-box { padding: 1.8rem 1.5rem 2rem; }
  .card-body { padding: 1rem 1rem 1.2rem; }
}
@media (max-width: 420px) {
  .article-grid { grid-template-columns: 1fr; }
}
</style>
