<template>
  <div class="about-page">
    <section class="about-hero">
      <div class="about-container">
        <span class="section-tag">关于</span>
        <h1 class="about-title">启明</h1>
        <p class="about-subtitle">{{ aboutSubtitle }}</p>
        <p class="about-desc" v-for="(line, i) in aboutContentLines" :key="i">{{ line }}</p>

        <div class="about-links">
          <a href="#/artwork" class="about-link">浏览作品</a>
          <a href="#/ask" class="about-link">向我提问</a>
        </div>
      </div>
    </section>

    <section class="about-skills">
      <div class="about-container">
        <h2 class="skills-title">创作领域</h2>
        <div class="skills-grid">
          <div v-for="s in skills" :key="s.title" class="skill-card">
            <span class="skill-icon">{{ s.icon }}</span>
            <h3>{{ s.title }}</h3>
            <p>{{ s.desc }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const aboutSubtitle = ref('')
const aboutContent = ref('')

const aboutContentLines = computed(() => {
  if (!aboutContent.value) return []
  return aboutContent.value.split('\n').filter(line => line.trim())
})

// 默认值（与后端 init.sql 中的初始值保持一致，作为兜底）
const DEFAULT_SUBTITLE = '视觉设计爱好者+码农'
const DEFAULT_CONTENT = '「启明」是个人创作空间，希望制作成一个方便整理工程的网站。\n每一件作品都是我某个时间切片里的映象\n我希望过去可以点亮未来。'

// 加载优先级：
// 1) 静态导出文件 data/site-config.json —— 部署到 Cloudflare Pages（无后端）时以此为准，
//    与管理后台编辑的是同一份数据，重新导出 + 重新部署即可同步。
// 2) 本地开发连后端时走实时接口 /api/public/site-config —— 与后台管理一致。
// 3) 都失败则用默认值兜底。
async function loadSiteConfig() {
  // 1) 静态文件优先（production 部署走这里）
  try {
    const res = await fetch('data/site-config.json')
    if (res.ok) {
      const cfg = await res.json()
      if (cfg && (cfg.about_subtitle !== undefined || cfg.about_content !== undefined)) {
        return cfg
      }
    }
  } catch (e) {
    console.warn('[About] 读取静态 site-config.json 失败，尝试实时接口', e)
  }
  // 2) 本地开发：实时接口（与后台管理同源）
  try {
    const res = await fetch('/api/public/site-config')
    const json = await res.json()
    const list = json.data || []
    const cfg = {}
    for (const c of list) cfg[c.configKey] = c.configValue
    return cfg
  } catch (e) {
    console.warn('[About] 加载站点配置失败，使用默认值', e)
  }
  return null
}

function applyConfig(cfg) {
  if (!cfg) {
    aboutSubtitle.value = DEFAULT_SUBTITLE
    aboutContent.value = DEFAULT_CONTENT
    return
  }
  aboutSubtitle.value = (cfg.about_subtitle !== undefined && cfg.about_subtitle !== null)
    ? cfg.about_subtitle
    : DEFAULT_SUBTITLE
  aboutContent.value = (cfg.about_content !== undefined && cfg.about_content !== null)
    ? cfg.about_content
    : DEFAULT_CONTENT
}

onMounted(async () => {
  applyConfig(await loadSiteConfig())
})

const skills = [
  { icon: '✧', title: '平面及动效作品', desc: '角色海报、宣传海报等平面与动态视觉作品。' },
  { icon: '◈', title: '素材库', desc: '可复用的设计素材与视觉资源集合。' },
  { icon: '⌬', title: '学习工程', desc: '学习过程中的实验项目与工程实践记录。' },
  { icon: '✎', title: '图文笔记', desc: '图文结合的创作思考与设计笔记。' },
  { icon: '◉', title: '提问箱', desc: '收集的提问与回答，创作交流空间。' },
]
</script>

<style scoped>
.about-page {
  min-height: 100vh;
  background: var(--artwork-bg);
  color: var(--text);
  padding-bottom: 120px;
}

.about-hero {
  padding: 10rem 0 6rem;
  background: linear-gradient(180deg, rgba(249,246,232,0.3), var(--artwork-bg));
}

.about-container {
  width: 90%;
  max-width: 720px;
  margin: 0 auto;
}

.section-tag {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.15em;
  margin-bottom: 1rem;
}

.about-title {
  font-size: clamp(3.5rem, 10vw, 6rem);
  font-weight: 700;
  color: var(--text);
  margin-bottom: 0.5rem;
  letter-spacing: -0.03em;
  line-height: 1.05;
}

.about-subtitle {
  font-size: 1.15rem;
  color: var(--text-secondary);
  font-weight: 500;
  margin-bottom: 2.5rem;
}

.about-desc {
  font-size: 1rem;
  color: var(--text-secondary);
  line-height: 1.85;
  margin-bottom: 1.25rem;
}

.about-links {
  display: flex;
  gap: 12px;
  margin-top: 2.5rem;
  flex-wrap: wrap;
}

.about-link {
  padding: 8px 22px;
  border: 1px solid var(--border);
  border-radius: 999px;
  color: var(--text);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.about-link:hover {
  background: var(--text);
  color: var(--surface);
  border-color: var(--text);
}

.about-skills {
  padding: 5rem 0;
  background: var(--surface);
}

.skills-title {
  font-size: 1.6rem;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 2.5rem;
  text-align: center;
  letter-spacing: -0.01em;
}

.skills-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;
}

.skill-card {
  background: var(--bg);
  padding: 1.5rem;
  border-radius: 16px;
  text-align: center;
  border: 1px solid var(--border-light);
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease;
}

.skill-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.06);
}

.skill-icon {
  font-size: 1.25rem;
  display: block;
  margin-bottom: 0.8rem;
  color: var(--text-tertiary);
}

.skill-card h3 {
  font-size: 1rem;
  color: var(--text);
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.skill-card p {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

@media (max-width: 768px) {
  .skills-grid { grid-template-columns: repeat(2, 1fr); }
  .about-hero { padding: 7rem 0 4rem; }
}

@media (max-width: 480px) {
  .skills-grid { grid-template-columns: 1fr; }
  .about-title { font-size: 3rem; }
}
</style>
