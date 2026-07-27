export const artworks = [
  {
    id: 1, title: '弧光作战 · 封面设计', category: '平面及动效作品',
    description: '明日方舟「弧光作战」系列委托封面，采用赛博朋克风格配色，强调速度感与科技感。',
    coverUrl: 'https://picsum.photos/seed/ark1/600/400', viewCount: 2341, date: '2025.08',
    /* === 数据库预留字段 === */
    downloadUrl: null,       // 数据库: download_url VARCHAR(512)  -- 下载文件路径
    fileSize: null,          // 数据库: file_size BIGINT           -- 文件大小(byte)
    downloadCount: 0,        // 数据库: download_count INT DEFAULT 0
  },
  {
    id: 2, title: '红丝绒 · 视觉排版', category: '平面及动效作品',
    description: '优雅的红丝绒质感排版，运用经典衬线字体与金色点缀，营造高级感。',
    coverUrl: 'https://picsum.photos/seed/ark2/600/400', viewCount: 1856, date: '2025.07',
    downloadUrl: null, fileSize: null, downloadCount: 0,
  },
  {
    id: 3, title: '矢量突破 · 角色海报', category: '平面及动效作品',
    description: '矢量风格角色海报，几何线条与渐变色彩结合，呈现独特的视觉冲击力。',
    coverUrl: 'https://picsum.photos/seed/ark3/600/400', viewCount: 3200, date: '2025.06',
    downloadUrl: null, fileSize: null, downloadCount: 0,
  },
  {
    id: 4, title: '众生行记 · UI界面', category: '学习工程',
    description: '游戏化UI界面设计，包含主菜单、角色选择、装备栏等多个交互模块。',
    coverUrl: 'https://picsum.photos/seed/ark4/600/400', viewCount: 1520, date: '2025.05',
    downloadUrl: null, fileSize: null, downloadCount: 0,
  },
  {
    id: 5, title: '离解复合 · 品牌VI', category: '平面及动效作品',
    description: '科技品牌视觉识别系统，包含Logo设计、色彩规范、字体系统和应用示例。',
    coverUrl: 'https://picsum.photos/seed/ark5/600/400', viewCount: 980, date: '2025.04',
    downloadUrl: null, fileSize: null, downloadCount: 0,
  },
  {
    id: 6, title: '挽歌燃烧殆尽 · 插画', category: '素材库',
    description: '氛围感插画作品，暖色调与冷色调的碰撞，表达燃烧与消逝的意境。',
    coverUrl: 'https://picsum.photos/seed/ark6/600/400', viewCount: 4100, date: '2025.03',
    downloadUrl: null, fileSize: null, downloadCount: 0,
  },
  {
    id: 7, title: '净罪行动 · 动态海报', category: '平面及动效作品',
    description: '带有动态效果的概念海报，运用视差与光效营造紧张氛围。',
    coverUrl: 'https://picsum.photos/seed/ark7/600/400', viewCount: 2750, date: '2025.02',
    downloadUrl: null, fileSize: null, downloadCount: 0,
  },
  {
    id: 8, title: '相见欢 · 字体设计', category: '图文笔记',
    description: '中文字体设计实验，融合传统书法与现代几何造型。',
    coverUrl: 'https://picsum.photos/seed/ark8/600/400', viewCount: 1680, date: '2025.01',
    downloadUrl: null, fileSize: null, downloadCount: 0,
  },
]

export const categories = ['全部', '平面及动效作品', '素材库', '学习工程', '图文笔记']
