#!/usr/bin/env node
/**
 * 生成协作进度快照 public/data/collab.json
 *
 * 为什么需要快照：
 *   前端「协作进度」页默认直连 GitHub API（本仓库公开，免 Token），
 *   但未登录用户共享同一出口 IP 时会撞 60 次/小时限流。
 *   快照是限流/离线/接口异常时的兜底数据源，与 works.json 同一套心智。
 *
 * 用法：
 *   npm run export:collab                     # 匿名调用（60 次/小时）
 *   GITHUB_TOKEN=<PAT> npm run export:collab  # 带 Token（5000 次/小时）
 *
 * 生成后需 commit + push 才会在线上生效（Cloudflare Pages 自动重部署）。
 */

import { writeFile, mkdir } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OWNER = process.env.COLLAB_OWNER || 'lakewhisper1999'
const REPO = process.env.COLLAB_REPO || 'qiming-artspace'
const OUT = resolve(ROOT, 'public/data/collab.json')
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN

const headers = {
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
}

async function api(path) {
  const res = await fetch(`https://api.github.com${path}`, { headers })
  if (!res.ok) throw new Error(`GET ${path} → ${res.status} ${await res.text()}`)
  return res.json()
}

/** 只保留前端需要的字段，避免快照膨胀 */
const slim = (i) => ({
  number: i.number,
  title: i.title,
  state: i.state,
  state_reason: i.state_reason,
  labels: (i.labels || []).map((l) => (typeof l === 'string' ? l : l.name)),
  user: i.user?.login || '',
  avatar: i.user?.avatar_url || '',
  comments: i.comments,
  created_at: i.created_at,
  updated_at: i.updated_at,
  closed_at: i.closed_at,
  html_url: i.html_url,
  body: (i.body || '').slice(0, 6000),
})

console.log(`→ 拉取 ${OWNER}/${REPO} 的 Issues${TOKEN ? '（已带 Token）' : '（匿名）'}`)

const all = []
for (let page = 1; page <= 5; page++) {
  const batch = await api(`/repos/${OWNER}/${REPO}/issues?state=all&per_page=100&sort=updated&direction=desc&page=${page}`)
  // GitHub 的 issues 接口会混入 PR，必须剔除
  all.push(...batch.filter((i) => !i.pull_request))
  if (batch.length < 100) break
}

const repoMeta = await api(`/repos/${OWNER}/${REPO}`)

const snapshot = {
  generatedAt: new Date().toISOString(),
  repo: {
    fullName: repoMeta.full_name,
    htmlUrl: repoMeta.html_url,
    defaultBranch: repoMeta.default_branch,
    description: repoMeta.description,
    updatedAt: repoMeta.pushed_at,
  },
  stats: {
    total: all.length,
    open: all.filter((i) => i.state === 'open').length,
    closed: all.filter((i) => i.state === 'closed').length,
  },
  issues: all.map(slim),
}

await mkdir(dirname(OUT), { recursive: true })
await writeFile(OUT, JSON.stringify(snapshot, null, 2) + '\n', 'utf8')

console.log(`✔ 已写入 public/data/collab.json`)
console.log(`  Issues ${snapshot.stats.total} 条（open ${snapshot.stats.open} / closed ${snapshot.stats.closed}）`)
console.log(`  提醒：需 commit + push 才会在线上生效`)
