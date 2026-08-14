# GitHub Project 管理实施步骤（启明艺术空间）

> 依据 GitHub 官方文档（Projects V2）+ 本系统「`lakewhisper1999/qiming-artspace`」的具体约定编写。
> 每条步骤标注**操作路径**（官方 UI 标签，英文/中文对照）与**对应系统要求**，确保可落地执行。
> 官方文档索引见文末「参考来源」。

---

## 0. 背景与关键决策（先读）

本系统已有的协作底座：

| 资产 | 说明 |
| --- | --- |
| 仓库 | `lakewhisper1999/qiming-artspace`（Public，默认分支 `main`，Issues 已开启） |
| Issue 标签（单一事实源 `labels.yml`） | `status:待办` / `status:进行中` / `status:待审核`、`type:功能`/`bug`/`内容`/`文档`、`P0:阻断`~`P3:低`、`area:*` |
| Issue 模板 | `feature_request` / `bug_report` / `content_request`（自动打 `type:*` + `status:待办`） |
| 前端 `/collab` 页 | 直连 GitHub API，按 **`status:*` 标签** 把 Issue 归入「待办/进行中/待审核/已关闭」四列 |
| 快照 | `.github/workflows/update-collab.yml` 定期生成 `public/data/collab.json` |

**两个必须明确的决策点：**

1. **层级选择（User 级）**：当前仓库归属个人账号 `lakewhisper1999`，因此建 **User 级 Project**（个人账号下的项目可跟踪该账号仓库的 Issue/PR）。若日后成立组织（Org）协作，再建 Org 级项目即可（见 §1 对比）。
2. **状态双重来源如何对齐**：前端 `/collab` 依赖 **`status:*` 标签**（公开、免 Token 可读）；GitHub Project 看板按 Project 自有 **`状态` 单选项字段**分组（Board 列字段仅支持单选项/迭代字段，不支持直接按「多选标签」分组）。
   → **结论**：`status:*` 标签是前端状态的唯一源；Project 作为**规划/跟踪层**，其 `状态` 字段镜像标签值。二者通过「约定 + 内置自动化」保持同步（详见 §5）。

---

## 1. 创建 Project（User 级 vs Org 级）

### 操作路径
- **User 级（本次采用）**：
  1. 右上角点击头像 → **Your profile**（你的个人资料）。
  2. 进入个人主页后点击 **Projects**（项目）。
  3. 点击 **New project**（新建项目）。
  4. 在 "Start from scratch"（从零开始）下选择模板：**Table**（表格）/ **Roadmap**（路线图）/ **Board**（看板）。
     - 推荐选 **Board**，后续再补表格/路线图视图。
  5. 在 "Project name" 下输入名称，例如 `启明艺术空间 · 协作进度`。
  6. 点击 **Create project**（创建项目）。
- **Org 级（团队场景）**：
  1. 右上角头像 → **Organizations**（你的组织）→ 进入组织。
  2. 组织名下方点击 **Projects** → **New project**。
  3. 选择模板（Org 还可将项目设为模板、推荐模板给成员）。
  4. 可选：勾选 **Import items from repository**（从仓库导入条目，仅 Org 级有），自动把该仓库已有/新建 Issue 加入项目并设为默认仓库。
  5. 输入名称 → **Create project**。

### 对应系统要求
- 名称建议包含「启明 / qiming」，便于在 `/collab` 文档区引用。
- User 级已足够覆盖单人维护；Org 级优势是**团队共享视图、项目模板、推荐模板**——当引入协作者时再迁移。

---

## 2. 配置视图（Board / Table / Roadmap）

### 操作路径
- **切换布局**：当前视图搜索栏旁点击 **View** → 在 "Layout"（布局）下点 **Table** / **Board** / **Roadmap**。
- **看板分组（关键）**：进入 Board 视图后，点击 **Group by**（分组依据）→ 选择 **状态**（即 §3 自建的「状态」单选项字段）。
  - 官方说明：Board 列字段可设为 Status，或任意**单选项 / 迭代字段**；拖动卡片跨列时，该卡片对应字段值会自动更新为列的值。
- **表格视图**：点击列头 **＋ / Add field** 控制显示字段；用 **Sort**（排序）按「优先级 → 迭代」排序；用 **Filter**（筛选）按标签/负责人过滤。
- **保存多视图**：每配置好一个布局（看板/表格/路线图）即自动成为一个可切换的 View，可重命名（如「看板」「进度表」「路线图」）。

### 对应系统要求
| 视图 | 配置 | 对齐前端 |
| --- | --- | --- |
| 看板 Board | Group by = `状态` | 与 `/collab` 四列（待办/进行中/待审核/已关闭）一致 |
| 表格 Table | 显示 `状态`+`优先级`+`迭代`+`负责人`+`类型` | 作为筛选/排序工作台 |
| 路线图 Roadmap | Group by = `迭代`（Iteration） | 按 Sprint 时间轴看排期 |

---

## 3. 定义自定义字段（匹配系统需求）

> 字段上限：每个项目最多 **50 个字段**（含内置与自定义）。添加方式：表格视图末尾点击 **＋** 新建字段，或项目右上角菜单 → **Settings**（设置）→ **Fields**（字段）→ **Add field**（添加字段）。

### 3.1 状态（单选项，镜像 `status:*` 标签）
- 类型：**Single select**（单选项）。
- 选项与颜色（与标签一一对应）：
  - `待办`（灰，对应 `status:待办`）
  - `进行中`（蓝，对应 `status:进行中`）
  - `待审核`（橙，对应 `status:待审核`）
  - `已完成`（绿，对应 Issue 关闭态）
- 用途：Board 的 Group by 字段。

### 3.2 优先级（单选项，镜像 `P0~P3`）
- 类型：**Single select**。
- 选项：
  - `P0:阻断`（红） / `P1:高`（橙） / `P2:中`（黄） / `P3:低`（蓝/灰）
- 用途：排序首要键；前端 `/collab` 亦按 `P0~P3` 标签排序（保持一致）。

### 3.3 类型（单选项，镜像 `type:*`）— 可选
- 类型：**Single select**。
- 选项：`功能` / `bug` / `内容` / `文档`（对应 `type:功能` 等）。
- 说明：`type:*` 标签已在前端/Issue 模板中存在，此字段为 Project 内便捷分组用，可省略以免重复维护。

### 3.4 迭代周期（Iteration 字段，Sprint）
- 类型：**Iteration**（迭代）。
- 配置：添加迭代字段后，进入其设置 → **Add current and next iteration**（添加当前与下一迭代）/ **Add iteration**（添加迭代）；设置每期**时长**（建议 2 周）、**开始日期**，并可标记**休息周（break）**。
- 用途：路线图分组、Insights 燃尽图数据源。

### 3.5 负责人（用内置 Assignee）
- 直接用 GitHub 内置 **Assignee**（受理人）字段，而非自定义字段——它**双向同步**到 Issue 本身。
- 看板可 Group by = Assignee，拖动卡片即改派。

### 3.6 区域（单选项，镜像 `area:*`）— 可选
- 类型：**Single select**，选项对齐 `area:前端`/`area:后端`/`area:管理后台` 等。用于大项目内部分流，小作坊可暂缓。

---

## 4. 将 Issues 与 Pull Requests 关联到 Project

### 4.1 自动加入（推荐，零手动）
- 路径：项目右上角菜单 → **Workflows**（工作流）→ **Add workflow**（添加工作流）→ 选择 "Auto-add"（自动添加）/ "Items added from repository" 类。
- 筛选条件示例（符合即自动进项目）：
  - `repo:lakewhisper1999/qiming-artspace is:issue` —— 该仓库所有 Issue 自动纳入；
  - 或 `repo:lakewhisper1999/qiming-artspace label:status:待办` —— 仅待办自动纳入。
- 官方说明：可配置「当仓库中 Issue/PR 满足筛选条件时自动加入项目」。

### 4.2 手动加入（单次/补录）
- **粘贴 URL**：项目底部空行粘贴 Issue/PR 链接 → 回车。
- **搜索**：底部行输入 `#` → 选仓库 → 选 Issue/PR。
- **从 Issue/PR 页面**：打开 Issue/PR → 侧栏 **Projects** → 选择本项目（可顺带填自定义字段）。
- **仓库列表批量**：仓库 **Issues** 或 **Pull requests** 列表 → 勾选多条 → 顶部 **Projects** → 选本项目。
- **命令面板**：项目内按 `Ctrl/Cmd + K` → 输入 "Add items" → 选条目。

### 4.3 PR 关联
- PR 与 Issue 同样可作为项目条目；PR 合并后由内置自动化置「已完成」（见 §5）。
- 建议在 PR 描述用 `Closes #issue号` 关联 Issue，形成可追溯链路。

---

## 5. 自动化规则（卡片状态流转）

### 操作路径
- 项目右上角菜单 → **Workflows**（工作流）→ **Default workflows**（默认工作流）→ 点某条 → 右上 **Edit**（编辑）→ 调整 → **Save and turn on workflow**（保存并启用）。

### 内置默认（创建即启用，建议保留）
1. **Issue/PR 关闭 → 状态 = 已完成（Done）**。
2. **PR 合并 → 状态 = 已完成（Done）**。

### 推荐新增的规则
| 规则 | 触发 → 动作 | 对应系统要求 |
| --- | --- | --- |
| 新建即待办 | Item added to project → 状态 = `待办` | 镜像 Issue 模板自动打的 `status:待办` |
| 新建即排入当期 | Item added to project → 迭代 = 当前迭代 | 新需求自动进入本期 Sprint |
| 自动归档 | 状态 = 已完成 且满 N 天 → Archive | 看板清爽（可选） |
| 自动纳入 | repo 中新建 `status:待办` Issue → 加入项目 | 与 §4.1 二选一即可 |

### ⚠️ 同步约定（落地最关键的一环）
内置自动化**没有**「标签变化 → 改字段」这类触发器（官方内置仅覆盖 加入/关闭/合并）。因此 `status:*` 标签 与 Project `状态` 字段的**双向一致靠约定**：
- 关闭 Issue：内置自动化把 Project `状态` 置「已完成」；同时 Issue 失去 `status:*` 活动标签（前端归入「已关闭」列）——**两端自动对齐**。
- 进行中 / 待审核：负责人在 Board 拖动卡片改 `状态` 时，**同步手动打对应 `status:*` 标签**（一次动作两处生效），保证前端 `/collab` 与看板一致。
- 进阶（可选，超出原生）：若要做「标签↔状态」全自动双向同步，需用 **Projects V2 GraphQL API** 或 **GitHub Actions** 监听 `labeled` 事件——本系统暂不强制，留作后续增强（思路见 `scripts/` 可扩展）。

---

## 6. 设置迭代（Sprint）并分配负责人

### 操作路径
- **建 Sprint**：见 §3.4（Iteration 字段 → Add iteration，2 周一期、可设休息周）。
- **排期**：路线图（Roadmap）视图按 `迭代` 分组，拖动卡片改其所属迭代/起止。
- **分配负责人**：表格/看板中设置 **Assignee**（受理人）；看板 Group by = Assignee 后，拖动卡片即改派，且同步回 Issue。
- **节奏建议**（小作坊轻量版）：
  - 每 Sprint = 2 周；周一做规划（把待办拖入「进行中」+ 排迭代），周五做评审/回顾。
  - 用项目侧栏 **Status update**（状态更新）写每周一句话进展（On track / At risk）。

### 对应系统要求
- `优先级` 决定 Sprint 内取舍（P0 优先）。
- `迭代` 与前端无关，仅作内部管理；前端 `/collab` 暂不展示迭代，保持简单。

---

## 7. 通过 Insights 跟踪进度

### 操作路径
- 项目内打开 **Insights**（洞察/见解）视图。
- **内置图表**：燃起图（burnup，状态随时间变化）、当前活动（current activity）等，可直接套用筛选。
- **自定义图表**：点击新建图表 → 设筛选条件、图表类型（柱状/饼图/折线）、展示维度 → 保存，对项目可见者均可看。
- **推荐自建图表**：
  - 「按优先级分布」：柱状图，X=优先级，看 P0/P1 堆积。
  - 「按状态分布」：饼图/柱状，X=状态，看待办/进行中/待审核占比。
  - 「迭代燃尽」：burnup，按 `迭代` 看完成趋势。
- **分享/复盘**：图表可分享；结合 §6 的 Status update 做周复盘。

### 对应系统要求
- Insights 数据来自项目条目，与看板/表格同源，无需额外维护。
- 若前端 `/collab` 将来也想展示统计，可复用 `collab.json` 快照里的 `stats`（见现有 `export-collab.mjs`）。

---

## 8. 落地清单（一次性初始化）

1. [ ] 建 User 级 Project（Board 模板），命名 `启明艺术空间 · 协作进度`。
2. [ ] 加字段：`状态`(单选项 4 项) / `优先级`(P0~P3) / `迭代`(Iteration) ；`类型`/`区域` 可选。
3. [ ] 配视图：看板（Group by=状态）、表格（显示上述字段+Assignee）、路线图（Group by=迭代）。
4. [ ] 关联：开启自动加入工作流（`repo:lakewhisper1999/qiming-artspace is:issue`）；历史 Issue 用 §4.2 批量补录。
5. [ ] 自动化：保留默认两条（关闭/合并→已完成）；新增「加入即待办」「加入即排当期」。
6. [ ] 同步约定：团队认知「拖动看板时同步打 `status:*` 标签」。
7. [ ] Insights：建 3 张自定义图表（优先级/状态/迭代）。
8. [ ] 前端 `/collab` 已就绪（只读 `status:*` 标签），无需改动；如需把 Project 状态也喂给前端，留作后续 GraphQL/Action 增强。

---

## 参考来源（GitHub 官方文档）
- Creating a project（创建项目 / User vs Org）：`docs.github.com/en/issues/planning-and-tracking-with-projects/creating-projects/creating-a-project`
- About Projects（项目概述 / 用户级与组织级 / 双向同步）：`.../learning-about-projects/about-projects`
- Understanding fields（字段类型 / 单选项 / 迭代）：`.../understanding-fields`
- Changing the layout of a view（Table/Board/Roadmap / 分组）：`.../customizing-views-in-your-project/changing-the-layout-of-a-view`
- Adding items to your project（关联 Issue/PR / 自动加入）：`.../managing-items-in-your-project/adding-items-to-your-project`
- Using the built-in automations（内置自动化 / 工作流）：`.../automating-your-project/using-the-built-in-automations`
- Viewing insights from your project（洞察图表）：`.../viewing-insights-from-your-project`
