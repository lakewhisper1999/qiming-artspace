<template>
  <div class="collab-page">
    <!-- 页面头部 -->
    <section class="page-header">
      <div class="container">
        <RevealText tag="span" class="section-label" text="COLLAB" />
        <RevealText tag="h1" class="page-title" text="协作 · 进度" />
        <p class="page-desc">
          基于 GitHub Issues 的协作与进度管理。查看需求状态、提交新需求、浏览协作文档。
        </p>

        <!-- 数据源状态条 -->
        <div class="source-bar" :class="source">
          <span class="dot"></span>
          <span v-if="source === 'live'">实时数据 · 来自 GitHub API</span>
          <span v-else-if="source === 'snapshot'">快照数据 · 本地兜底（生成于 {{ fmtDate(lastUpdated) }}）</span>
          <span v-else>加载中…</span>
          <button class="reload-btn" :disabled="loading" @click="load">↻ 刷新</button>
        </div>
      </div>
    </section>

    <!-- Tab 切换 -->
    <section class="tabs-section">
      <div class="container">
        <div class="tabs">
          <button class="tab" :class="{ active: activeTab === 'board' }" @click="activeTab = 'board'">📊 进度看板</button>
          <button class="tab" :class="{ active: activeTab === 'submit' }" @click="activeTab = 'submit'">➕ 提交需求</button>
          <button class="tab" :class="{ active: activeTab === 'docs' }" @click="activeTab = 'docs'">📚 协作文档</button>
        </div>
      </div>
    </section>

    <div class="container">
      <!-- ========== 看板 ========== -->
      <div v-show="activeTab === 'board'" class="panel">
        <!-- 统计 + 过滤 -->
        <div v-if="!loading && !error" class="board-top">
          <div class="stats">
            <div class="stat"><b>{{ stats.total }}</b><span>需求总数</span></div>
            <div class="stat open"><b>{{ stats.open }}</b><span>待处理</span></div>
            <div class="stat done"><b>{{ stats.closed }}</b><span>已关闭</span></div>
          </div>
          <div class="filters">
            <button class="chip" :class="{ on: !filterLabel }" @click="filterLabel = ''">全部</button>
            <button
              v-for="f in topLabels"
              :key="f.label"
              class="chip"
              :class="{ on: filterLabel === f.label }"
              :style="labelStyle(f.label)"
              @click="filterLabel = filterLabel === f.label ? '' : f.label"
            >{{ f.label }} <i>{{ f.count }}</i></button>
          </div>
        </div>

        <!-- 加载 / 错误 / 空 -->
        <div v-if="loading" class="state">⏳ 正在拉取 Issues…</div>
        <div v-else-if="error" class="state error">⚠ {{ error }}</div>
        <div v-else-if="!issues.length" class="state">暂无 Issue。去「提交需求」创建第一个吧。</div>

        <!-- 看板列 -->
        <div v-else class="board">
          <div class="column" v-for="col in columns" :key="col.key">
            <div class="col-head" :class="col.key">
              <span>{{ col.title }}</span><i>{{ col.items.length }}</i>
            </div>
            <div class="col-body">
              <a
                v-for="it in col.items"
                :key="it.number"
                class="issue-card"
                :href="it.html_url"
                target="_blank"
                rel="noopener"
              >
                <div class="issue-title">#{{ it.number }} {{ it.title }}</div>
                <div class="issue-meta">
                  <span v-for="l in it.labels" :key="l" class="lbl" :style="labelStyle(l)">{{ l }}</span>
                </div>
                <div class="issue-foot">
                  <span>🕓 {{ fmtDate(it.updated_at) }}</span>
                  <span v-if="it.comments">💬 {{ it.comments }}</span>
                </div>
              </a>
              <div v-if="!col.items.length" class="col-empty">—</div>
            </div>
          </div>
        </div>
      </div>

      <!-- ========== 提交需求 ========== -->
      <div v-show="activeTab === 'submit'" class="panel">
        <div class="glass-card form-card">
          <div class="field">
            <label>需求类型</label>
            <div class="type-row">
              <button
                v-for="t in types"
                :key="t.value"
                class="type-btn"
                :class="{ on: form.type === t.value }"
                @click="form.type = t.value"
              >{{ t.label }}</button>
            </div>
          </div>

          <div class="field">
            <label>标题 <span class="req">*</span></label>
            <input v-model="form.title" class="inp" maxlength="80" placeholder="一句话描述你的需求" />
          </div>

          <div class="field">
            <label>详细描述</label>
            <textarea v-model="form.desc" class="inp area" rows="5" placeholder="背景、想要什么、使用场景…"></textarea>
          </div>

          <div class="field">
            <label>期望结果</label>
            <textarea v-model="form.expect" class="inp area" rows="3" placeholder="理想情况下应该达到什么效果"></textarea>
          </div>

          <div class="form-actions">
            <button class="submit-btn" :disabled="!form.title.trim()" @click="submit">
              前往 GitHub 提交 →
            </button>
            <a class="ghost-btn" :href="chooserUrl" target="_blank" rel="noopener">
              或打开完整 Issue 模板
            </a>
          </div>
          <p class="hint">提交将在新标签页跳转至 GitHub，登录后即可创建 Issue。创建后会出现在看板中。</p>
        </div>
      </div>

      <!-- ========== 协作文档 ========== -->
      <div v-show="activeTab === 'docs'" class="panel docs-panel">
        <aside class="doc-list">
          <button
            v-for="d in docs"
            :key="d.key"
            class="doc-item"
            :class="{ on: activeDoc === d.key }"
            @click="selectDoc(d)"
          >
            <span class="doc-label">{{ d.label }}</span>
            <span class="doc-desc">{{ d.desc }}</span>
          </button>
        </aside>
        <article class="doc-view glass-card">
          <div v-if="docLoading" class="state">⏳ 加载文档中…</div>
          <div v-else-if="docError" class="state error">⚠ {{ docError }}</div>
          <div v-else-if="docHtml" class="md-body" v-html="docHtml"></div>
          <div v-else class="state">← 选择左侧文档开始浏览</div>
        </article>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import RevealText from '../components/RevealText.vue'
import { fetchIssues, buildIssueUrl, templateChooserUrl } from '../utils/github.js'
import { renderMarkdown, fetchRawMarkdown } from '../utils/markdown.js'
import { COLLAB_REPO, COLLAB_BRANCH, COLLAB_DOCS, REQUEST_TYPES } from '../config/collab.js'

// ===== 状态 =====
const activeTab = ref('board')
const loading = ref(false)
const error = ref('')
const source = ref('')
const lastUpdated = ref('')
const issues = ref([])

const filterLabel = ref('')

const types = REQUEST_TYPES
const docs = COLLAB_DOCS
const chooserUrl = templateChooserUrl()

const form = ref({ type: 'feature', title: '', desc: '', expect: '' })

const activeDoc = ref('')
const docHtml = ref('')
const docLoading = ref(false)
const docError = ref('')

// ===== 计算 =====
const stats = computed(() => {
  const list = issues.value
  return {
    total: list.length,
    open: list.filter((i) => i.state === 'open').length,
    closed: list.filter((i) => i.state === 'closed').length,
  }
})

const labelCounts = computed(() => {
  const map = {}
  for (const it of issues.value) for (const l of it.labels) map[l] = (map[l] || 0) + 1
  return Object.entries(map)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12)
})
const topLabels = labelCounts

const visibleIssues = computed(() => {
  if (!filterLabel.value) return issues.value
  return issues.value.filter((i) => i.labels.includes(filterLabel.value))
})

const columns = computed(() => {
  const list = visibleIssues.value
  // 列归属与 .github/labels.yml 的 status:* 标签保持一致（中文标签为单一事实源）
  const classify = (it) => {
    if (it.state === 'closed') return 'closed'
    if (it.labels.some((l) => l === 'status:进行中')) return 'in-progress'
    if (it.labels.some((l) => l === 'status:待审核')) return 'review'
    return 'todo'
  }
  const by = (k) => list.filter((i) => classify(i) === k)
  return [
    { key: 'todo', title: '📥 待办', items: by('todo') },
    { key: 'in-progress', title: '🚧 进行中', items: by('in-progress') },
    { key: 'review', title: '🔍 待审核', items: by('review') },
    { key: 'closed', title: '✅ 已关闭', items: by('closed') },
  ]
})

// ===== 标签配色 =====
const LABEL_THEME = {
  'status:': { bg: 'rgba(107,114,128,.14)', fg: '#4b5563' },
  'priority:': { bg: 'rgba(239,68,68,.14)', fg: '#dc2626' },
  'type:': { bg: 'rgba(59,130,246,.14)', fg: '#2563eb' },
  'good first issue': { bg: 'rgba(16,185,129,.14)', fg: '#059669' },
}
const labelStyle = (label) => {
  for (const k in LABEL_THEME) if (label.startsWith(k)) return LABEL_THEME[k]
  return { bg: 'rgba(0,0,0,.06)', fg: 'var(--text-secondary)' }
}

// ===== 方法 =====
const fmtDate = (s) => {
  if (!s) return '—'
  const d = new Date(s)
  if (isNaN(d.getTime())) return s
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    const r = await fetchIssues()
    issues.value = r.issues
    source.value = r.source
    lastUpdated.value = r.generatedAt || new Date().toISOString()
  } catch (e) {
    error.value = e.message || '加载失败'
  } finally {
    loading.value = false
  }
}

const submit = () => {
  const typeObj = types.find((t) => t.value === form.value.type)
  const plain = typeObj.label.replace(/^[^一-龥A-Za-z]+/, '')
  const body = [
    '## 类型',
    typeObj.label,
    '',
    '## 描述',
    form.value.desc.trim() || '(待补充)',
    '',
    '## 期望结果',
    form.value.expect.trim() || '(待补充)',
    '',
    '---',
    '> 由「启明艺术空间」前端协作页提交',
  ].join('\n')
  const url = buildIssueUrl({ typeLabel: plain, title: form.value.title.trim(), body })
  window.open(url, '_blank', 'noopener')
}

const selectDoc = async (doc) => {
  activeDoc.value = doc.key
  docHtml.value = ''
  docError.value = ''
  docLoading.value = true
  try {
    const raw = await fetchRawMarkdown(
      `https://raw.githubusercontent.com/${COLLAB_REPO}/${COLLAB_BRANCH}/${doc.path}`
    )
    docHtml.value = renderMarkdown(raw)
  } catch (e) {
    docError.value = '文档拉取失败（可能尚未推送或路径变更）'
  } finally {
    docLoading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.collab-page {
  min-height: 100vh;
  padding-bottom: 120px;
  background: var(--artwork-bg);
  color: var(--text);
}

/* 头部 */
.page-header { padding: 7rem 0 1.5rem; text-align: left; background: var(--artwork-bg); }
.section-label {
  display: inline-block; font-size: 0.75rem; font-weight: 500; letter-spacing: 0.12em;
  color: var(--text-secondary); opacity: 0.5; text-transform: uppercase; margin-bottom: 1rem;
}
.page-title { font-size: clamp(2.25rem, 5vw, 3.25rem); color: var(--text); font-weight: 700; letter-spacing: -0.03em; line-height: 1.15; margin-bottom: 0.5rem; }
.page-desc { font-size: 1rem; color: var(--text-secondary); opacity: 0.6; margin-top: 0.5rem; max-width: 640px; }

/* 数据源状态条 */
.source-bar {
  display: inline-flex; align-items: center; gap: 0.5rem; margin-top: 1.2rem;
  padding: 0.45rem 0.9rem; border-radius: 999px; font-size: 0.82rem;
  background: rgba(255,255,255,0.6); border: 1px solid rgba(255,255,255,0.7);
  backdrop-filter: blur(12px);
}
.source-bar .dot { width: 8px; height: 8px; border-radius: 50%; background: #9ca3af; }
.source-bar.live .dot { background: #16a34a; box-shadow: 0 0 0 4px rgba(22,163,74,.15); }
.source-bar.snapshot .dot { background: #f59e0b; box-shadow: 0 0 0 4px rgba(245,158,11,.15); }
.reload-btn { margin-left: 0.4rem; border: none; background: rgba(0,0,0,.06); color: var(--text-secondary); border-radius: 999px; padding: 0.2rem 0.7rem; cursor: pointer; font-size: 0.78rem; transition: background .2s; }
.reload-btn:hover:not(:disabled) { background: rgba(0,0,0,.12); }
.reload-btn:disabled { opacity: .4; cursor: default; }

/* Tabs */
.tabs-section { padding: 0.5rem 0 1.5rem; }
.tabs { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.tab {
  border: 1px solid rgba(0,0,0,.08); background: rgba(255,255,255,.5); color: var(--text-secondary);
  padding: 0.6rem 1.2rem; border-radius: 999px; cursor: pointer; font-size: 0.9rem; font-weight: 500;
  transition: all .25s cubic-bezier(0.16,1,0.3,1);
}
.tab:hover { background: rgba(255,255,255,.8); }
.tab.active { background: var(--text); color: var(--surface); border-color: var(--text); }

.panel { padding-bottom: 2rem; animation: fade-in .35s ease; }
@keyframes fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }

/* 看板顶部 */
.board-top { display: flex; flex-wrap: wrap; gap: 1.2rem; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; }
.stats { display: flex; gap: 0.8rem; }
.stat { background: rgba(255,255,255,.6); border: 1px solid rgba(255,255,255,.7); border-radius: 16px; padding: 0.7rem 1.1rem; min-width: 96px; text-align: center; }
.stat b { display: block; font-size: 1.5rem; line-height: 1.1; }
.stat span { font-size: 0.72rem; color: var(--text-secondary); opacity: .6; }
.stat.open b { color: #2563eb; }
.stat.done b { color: #16a34a; }

.filters { display: flex; flex-wrap: wrap; gap: 0.4rem; }
.chip { border: 1px solid rgba(0,0,0,.08); background: rgba(255,255,255,.5); border-radius: 999px; padding: 0.35rem 0.8rem; font-size: 0.78rem; cursor: pointer; transition: all .2s; color: var(--text-secondary); }
.chip:hover { background: rgba(255,255,255,.85); }
.chip.on { outline: 2px solid rgba(0,0,0,.15); }
.chip i { font-style: normal; opacity: .5; margin-left: 0.2rem; }

/* 看板列 */
.board { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; align-items: start; }
.column { background: rgba(255,255,255,.4); border: 1px solid rgba(255,255,255,.6); border-radius: 18px; padding: 0.9rem; min-height: 120px; }
.col-head { display: flex; align-items: center; justify-content: space-between; font-weight: 600; font-size: 0.9rem; padding: 0.3rem 0.4rem 0.8rem; }
.col-head i { font-style: normal; opacity: .5; font-weight: 400; }
.col-head.todo { color: #4b5563; }
.col-head.in-progress { color: #2563eb; }
.col-head.review { color: #d97706; }
.col-head.closed { color: #16a34a; }
.col-body { display: flex; flex-direction: column; gap: 0.6rem; }
.col-empty { text-align: center; opacity: .3; padding: 1rem 0; }

.issue-card { display: block; text-decoration: none; color: inherit; background: rgba(255,255,255,.85); border: 1px solid rgba(0,0,0,.06); border-radius: 14px; padding: 0.8rem 0.9rem; transition: all .25s cubic-bezier(0.16,1,0.3,1); }
.issue-card:hover { transform: translateY(-2px); box-shadow: 0 8px 22px rgba(0,0,0,.08); }
.issue-title { font-size: 0.88rem; font-weight: 600; line-height: 1.4; margin-bottom: 0.5rem; word-break: break-word; }
.issue-meta { display: flex; flex-wrap: wrap; gap: 0.3rem; margin-bottom: 0.5rem; }
.lbl { font-size: 0.68rem; padding: 0.12rem 0.5rem; border-radius: 999px; white-space: nowrap; }
.issue-foot { display: flex; gap: 0.8rem; font-size: 0.72rem; color: var(--text-secondary); opacity: .6; }

/* 状态/错误 */
.state { text-align: center; padding: 3rem 1rem; color: var(--text-secondary); opacity: .6; }
.state.error { color: #dc2626; opacity: .85; }

/* 表单 */
.glass-card { background: rgba(255,255,255,0.55); backdrop-filter: blur(24px) saturate(180%); -webkit-backdrop-filter: blur(24px) saturate(180%); border: 1px solid rgba(255,255,255,0.7); border-radius: 24px; padding: 2rem; box-shadow: 0 8px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8); }
.form-card { max-width: 720px; }
.field { margin-bottom: 1.3rem; }
.field label { display: block; font-size: 0.85rem; font-weight: 600; color: var(--text); margin-bottom: 0.5rem; }
.req { color: #dc2626; }
.inp { width: 100%; border: 1px solid rgba(0,0,0,.1); border-radius: 12px; padding: 0.7rem 0.9rem; font-size: 0.92rem; font-family: var(--font-body); background: rgba(255,255,255,.6); color: var(--text); outline: none; transition: border-color .2s; }
.inp:focus { border-color: rgba(0,0,0,.28); }
.area { resize: vertical; line-height: 1.5; }

.type-row { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.type-btn { border: 1px solid rgba(0,0,0,.1); background: rgba(255,255,255,.5); border-radius: 999px; padding: 0.5rem 1rem; font-size: 0.85rem; cursor: pointer; transition: all .2s; color: var(--text-secondary); }
.type-btn:hover { background: rgba(255,255,255,.85); }
.type-btn.on { background: var(--text); color: var(--surface); border-color: var(--text); }

.form-actions { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; margin-top: 0.5rem; }
.submit-btn { border: none; background: #1a1a1a; color: #fff; font-size: 0.92rem; font-weight: 500; padding: 0.7rem 1.5rem; border-radius: 999px; cursor: pointer; transition: all .25s; }
.submit-btn:hover:not(:disabled) { background: #333; transform: scale(1.03); }
.submit-btn:disabled { opacity: .35; cursor: not-allowed; }
.ghost-btn { font-size: 0.85rem; color: var(--text-secondary); text-decoration: underline; }
.hint { font-size: 0.78rem; color: var(--text-secondary); opacity: .6; margin-top: 0.8rem; }

/* 文档 */
.docs-panel { display: grid; grid-template-columns: 280px 1fr; gap: 1.2rem; align-items: start; }
.doc-list { display: flex; flex-direction: column; gap: 0.5rem; }
.doc-item { text-align: left; border: 1px solid rgba(0,0,0,.08); background: rgba(255,255,255,.5); border-radius: 14px; padding: 0.8rem 1rem; cursor: pointer; transition: all .2s; }
.doc-item:hover { background: rgba(255,255,255,.85); }
.doc-item.on { background: rgba(255,255,255,.95); outline: 2px solid rgba(0,0,0,.12); }
.doc-label { display: block; font-size: 0.9rem; font-weight: 600; color: var(--text); }
.doc-desc { display: block; font-size: 0.74rem; color: var(--text-secondary); opacity: .6; margin-top: 0.2rem; }
.doc-view { min-height: 300px; }

/* Markdown 渲染样式 */
.md-body { font-size: 0.92rem; line-height: 1.7; color: var(--text); word-break: break-word; }
.md-body :deep(h1), .md-body :deep(h2), .md-body :deep(h3) { font-family: var(--font-display); margin: 1.4em 0 0.6em; line-height: 1.3; }
.md-body :deep(h1) { font-size: 1.6rem; border-bottom: 1px solid var(--border); padding-bottom: 0.3em; }
.md-body :deep(h2) { font-size: 1.3rem; }
.md-body :deep(h3) { font-size: 1.1rem; }
.md-body :deep(p) { margin: 0.7em 0; }
.md-body :deep(a) { color: #2563eb; text-decoration: underline; }
.md-body :deep(ul), .md-body :deep(ol) { padding-left: 1.4em; margin: 0.6em 0; }
.md-body :deep(li) { margin: 0.3em 0; }
.md-body :deep(code) { background: rgba(0,0,0,.05); padding: 0.1em 0.4em; border-radius: 6px; font-size: 0.85em; font-family: ui-monospace, monospace; }
.md-body :deep(pre) { background: rgba(0,0,0,.05); padding: 1em; border-radius: 12px; overflow-x: auto; margin: 0.8em 0; }
.md-body :deep(pre code) { background: none; padding: 0; }
.md-body :deep(blockquote) { border-left: 3px solid var(--border); padding-left: 1em; margin: 0.8em 0; color: var(--text-secondary); }
.md-body :deep(table) { border-collapse: collapse; width: 100%; margin: 0.8em 0; font-size: 0.88rem; }
.md-body :deep(th), .md-body :deep(td) { border: 1px solid var(--border); padding: 0.5em 0.7em; text-align: left; }
.md-body :deep(img) { max-width: 100%; border-radius: 12px; }
.md-body :deep(hr) { border: none; border-top: 1px solid var(--border); margin: 1.5em 0; }

/* 响应式 */
@media (max-width: 860px) {
  .board { grid-template-columns: 1fr; }
  .docs-panel { grid-template-columns: 1fr; }
  .doc-list { flex-direction: row; overflow-x: auto; }
  .doc-item { min-width: 180px; }
}
@media (max-width: 640px) {
  .page-header { padding-top: 5rem; }
  .stats { width: 100%; }
  .stat { flex: 1; }
}
</style>
