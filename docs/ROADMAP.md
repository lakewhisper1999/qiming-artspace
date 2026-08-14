# 路线图（Roadmap）

> 本文件用 **Issue + 标签** 跟踪项目进展，前端「协作 · 进度」页会据此渲染看板。
> 所有条目都以 [GitHub Issue](https://github.com/lakewhisper1999/qiming-artspace/issues) 形式存在，本文仅做阶段性汇总。

## 当前阶段：协作体系上线（v1）

| 里程碑 | 状态 | 说明 |
|--------|------|------|
| GitHub Issues 需求流 | ✅ 已完成 | 3 套 Issue 表单模板 + 标签体系 |
| 协作文档体系 | ✅ 已完成 | CONTRIBUTING / ROADMAP / TASKBOARD / GITHUB_SETUP |
| 前端协作进度页 | ✅ 已完成 | `/collab` 路由：看板 / 提需求 / 文档 三 Tab |
| 快照自动刷新 | ✅ 已完成 | GitHub Action 定时 + Issue 变动触发 |

## 近期计划（Backlog → 进行中）

- [ ] 视频作品上线（B站嵌入 `video_url` → `export:works`）
- [ ] 管理后台增加「一键提 Issue」入口
- [ ] 前端协作页支持按里程碑（milestone）分组
- [ ] 贡献者排行榜（基于 Issue/PR 统计）

## 标签约定

标签集中在 `.github/labels.yml` 维护，前端看板按以下标签归类：

- `status:待办` / `status:进行中` / `status:待审核` —— 看板列归属（已关闭 = 完成）
- `P0:阻断` / `P1:高` / `P2:中` / `P3:暂缓` —— 优先级
- `type:功能` / `type:bug` / `type:内容` / `type:文档` —— 类型
- `area:前端` / `area:后端` / `area:后台` / `area:部署` —— 归属仓库

> 标签通过 `scripts/sync-labels.mjs` + `.github/labels.yml` 统一维护。
