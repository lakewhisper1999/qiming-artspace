# 参与贡献

感谢你关注「启明艺术空间」！这是个人创作空间的全栈示例（前端 + 后端 + 管理后台），欢迎学习、提 Issue 和 PR。

## 仓库结构
- `qiming-artspace`：Vue 3 + Vite 前端（已部署 Cloudflare Pages：`https://qiming-artspace.pages.dev`）
- `qiming-server`：Spring Boot 2.7 + MyBatis-Plus 后端
- `qiming-admin`：Vue 3 + Element Plus 管理后台

> 三个仓库相互独立，本文件所在的仓库是其中之一。

## 提交 Issue
1. 先搜索是否已有类似 Issue。
2. 使用 Issue 模板，填写复现步骤 / 期望行为 / 环境信息。

## 提交 PR
1. Fork 本仓库，基于默认分支创建特性分支：`git checkout -b feat/your-feature`。
2. 改动尽量聚焦单一主题，遵循现有代码风格（前端 ESLint、后端保持现有风格）。
3. 本地确认可运行后再提交。
4. 在 PR 中说明目的与验证方式，关联相关 Issue（如 `Closes #12`）。
5. 等待 review 合并。

## 协作与进度管理
本项目用 **GitHub Issues + Markdown 文档** 做轻量协作与进度管理。

- **提需求 / 报 Bug**：使用 Issue 模板（功能需求 / 问题反馈 / 内容上架）。请至少打一个 `type:` 标签与一个 `status:待办`。
- **进度看板**：Issue 按 `status:*` 标签归入「待办 / 进行中 / 待审核 / 已关闭」，前端 `/collab` 页实时呈现。
- **标签**：集中在 `.github/labels.yml` 维护，运行 `node scripts/sync-labels.mjs`（需 Token）同步。
- **看板快照**：`scripts/export-collab.mjs` 生成 `public/data/collab.json`，GitHub Action 在 Issue 变动后自动刷新。
- **文档**：路线图、看板说明、搭建说明见 `docs/` 目录，前端可直接浏览。

详细结构见 [docs/GITHUB_SETUP.md](../docs/GITHUB_SETUP.md)。

## 许可
本项目以 MIT 协议开源，提交代码即表示同意以相同协议授权。
