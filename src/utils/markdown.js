// =============================================================
// Markdown 渲染（零依赖）
// 小作坊方案：不引入 marked / DOMPurify，自己写一个安全子集渲染器。
// 安全策略：块级结构在【原始文本】上识别；正文内容先 HTML 转义，
// 再只重建一份白名单标签（h1-h6 / p / strong / em / code / a / img /
// ul / ol / li / blockquote / hr / table ...），从根本上杜绝 XSS——
// 文档里的原始 HTML 永远以文本呈现，不会被执行。
// 链接只允许 http(s) / 相对路径 / # / mailto，拦截 javascript: 等危险协议。
// 文档源为仓库内由我们维护的 .md，内容可信，但仍统一转义兜底。
// =============================================================

const NULL = '\u0000'

// 整体 HTML 转义（正文/单元格在交给 inline 前先 neutralized）
function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

// 仅用于属性值：再转义双引号，防止属性注入（< > & 已由 esc 处理）
function escAttr(s) {
  return s.replace(/"/g, '&quot;')
}

// 链接安全校验：只放行白名单协议 / 相对路径
function safeUrl(url) {
  const u = String(url).trim()
  if (/^(https?:|mailto:|#|\/|\.\/|\.\.\/)/i.test(u)) return u.replace(/"/g, '%22')
  if (/^[^:]+$/.test(u)) return u.replace(/"/g, '%22') // 无协议的相对路径
  return '#'
}

// 行内：代码 > 图片 > 链接 > 粗体 > 斜体
// 入参 text 已经过 esc()，所以这里只做结构重建、不再转义正文。
function inline(text) {
  const codes = []
  // 1) 先抽出行内代码，避免内部被其它规则误伤
  text = text.replace(/`([^`]+)`/g, (_, c) => {
    codes.push(c)
    return `${NULL}IC${codes.length - 1}${NULL}`
  })
  // 2) 图片 ![alt](url)
  text = text.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, alt, url) => {
    const safe = safeUrl(url)
    return safe === '#'
      ? `<img alt="${escAttr(alt)}">`
      : `<img src="${safe}" alt="${escAttr(alt)}">`
  })
  // 3) 链接 [text](url)
  text = text.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, url) => {
    const safe = safeUrl(url)
    const ext = /^https?:/i.test(safe)
    const attr = ext ? ' target="_blank" rel="noopener noreferrer"' : ''
    return `<a href="${safe}"${attr}>${t}</a>`
  })
  // 4) 粗体 **x** / __x__
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  text = text.replace(/__([^_]+)__/g, '<strong>$1</strong>')
  // 5) 斜体 *x* / _x_
  text = text.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
  text = text.replace(/(^|[^_])_([^_\n]+)_/g, '$1<em>$2</em>')
  // 6) 还原行内代码（内容已转义，直接输出）
  text = text.replace(new RegExp(`${NULL}IC(\\d+)${NULL}`, 'g'), (_, i) => `<code>${codes[+i]}</code>`)
  return text
}

// 拆分表格行（去掉首尾管道符）
function splitRow(line) {
  let s = line.trim().replace(/^\|/, '')
  if (s.endsWith('|')) s = s.slice(0, -1)
  return s.split('|').map((c) => c.trim())
}

/**
 * 把 Markdown 原文渲染为安全 HTML 字符串。
 * @param {string} raw - Markdown 原文
 * @returns {string}
 */
export function renderMarkdown(raw) {
  if (!raw) return ''
  const blocks = []
  // 1) 抽出围栏代码块（内容先转义保存），用占位符代替
  let src = raw.replace(/```[a-zA-Z0-9_-]*\n?([\s\S]*?)```/g, (_, code) => {
    blocks.push(esc(code.replace(/\n$/, '')))
    return `\n\n${NULL}CB${blocks.length - 1}${NULL}\n\n`
  })
  // 2) 在【原始文本】上做块级解析；正文内容再转义交给 inline
  const lines = src.split('\n')
  const out = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    // 代码块占位
    const cb = line.match(new RegExp(`^${NULL}CB(\\d+)${NULL}$`))
    if (cb) {
      out.push(`<pre><code>${blocks[+cb[1]]}</code></pre>`)
      i++
      continue
    }
    // 空行
    if (!line.trim()) {
      i++
      continue
    }
    // 标题
    const h = line.match(/^(#{1,6})\s+(.*)$/)
    if (h) {
      const lv = h[1].length
      out.push(`<h${lv}>${inline(esc(h[2].trim()))}</h${lv}>`)
      i++
      continue
    }
    // 分隔线
    if (/^(\s*[-*_]){3,}\s*$/.test(line)) {
      out.push('<hr>')
      i++
      continue
    }
    // 引用
    if (/^>\s?/.test(line)) {
      const buf = []
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^>\s?/, ''))
        i++
      }
      out.push(`<blockquote>${inline(esc(buf.join(' ')))}</blockquote>`)
      continue
    }
    // 表格（当前行以 | 开头，且下一行是分隔行）
    if (
      /^\s*\|/.test(line) &&
      i + 1 < lines.length &&
      /^\s*\|?[\s:|-]+\|?\s*$/.test(lines[i + 1]) &&
      /-/.test(lines[i + 1])
    ) {
      const header = splitRow(line)
      const aligns = splitRow(lines[i + 1]).map((c) => {
        const t = c.trim()
        if (t.startsWith(':') && t.endsWith(':')) return 'center'
        if (t.endsWith(':')) return 'right'
        if (t.startsWith(':')) return 'left'
        return ''
      })
      i += 2
      const rows = []
      while (i < lines.length && /^\s*\|/.test(lines[i])) {
        rows.push(splitRow(lines[i]))
        i++
      }
      let t = '<table><thead><tr>'
      header.forEach((c, k) => {
        const a = aligns[k] ? ` style="text-align:${aligns[k]}"` : ''
        t += `<th${a}>${inline(esc(c))}</th>`
      })
      t += '</tr></thead><tbody>'
      rows.forEach((r) => {
        t += '<tr>'
        header.forEach((_, k) => {
          const a = aligns[k] ? ` style="text-align:${aligns[k]}"` : ''
          t += `<td${a}>${inline(esc(r[k] || ''))}</td>`
        })
        t += '</tr>'
      })
      t += '</tbody></table>'
      out.push(t)
      continue
    }
    // 列表
    if (/^\s*([-*+]|\d+\.)\s+/.test(line)) {
      const ordered = /^\s*\d+\.\s+/.test(line)
      const re = ordered ? /^\s*\d+\.\s+(.*)$/ : /^\s*[-*+]\s+(.*)$/
      const items = []
      while (i < lines.length && /^\s*([-*+]|\d+\.)\s+/.test(lines[i])) {
        items.push(lines[i].replace(re, '$1'))
        i++
      }
      const tag = ordered ? 'ol' : 'ul'
      out.push(`<${tag}>` + items.map((it) => `<li>${inline(esc(it))}</li>`).join('') + `</${tag}>`)
      continue
    }
    // 段落：合并连续非空、非特殊行（含代码块占位行则停止）
    const isSpecial = (l) =>
      /^(#{1,6})\s|^>\s?|^\s*([-*+]|\d+\.)\s+|^\s*\|/.test(l) ||
      /^(\s*[-*_]){3,}\s*$/.test(l) ||
      new RegExp(`^${NULL}CB(\\d+)${NULL}$`).test(l)
    const buf = [esc(line)]
    i++
    while (i < lines.length && lines[i].trim() && !isSpecial(lines[i])) {
      buf.push(esc(lines[i]))
      i++
    }
    out.push(`<p>${inline(buf.join('<br>'))}</p>`)
  }
  return out.join('\n')
}

/** 拉取指定原始 Markdown 文本（仓库内 .md 的 raw 地址） */
export async function fetchRawMarkdown(url) {
  const res = await fetch(url, { headers: { Accept: 'text/plain' } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return await res.text()
}
