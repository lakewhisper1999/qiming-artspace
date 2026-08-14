# 协作系统搭建说明（GitHub Setup）

本仓库把 **GitHub Issues + Markdown 文档** 当作轻量协作与进度管理系统，
并在前端「协作 · 进度」页（`/collab`）直接呈现。

## 系统结构

```
qiming-artspace/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── config.yml          # 关闭空白 Issue、引导先看协作页
│   │   ├── feature_request.yml # 功能需求表单
│   │   ├── bug_report.yml      # 问题反馈表单
│   │   └── content_request.yml # 内容上架表单
│   ├── labels.yml              # 标签定义（集中维护，单一事实源）
│   ├── PULL_REQUEST_TEMPLATE.md
│   ├── CONTRIBUTING.md         # 协作约定（含进度管理）
│   └── workflows/
│       └── update-collab.yml   # 定时 + Issue 变动刷新快照
├── docs/
│   ├── ROADMAP.md              # 路线图
│   ├── TASKBOARD.md            # 看板与标签说明
│   ├── GITHUB_PROJECT.md       # GitHub Project（看板/表格/迭代/自动化/洞察）实施步骤
│   └── GITHUB_SETUP.md         # 本文件
├── scripts/
│   ├── export-collab.mjs       # 生成 public/data/collab.json 快照
│   └── sync-labels.mjs         # 按 labels.yml 同步标签到仓库
├── public/data/collab.json     # 前端看板快照（自动生成）
└── src/
    ├── config/collab.js        # 仓库/分支/文档清单配置
    ├── utils/github.js         # 拉取 Issues + 构建提交链接
    ├── utils/markdown.js       # 安全渲染 Markdown（零依赖内置渲染器）
    └── views/Collab.vue        # 协作进度页（三 Tab）
```

## 数据流

```
GitHub Issues ──(API/快照)──▶ 前端 /collab 看板
       │                              │
       ├─ Issue 变动 ─▶ Action ─▶ 刷新 collab.json ─▶ 重新部署
       └─ PR 关联 ──▶ 合并后关闭 Issue ─▶ 看板「已关闭」
```

前端优先直连 `api.github.com`（公开仓库免 Token）；
限流/离线时回退到 `public/data/collab.json` 快照。

## 看板列与标签

前端看板按 `status:*` 标签分四列（详见 [TASKBOARD.md](TASKBOARD.md)）：

- 📥 待办：`status:待办`（或无 status 标签）
- 🚧 进行中：`status:进行中`
- 🔍 待审核：`status:待审核`（已合入待验收）
- ✅ 已关闭：Issue 已 closed

## 常用命令

```bash
# 生成本地快照（需 Node 18+，无需 Token 即可匿名拉取）
npm run export:collab
# 带 Token 提升限额（5000 次/小时）
GITHUB_TOKEN=xxx npm run export:collab

# 生成并提交快照（触发 Cloudflare 重部署）
npm run publish:collab

# 按 labels.yml 同步标签到仓库（需 Token，有写权限）
GITHUB_TOKEN=xxx node scripts/sync-labels.mjs
```

## 标签同步

标签集中在 `.github/labels.yml` 定义（中文标签为单一事实源，前端 `Collab.vue` 的
`classify()` 直接据此分列）。运行 `sync-labels.mjs` 会：
- 创建缺失的标签；
- 更新已存在标签的颜色/描述；
- 可选删除仓库中有但 yml 里没有的标签（`--purge`）。

> ⚠ 同步会改动仓库设置，请在确认 yml 正确后运行，并妥善保管 Token。
> ⚠ 标签名一旦修改，需同步改 `src/views/Collab.vue` 的 `classify()` 与 `src/utils/markdown.js` 的配色映射。
