# 任务看板（Task Board）

「启明艺术空间」用 **GitHub Issues 当作任务看板**，无需额外项目管理工具。

## 看板列

前端「协作 · 进度」页把 Issue 归入四列（与 `.github/labels.yml` 的 `status:*` 标签一一对应）：

| 看板列 | 归类规则 |
|--------|----------|
| 📥 待办 | 状态为 open，且未带 `status:进行中` / `status:待审核` |
| 🚧 进行中 | 状态为 open，且带 `status:进行中` 标签 |
| 🔍 待审核 | 状态为 open，且带 `status:待审核` 标签（代码已合入，等待验收） |
| ✅ 已关闭 | 状态为 closed（验收通过，正式完成） |

> 看板数据是「单一事实源」：一切以 GitHub Issue 的标签与状态为准，文档只做汇总。

## 标签体系

标签是看板的「维度」。创建 Issue 时至少打一个 `type:*` 与一个 `status:*`（Issue 模板会自动带上）。

| 前缀 | 含义 | 示例 |
|------|------|------|
| `status:` | 进度（决定列归属） | `status:待办` / `status:进行中` / `status:待审核` |
| `P0~P3:` | 优先级 | `P0:阻断` / `P1:高` / `P2:中` / `P3:暂缓` |
| `type:` | 类型（模板自动打） | `type:功能` / `type:bug` / `type:内容` / `type:文档` |
| `area:` | 归属仓库 | `area:前端` / `area:后端` / `area:后台` / `area:部署` |

## 如何更新看板状态

1. 新人认领 → 把 `status:待办` 改成 `status:进行中`，卡片从「待办」移到「进行中」。
2. 开发完成、PR 合入 → 打 `status:待审核`，进入「待审核」列等待验收。
3. 验收通过 → 关闭 Issue，进入「已关闭」列。
4. 看板数据由 `scripts/export-collab.mjs` 导出为 `public/data/collab.json` 快照，
   GitHub Action 在 Issue 变动后自动刷新，前端最长 6 小时也会定时更新。

## 与代码的关联

- Issue 用 `Closes #12` / `Related to #3` 关联 PR。
- 合并 PR 后关闭对应 Issue，看板自动反映完成。
