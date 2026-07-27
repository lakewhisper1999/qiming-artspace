// 静态部署数据加载器：从 public/data/works.json 读取真实作品数据。
// 该文件由 scripts/export-works.mjs 生成（MySQL → 本地 media 复制 → JSON）。
// 媒体路径为站点根路径 /media/...，随前端构建由 Pages 托管，不依赖第三方存储。
// BASE_URL 兼容 hash 路由与子路径部署（GitHub Pages / Cloudflare Pages 通用）。

const BASE = import.meta.env.BASE_URL || './'
let _cache = null

async function loadWorks() {
  if (_cache) return _cache
  const res = await fetch(`${BASE}data/works.json`)
  if (!res.ok) throw new Error('works.json not found')
  _cache = await res.json()
  return _cache
}

// 各页面优先用真实数据；拿不到返回 null，由页面回退到 mock。
export async function getArtworks() {
  try { return (await loadWorks()).artworks || [] } catch { return null }
}
export async function getArticles() {
  try { return (await loadWorks()).articles || [] } catch { return null }
}
export async function getVideos() {
  try { return (await loadWorks()).videos || [] } catch { return null }
}
export async function getCategories() {
  try { return (await loadWorks()).categories || [] } catch { return [] }
}
