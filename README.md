# 启明艺术空间（qiming-artspace）

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Live Demo](https://img.shields.io/badge/在线访问-qiming--artspace.pages.dev-blue)](https://qiming-artspace.pages.dev)

「启明艺术空间」的**前台艺术空间站点**：展示平面及动效作品、素材库、学习工程、图文笔记与提问箱。基于 **Vue 3 + Vite** 构建，采用 **hash 路由**，默认部署到 **Cloudflare Pages**（无后端、零费用）。

> 🌐 已部署站点：<https://qiming-artspace.pages.dev>
> 后端服务：<https://github.com/lakewhisper1999/qiming-server>
> 管理后台：<https://github.com/lakewhisper1999/qiming-admin>

---

## ✨ 功能特性

- 作品集（平面 / 动效）、素材库、学习工程、图文笔记、提问箱
- WebGL 首页涟漪背景、自定义光标、玻璃砖导航等精致交互
- Mobile-first 响应式，深色 / 浅色主题
- **纯静态部署**：作品 / 图文数据来自 `public/data/works.json`，「关于我」来自 `public/data/site-config.json`，无需后端即可运行

## 🧱 技术栈

| 分类 | 技术 |
|------|------|
| 框架 | Vue 3（`<script setup>` + Composition API） |
| 构建 | Vite 5 |
| 路由 | Vue Router 4（hash 模式 `createWebHashHistory`） |
| 样式 | CSS 变量 + 原生 CSS（自定义设计系统） |
| 动效 | WebGL（首页涟漪）、CSS 过渡 |

## 📋 环境要求

- Node.js **18+**（推荐 20 LTS）
- npm（随 Node 自带）

## 🚀 快速开始（本地开发）

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器（默认端口 5173）
npm run dev

# 3. 浏览器打开 http://localhost:5173
```

本地开发时，`vite.config.js` 已配置代理，把 `/api`、`/uploads` 转发到 `http://localhost:8088`（需本地启动后端 [qiming-server](https://github.com/lakewhisper1999/qiming-server)）才能拉到实时数据。

## 📦 静态数据导出（用于无后端部署）

本项目可完全脱离后端部署：用导出脚本把数据库里的作品 / 图文 / 站点配置生成为静态 JSON，前端直接读取。

```bash
# 1. 准备本地 MySQL（与 qiming-server 同一库），并填写 .env
cp .env.example .env        # DB_HOST / DB_USER / DB_PASSWORD / DB_NAME ...

# 2. 安装脚本依赖并导出
npm install
npm run export:works
```

脚本会：
- 读取 `artwork` / `article` / `category` 表，把图片复制到 `public/media/`；
- 生成 `public/data/works.json`（作品 / 图文数据，**前端 Artwork / Article 直接读**）；
- 生成 `public/data/site-config.json`（站点配置，**含「关于我」`about_subtitle` / `about_content`，前端「关于」页直接读**）。

> 💡 **关于「后台 vs 前台 关于我 不一致」**：管理后台在数据库里编辑 `about_subtitle` / `about_content`；由于线上是纯静态站点（无后端），前端「关于」页改读 `public/data/site-config.json`，与后台编辑的是**同一份数据**。改完「关于我」后，直接运行 `npm run publish:works`（= 导出 + 提交 + 推送，会自动触发 Cloudflare 重新部署）即可前后台同步（与作品 / 图文一致）。

## 🚢 部署（Cloudflare Pages）

1. 构建：`npm run build`（产物输出到 `dist/`）。
2. Cloudflare Pages 连接仓库 `lakewhisper1999/qiming-artspace`：
   - **构建命令**：`npm run build`
   - **构建输出目录**：`dist`
   - **根目录**：留空（仓库根）
   - **环境变量**：`NODE_VERSION = 20`
3. 因使用 hash 路由，**无需**服务端 fallback；子路由刷新不会 404。
4. 媒体（图片）随 `dist/media/` 一起托管；视频（约 1.7G）走 B站 / YouTube 嵌入，不进仓库。

## 📁 目录结构

```
qiming-artspace/
├── index.html
├── vite.config.js           # base:'./'，/api、/uploads 代理到 8088
├── package.json
├── scripts/export-works.mjs # 数据库 → 静态 JSON 导出（含 site-config.json）
├── public/
│   ├── data/works.json       # 作品 / 图文（导出生成）
│   ├── data/site-config.json # 站点配置 / 关于我（导出生成）
│   └── media/                # 导出复制的图片
└── src/
    ├── main.js
    ├── App.vue
    ├── router/index.js
    ├── views/About.vue        # 关于页（读 site-config.json → /api → 默认值）
    ├── views/...              # 各业务页面
    └── components/...
```

## 🤝 参与贡献

欢迎提 Issue 与 PR。提交前请确保 `node_modules/`、`dist/`、`public/media/`（导出生成的媒体）已被 `.gitignore` 忽略，避免把大文件推上仓库。

## 📄 许可证

本项目基于 [MIT 许可证](LICENSE) 开源。© 2026 Kevin (lakewhisper1999)。

## 🔗 相关仓库

- 后端服务（接口/数据）：<https://github.com/lakewhisper1999/qiming-server>
- 管理后台：<https://github.com/lakewhisper1999/qiming-admin>
