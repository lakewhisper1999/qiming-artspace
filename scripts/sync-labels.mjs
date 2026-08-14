#!/usr/bin/env node
/**
 * 同步 .github/labels.yml 到 GitHub 仓库标签
 *
 * 用法：
 *   本地：GITHUB_TOKEN=<PAT，需 repo 权限> node scripts/sync-labels.mjs
 *   CI  ：由 .github/workflows/labels-sync.yml 手动触发（自动注入 GITHUB_TOKEN）
 *
 * 行为：缺失即创建，颜色/描述不一致即更新；不会删除仓库里已有的其他标签。
 * 零依赖：只用 Node 18+ 内置 fetch，YAML 用极简行解析（labels.yml 结构固定）。
 */

import { readFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OWNER = process.env.GITHUB_REPOSITORY?.split('/')[0] || 'lakewhisper1999'
const REPO = process.env.GITHUB_REPOSITORY?.split('/')[1] || 'qiming-artspace'
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN

if (!TOKEN) {
  console.error('✖ 缺少 GITHUB_TOKEN。本地运行请先设置带 repo 权限的 PAT。')
  process.exit(1)
}

/** 极简 YAML 解析：仅支持 `- name:` 开头的对象数组 + 二级 key: value */
function parseLabelsYaml(text) {
  const items = []
  let cur = null
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/\s+#.*$/, '')
    if (!line.trim() || line.trim().startsWith('#')) continue
    const item = line.match(/^-\s*(\w+):\s*(.*)$/)
    if (item) {
      cur = {}
      items.push(cur)
      cur[item[1]] = unquote(item[2])
      continue
    }
    const kv = line.match(/^\s+(\w+):\s*(.*)$/)
    if (kv && cur) cur[kv[1]] = unquote(kv[2])
  }
  return items.filter((i) => i.name)
}

const unquote = (s) => s.trim().replace(/^["']|["']$/g, '')

async function api(path, init = {}) {
  const res = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${TOKEN}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  })
  if (!res.ok && res.status !== 404) {
    throw new Error(`${init.method || 'GET'} ${path} → ${res.status} ${await res.text()}`)
  }
  return res.status === 404 ? null : res.json()
}

const wanted = parseLabelsYaml(await readFile(resolve(ROOT, '.github/labels.yml'), 'utf8'))
console.log(`→ labels.yml 解析到 ${wanted.length} 个标签`)

const existing = (await api(`/repos/${OWNER}/${REPO}/labels?per_page=100`)) || []
const byName = new Map(existing.map((l) => [l.name, l]))

let created = 0
let updated = 0
for (const label of wanted) {
  const body = JSON.stringify({
    name: label.name,
    color: (label.color || 'ededed').replace('#', ''),
    description: label.description || '',
  })
  const found = byName.get(label.name)
  if (!found) {
    await api(`/repos/${OWNER}/${REPO}/labels`, { method: 'POST', body })
    console.log(`  + 创建 ${label.name}`)
    created++
  } else if (found.color !== label.color || (found.description || '') !== (label.description || '')) {
    await api(`/repos/${OWNER}/${REPO}/labels/${encodeURIComponent(label.name)}`, { method: 'PATCH', body })
    console.log(`  ~ 更新 ${label.name}`)
    updated++
  }
}

console.log(`✔ 完成：新建 ${created}，更新 ${updated}，跳过 ${wanted.length - created - updated}`)
