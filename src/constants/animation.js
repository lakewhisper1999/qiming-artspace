/**
 * 动画常量配置
 * 统一项目中的动画时长和缓动函数
 */

// 缓动函数
export const EASING = {
  // 平滑缓出 - 用于 iris 收束、页面过渡
  smooth: 'cubic-bezier(0.77, 0, 0.175, 1)',
  // 弹性 - 用于导航展开
  bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  // 标准缓出 - 用于目录弹出
  standard: 'cubic-bezier(0.16, 1, 0.3, 1)',
}

// 动画时长 (毫秒)
export const DURATION = {
  // 首页 loading 停留
  loading: 1500,
  // iris 收束动画
  iris: 1000,
  // 页面切换动画
  pageTransition: 600,
  // 导航展开
  navExpand: 350,
  // logo 发光循环
  logoGlow: 1500,
  // 标记浮现
  markPop: 500,
  // 标记消失
  markLeave: 500,
}

// 延迟时间 (毫秒)
export const DELAY = {
  // 导航项展开延迟
  navItem: 50,
  // 目录项展开延迟
  catalogItem: 40,
}
