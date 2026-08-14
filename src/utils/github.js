// =============================================================
// GitHub 数据获取工具
// 策略：优先直连 GitHub API（公开仓库免 Token），失败（限流/离线）
// 时回退到本地快照 public/data/collab.json，与 works.json 同一套心智。
// =============================================================
import { COLLAB_REPO } from '../config/collab.js'

const API_BASE = 'https://api.github.com'
const SNAPSHOT_URL = '/data/collab.json'

const normalize = (i) => ({
  number: i.number,
  title: i.title,
  state: i.state,
  state_reason: i.state_reason || '',
  labels: (i.labels || []).map((l) => (typeof l === 'string' ? l : l.name)),
  user: i.user?.login || '',
  avatar: i.user?.avatar_url || '',
  comments: i.comments || 0,
  created_at: i.created_at || '',
  updated_at: i.updated_at || '',
  closed_at: i.closed_at || '',
  html_url: i.html_url || '',
  body: i.body || '',
})

/**
 * 拉取 Issues（剔除 PR）。
 * @returns {Promise<{issues:Array, source:'live'|'snapshot', repo?:Object, stats?:Object, generatedAt?:string}>}
 */
export async function fetchIssues() {
  try {
    const res = await fetch(
      `${API_BASE}/repos/${COLLAB_REPO}/issues?state=all&per_page=100&sort=updated&direction=desc`,
      { headers: { Accept: 'application/vnd.github+json' } }
    )
    if (!res.ok) throw new Error(`GitHub API ${res.status}`)
    const data = await res.json()
    const issues = data.filter((i) => !i.pull_request).map(normalize)
    return { issues, source: 'live' }
  } catch (e) {
    // 实时失败 → 回退快照
    try {
      const res = await fetch(SNAPSHOT_URL)
      if (!res.ok) throw new Error('snapshot missing')
      const json = await res.json()
      return {
        issues: (json.issues || []).map(normalize),
        source: 'snapshot',
        repo: json.repo,
        stats: json.stats,
        generatedAt: json.generatedAt,
      }
    } catch (err) {
      throw new Error('既无法连接 GitHub，也没有本地快照')
    }
  }
}

/**
 * 构造「一键提交 Issue」的 GitHub 链接（预填标题/正文）。
 * 浏览器在新标签打开，用户在 GitHub 内完成登录与提交。
 */
export function buildIssueUrl({ typeLabel = '', title = '', body = '' }) {
  const params = new URLSearchParams()
  if (title) params.set('title', title)
  const head = typeLabel ? `【${typeLabel}】` : ''
  const fullTitle = head + title
  if (fullTitle) params.set('title', fullTitle)
  if (body) params.set('body', body)
  return `https://github.com/${COLLAB_REPO}/issues/new?${params.toString()}`
}

/** Issue 模板选择页（GitHub 原生，结构化字段最完整） */
export function templateChooserUrl() {
  return `https://github.com/${COLLAB_REPO}/issues/new/choose`
}
