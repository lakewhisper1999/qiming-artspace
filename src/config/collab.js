// =============================================================
// 协作进度页配置
// 集中管理要对接的 GitHub 仓库、分支，以及要在「协作文档」Tab
// 中展示的 Markdown 文件清单。改这里即可调整前端对接目标。
// =============================================================

export const COLLAB_REPO = 'lakewhisper1999/qiming-artspace'
export const COLLAB_BRANCH = 'main'

// 协作文档清单：前端「浏览文档」Tab 会按此列表从 raw.githubusercontent
// 实时拉取并渲染这些 Markdown（始终与仓库最新内容一致）。
export const COLLAB_DOCS = [
  { key: 'readme', label: '项目说明（README）', desc: '项目总览、技术栈与部署方式', path: 'README.md' },
  { key: 'contributing', label: '参与贡献（CONTRIBUTING）', desc: '如何提 Issue / PR、协作约定', path: '.github/CONTRIBUTING.md' },
  { key: 'roadmap', label: '路线图（ROADMAP）', desc: '里程碑与阶段性目标', path: 'docs/ROADMAP.md' },
  { key: 'taskboard', label: '任务看板（TASKBOARD）', desc: 'Issue / 标签 / 看板列的定义', path: 'docs/TASKBOARD.md' },
  { key: 'github-setup', label: '协作系统搭建（GITHUB_SETUP）', desc: '本协作体系的结构与脚本说明', path: 'docs/GITHUB_SETUP.md' },
]

// 「提交需求」表单可选的类型（对应 GitHub Issue 模板）
export const REQUEST_TYPES = [
  { value: 'feature', label: '✨ 功能需求', template: 'feature_request.yml' },
  { value: 'bug', label: '🐞 问题反馈', template: 'bug_report.yml' },
  { value: 'content', label: '🖼 内容上架', template: 'content_request.yml' },
  { value: 'other', label: '💬 其他', template: '' },
]
