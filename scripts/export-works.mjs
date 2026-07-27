// =============================================================
// 启明艺术空间 · 静态站导出脚本（无后端部署用 · 不依赖任何云存储）
// -------------------------------------------------------------
// 作用：连本地 MySQL → 读 artwork / article / category 表 →
//       把作品引用的图片复制到前端 public/media/ 目录 →
//       生成 public/data/works.json（前端 Artwork/Article 直接读）
//       生成 public/data/site-config.json（前端「关于」页直接读，含关于我等）
//
// 核心思路：媒体不依赖 R2 / OSS 等第三方，图片直接打进前端构建产物
// （dist/media/），由 Cloudflare Pages 一起托管 —— 零费用、零绑卡。
// works.json 里的路径用站点根路径 /media/...，前端无需任何改动。
//
// 运行（在你本地、MySQL 启动时）：
//   1. cp .env.example .env  并填好 DB 参数（不需要 R2）
//   2. npm install            （安装 mysql2 / dotenv）
//   3. npm run export:works
//
// 注意：Cloudflare Pages 单文件上限 25MB，超过的图片会被跳过（仅告警）。
//       视频（1.7G）无法走 Pages，本脚本不导出 video，需要可后续接 B站嵌入。
// =============================================================
import 'dotenv/config'
import mysql from 'mysql2/promise'
import { existsSync, mkdirSync, statSync } from 'fs'
import { copyFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { writeFile } from 'fs/promises'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..') // qiming-artspace
const MEDIA_DIR = path.join(ROOT, 'public', 'media')

// ——— 配置（来自 .env，带本地默认值）———
const DB = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'qiming',
}
const UPLOADS_DIR = process.env.UPLOADS_DIR
  || path.resolve(ROOT, '../qiming-server/uploads')

// Cloudflare Pages 单文件大小上限（超过会导致部署失败）
const MAX_FILE_BYTES = 25 * 1024 * 1024

// 把本地文件复制到 public/media/<relKey>，返回站点根路径 /media/<relKey>
async function copyToPublic(localPath, relKey) {
  if (!existsSync(localPath)) {
    console.warn('  ⚠ 本地文件不存在，跳过:', localPath)
    return null
  }
  const size = statSync(localPath).size
  if (size > MAX_FILE_BYTES) {
    console.warn(`  ⚠ 文件 ${(size / 1024 / 1024) | 0}MB 超过 Pages 25MB 限制，跳过:`, relKey)
    return null
  }
  const dest = path.join(MEDIA_DIR, relKey)
  mkdirSync(path.dirname(dest), { recursive: true })
  await copyFile(localPath, dest)
  return `/media/${relKey}`
}

// 把数据库里的 /uploads/xxx 解析为本地文件并复制，返回 /media/... URL
async function copyUploadsPath(uploadsPath) {
  if (!uploadsPath) return null
  if (/^https?:\/\//i.test(uploadsPath)) return uploadsPath // 已是绝对 URL
  const rel = uploadsPath.replace(/^\/uploads\//, '')
  const local = path.join(UPLOADS_DIR, rel)
  return await copyToPublic(local, rel)
}

const formatDate = (d) => {
  if (!d) return null
  const dt = (d instanceof Date) ? d : new Date(d)
  if (isNaN(dt.getTime())) return String(d)
  const p = (n) => String(n).padStart(2, '0')
  return `${dt.getFullYear()}-${p(dt.getMonth() + 1)}-${p(dt.getDate())} ` +
         `${p(dt.getHours())}:${p(dt.getMinutes())}:${p(dt.getSeconds())}`
}

// 把 B站/YouTube 视频链接归一化为可嵌入的 iframe 地址；无法识别返回 null。
// 支持：B站视频页 URL、Youtube watch/短链、以及已是 embed 地址的情况。
function normalizeEmbedUrl(raw) {
  if (!raw || typeof raw !== 'string') return null
  const s = raw.trim()
  if (/^https?:\/\/(player\.)?bilibili\.com\/player\.html/i.test(s)) return s
  if (/^https?:\/\/www\.youtube\.com\/embed\//i.test(s)) return s
  const bili = s.match(/bilibili\.com\/video\/(BV[A-Za-z0-9]+)/i)
  if (bili) return `https://player.bilibili.com/player.html?bvid=${bili[1]}&page=1&high_quality=1&danmaku=0`
  const yt = s.match(/[?&]v=([A-Za-z0-9_-]{6,})/i)
  if (/youtube\.com\/watch/i.test(s) && yt) return `https://www.youtube.com/embed/${yt[1]}`
  const ytShort = s.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/i)
  if (ytShort) return `https://www.youtube.com/embed/${ytShort[1]}`
  return null
}

async function main() {
  mkdirSync(MEDIA_DIR, { recursive: true })

  const conn = await mysql.createConnection(DB)
  console.log('✓ 已连接数据库:', DB.database)

  const [cats] = await conn.execute('SELECT id, name FROM category WHERE deleted=0 ORDER BY sort_order')
  const catName = Object.fromEntries(cats.map((c) => [c.id, c.name]))

  // —— 作品（图片）——
  const [arts] = await conn.execute(
    `SELECT id, title, description, cover_url, image_urls, category_id,
            download_url, file_size, view_count, download_count, created_at,
            video_url
     FROM artwork WHERE deleted=0 ORDER BY created_at DESC`)
  const artworks = []
  for (const a of arts) {
    const coverUrl = await copyUploadsPath(a.cover_url)
    let imageUrls = null
    if (a.image_urls) {
      try {
        const arr = JSON.parse(a.image_urls)
        if (Array.isArray(arr)) {
          const urls = []
          for (const p of arr) {
            const u = await copyUploadsPath(p)
            if (u) urls.push(u)
          }
          if (urls.length) imageUrls = JSON.stringify(urls)
        }
      } catch { /* 忽略损坏的 JSON */ }
    }
    const downloadUrl = a.download_url ? await copyUploadsPath(a.download_url) : null
    // 视频作品：video_url 存 B站/YouTube 嵌入地址，前端用 iframe 播放（不依赖本地 mp4）
    const videoEmbed = normalizeEmbedUrl(a.video_url)
    artworks.push({
      id: a.id, title: a.title, description: a.description,
      coverUrl, imageUrls,
      videoEmbed,
      categoryName: catName[a.category_id] || '未分类',
      categoryId: a.category_id,
      createdAt: formatDate(a.created_at),
      viewCount: a.view_count || 0,
      downloadUrl,
      fileSize: a.file_size || 0,
      downloadCount: a.download_count || 0,
    })
  }
  console.log(`✓ 作品 ${artworks.length} 件已处理`)

  // —— 图文笔记 ——
  const [arts2] = await conn.execute(
    `SELECT id, title, content, cover_url, category_id, view_count, created_at
     FROM article WHERE deleted=0 ORDER BY created_at DESC`)
  const articles = []
  for (const a of arts2) {
    const coverUrl = await copyUploadsPath(a.cover_url)
    articles.push({
      id: a.id, title: a.title, content: a.content || '',
      coverUrl,
      categoryName: catName[a.category_id] || '图文笔记',
      categoryId: a.category_id,
      createdAt: formatDate(a.created_at),
      viewCount: a.view_count || 0,
    })
  }
  console.log(`✓ 图文 ${articles.length} 篇已处理`)

  // —— 视频：1.7G 无法走 Pages（单文件 25MB 上限），暂不导出 ——
  // 如后续需要，可把视频传 B站并嵌播放器，或等有了 R2 / 对象存储再接回。
  const videos = []

  // —— 站点配置（关于我等）：静态站「关于」页直接读，与后台管理同源 ——
  // 这样部署后的前端展示的「关于我」与管理后台编辑的是同一份数据，
  // 重新导出 + 重新部署即可同步（与作品/图文一致）。
  const [cfgRows] = await conn.execute('SELECT config_key, config_value FROM site_config')
  const siteConfig = {}
  for (const r of cfgRows) siteConfig[r.config_key] = r.config_value
  console.log(`✓ 站点配置 ${cfgRows.length} 项已读取`)

  await conn.end()

  const out = {
    generatedAt: new Date().toISOString(),
    categories: cats,
    artworks,
    articles,
    videos,
  }
  const outDir = path.join(ROOT, 'public', 'data')
  mkdirSync(outDir, { recursive: true })
  const outPath = path.join(outDir, 'works.json')
  await writeFile(outPath, JSON.stringify(out, null, 2), 'utf-8')
  console.log('✓ 已生成', outPath)
  console.log('  作品', artworks.length, '/ 图文', articles.length, '/ 视频', videos.length)
  console.log('  媒体已复制到 public/media/（npm run build 后随 dist 一起部署到 Pages）')

  // 站点配置（关于我等）单独输出，供「关于」页在静态部署下读取，无需后端
  const cfgPath = path.join(outDir, 'site-config.json')
  await writeFile(cfgPath, JSON.stringify(siteConfig, null, 2), 'utf-8')
  console.log('✓ 已生成', cfgPath, '（关于我等静态配置，前端关于页直接读）')
}

main().catch((e) => {
  console.error('✗ 导出失败:', e.message)
  process.exit(1)
})
