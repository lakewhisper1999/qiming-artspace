/**
 * WebGL 水波纹常量
 */

// 最大涟漪数量（放宽以容纳鼠标跟随波纹 + 环境涟漪）
export const MAX_RIPPLES = 12

// 涟漪生命周期 (毫秒)
export const RIPPLE_LIFETIME = 2500

// 涟漪强度
export const RIPPLE_STRENGTH = {
  default: 0.025,
  click: 0.03,
}

// 涟漪着色器参数
export const SHADER_PARAMS = {
  // 波纹频率
  frequency: 30.0,
  // 波纹速度
  speed: 6.0,
  // 距离衰减
  distanceDecay: 3.5,
  // 时间衰减
  timeDecay: 1.8,
}
