<template>
  <div class="home-bg-wrapper">
    <canvas v-if="!useFallback" ref="canvasRef" class="water-canvas"></canvas>
    <div v-else class="bg-fallback" role="img" aria-label="启明艺术空间背景"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { MAX_RIPPLES, RIPPLE_LIFETIME, SHADER_PARAMS } from '../constants/ripple.js'

const canvasRef = ref(null)

// 是否「减少动态效果」（系统级无障碍偏好，也利于省电）
const reduceMotion = typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

// 是否移动端（触屏 / 小屏 / 移动 UA）—— 移动端 GPU 弱、易丢上下文，直接走静态图
const isMobileDevice = () => {
  if (typeof window === 'undefined') return false
  const coarse = window.matchMedia('(pointer: coarse)').matches
  const small = window.matchMedia('(max-width: 820px)').matches
  const ua = /Android|iPhone|iPad|iPod|Mobile|Windows Phone/i.test(navigator.userAgent)
  return coarse || small || ua
}

// 浏览器是否支持 WebGL（创建离屏 canvas 试探，避免某些设备初始化即报错）
const isWebglSupported = () => {
  if (typeof window === 'undefined') return false
  try {
    const c = document.createElement('canvas')
    return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')))
  } catch (e) {
    return false
  }
}
// 移动端 / 不支持 WebGL / 上下文丢失 → 显示完整背景图（home-bg.png），避免渲染失败与高耗电
const useFallback = ref(false)
if (typeof window !== 'undefined') {
  useFallback.value = isMobileDevice() || !isWebglSupported()
}

// WebGL 上下文和状态
let animationId = null
let ambientTimer = null
let gl = null
let program = null
let texture = null
let textureImage = null
let imageAspect = 1.0
let localRipples = []

// 鼠标连续水痕状态（平滑跟随光标，强度随移动速度变化，停下自然消散 —— 避免离散波纹的顿挫感）
let mouseTarget = { x: 0.5, y: 0.5 }
let mouseSmooth = { x: 0.5, y: 0.5 }
let mouseVel = 0
let mouseActive = 0
let mouseInside = false
let pointerMoveHandler = null
let pointerLeaveHandler = null
let contextLostHandler = null
let uMouseLoc = null
let uMouseStrengthLoc = null

// 缓存的 uniform 位置（避免每帧查询）
let uTimeLoc = null
let uResolutionLoc = null
let uCoverRatioLoc = null
let uRippleCountLoc = null
let uRippleCentersLoc = []
let uRippleTimesLoc = []
let uRippleStrengthsLoc = []

// 顶点着色器源码
const vertexSrc = `
  attribute vec2 a_position;
  varying vec2 v_uv;
  void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`

// 片段着色器源码
const fragmentSrc = `
  precision mediump float;
  varying vec2 v_uv;
  uniform sampler2D u_texture;
  uniform float u_time;
  uniform vec2 u_resolution;
  uniform vec2 u_coverRatio;
  uniform int u_rippleCount;
  uniform vec2 u_rippleCenters[${MAX_RIPPLES}];
  uniform float u_rippleTimes[${MAX_RIPPLES}];
  uniform float u_rippleStrengths[${MAX_RIPPLES}];
  uniform vec2 u_mouse;            // 平滑跟随后的光标位置（uv）
  uniform float u_mouseStrength;   // 水痕强度（随移动速度变化，停下趋近 0）

  // 分形杂色（值噪声 + fbm）—— 给高光叠加水面微光闪烁，模拟真实水面阵阵反光
  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 4; i++) {
      v += amp * vnoise(p);
      p *= 2.0;
      amp *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vec2(v_uv.x, 1.0 - v_uv.y);
    vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);

    // object-fit: cover —— 保持图片比例、居中裁切，避免在不同屏幕比例下被压扁
    vec2 baseUv = (uv - 0.5) * u_coverRatio + 0.5;

    vec2 displacement = vec2(0.0);
    vec2 grad = vec2(0.0);  // 涟漪高度场梯度，用于构造水面法线/反光
    float field = 0.0;      // 扰动强度场（径向衰减：中心强、边缘柔），用于调制高光

    // 响应显式触发的扩散涟漪（点击 / 停留 / 鼠标跟随）
    for (int i = 0; i < ${MAX_RIPPLES}; i++) {
      if (i >= u_rippleCount) break;
      vec2 center = u_rippleCenters[i];
      center.y = 1.0 - center.y;
      float t = u_time - u_rippleTimes[i];
      if (t < 0.0 || t > 2.5) continue;
      vec2 d = (uv - center) * aspect;
      float dist = length(d);
      float env = exp(-dist * ${SHADER_PARAMS.distanceDecay.toFixed(1)}) * exp(-t * ${SHADER_PARAMS.timeDecay.toFixed(1)});
      float wave = sin(dist * ${SHADER_PARAMS.frequency.toFixed(1)} - t * ${SHADER_PARAMS.speed.toFixed(1)}) * env * u_rippleStrengths[i];
      vec2 dir = normalize(uv - center + 0.0001);
      displacement += dir * wave;
      // 波高对 uv 的偏导（沿 dir 方向），用于构造水面法线
      float dWave = cos(dist * ${SHADER_PARAMS.frequency.toFixed(1)} - t * ${SHADER_PARAMS.speed.toFixed(1)}) * ${SHADER_PARAMS.frequency.toFixed(1)} * env * u_rippleStrengths[i];
      grad += dir * dWave;
      field += env * u_rippleStrengths[i];
    }

    // 鼠标连续跟随水痕：宽幅 + 低频 + 慢速 → 像水面被拖动拉出的顺滑波纹，而非生硬窄划痕
    vec2 m = u_mouse;
    m.y = 1.0 - m.y;
    vec2 md = (uv - m) * aspect;
    float md2 = length(md);
    float ring = exp(-md2 * 3.0);                       // 更宽的水痕范围，消除「阻塞感」
    field += u_mouseStrength * ring;
    float mwave = sin(md2 * 10.0 - u_time * 2.2);       // 低频 + 慢速演化 → 顺滑水波
    float wake = u_mouseStrength * ring * mwave;
    vec2 mdir = normalize(uv - m + 0.0001);
    displacement += mdir * wake;
    // 水痕对 uv 的偏导，并入梯度参与反光（与上面的频率/速度严格一致）
    float dWake = u_mouseStrength * ring * (cos(md2 * 10.0 - u_time * 2.2) * 10.0 - sin(md2 * 10.0 - u_time * 2.2) * 3.0);
    grad += mdir * dWake;

    // 水面反光高光：涟漪梯度 → 法线 → 半程向量高光，制造 3D 立体水感（克制、柔和）
    vec3 N = normalize(vec3(-grad * 1.6, 1.0));
    vec3 L = normalize(vec3(0.4, 0.7, 0.85));
    vec3 V = vec3(0.0, 0.0, 1.0);
    vec3 H = normalize(L + V);
    float spec = pow(max(dot(N, H), 0.0), 16.0);

    // 分形杂色微光：随时间缓慢流动（演化） + 正弦循环衰减，模拟真实水面阵阵闪烁的微光
    vec2 nuv = uv * 7.0 + vec2(u_time * 0.06, u_time * 0.04);
    float n = fbm(nuv);
    float decay = 0.5 + 0.5 * sin(u_time * 0.22);          // 0..1 缓慢循环呼吸（模拟衰减）
    float glint = pow(n, 3.0) * decay;                       // 锐化亮点 + 循环衰减

    // 高光径向衰减：field 是扰动强度场（涟漪/水痕中心最强、随距离平滑趋零）
    // → 高光只在扰动处显现，中心亮、边缘柔，静止水面保持平静
    // 衰减放缓（0.5→0.2）：扰动边缘也能带出微光，不再「戛然而止」
    float fieldSoft = smoothstep(0.0, 0.2, clamp(field * 2.4, 0.0, 1.0));
    // 基础高光与分形微光均调强（spec 0.16→0.30，glint 0.10→0.16），更贴近真实水面反光
    vec3 highlight = (spec * 0.30 + glint * 0.16) * vec3(0.85, 0.92, 1.0) * fieldSoft;

    gl_FragColor = texture2D(u_texture, clamp(baseUv + displacement, 0.001, 0.999)) + vec4(highlight, 0.0);
  }
`

/**
 * 加载并编译着色器
 * @param {WebGLRenderingContext} gl - WebGL 上下文
 * @param {number} type - 着色器类型
 * @param {string} source - 着色器源码
 * @returns {WebGLShader|null} 编译后的着色器
 */
const loadShader = (gl, type, source) => {
  const shader = gl.createShader(type)
  gl.shaderSource(shader, source)
  gl.compileShader(shader)

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('[HomeBg] Shader compile error:', gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }
  return shader
}

/**
 * 初始化 WebGL 上下文和程序
 * @param {HTMLCanvasElement} canvas - Canvas 元素
 * @returns {boolean} 初始化是否成功
 */
const initGL = (canvas) => {
  gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
  if (!gl) {
    console.warn('[HomeBg] WebGL not supported')
    return false
  }

  const vs = loadShader(gl, gl.VERTEX_SHADER, vertexSrc)
  const fs = loadShader(gl, gl.FRAGMENT_SHADER, fragmentSrc)
  if (!vs || !fs) return false

  program = gl.createProgram()
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('[HomeBg] Program link error:', gl.getProgramInfoLog(program))
    return false
  }
  gl.useProgram(program)

  // 缓存所有 uniform 位置
  uTimeLoc = gl.getUniformLocation(program, 'u_time')
  uResolutionLoc = gl.getUniformLocation(program, 'u_resolution')
  uCoverRatioLoc = gl.getUniformLocation(program, 'u_coverRatio')
  uRippleCountLoc = gl.getUniformLocation(program, 'u_rippleCount')
  uMouseLoc = gl.getUniformLocation(program, 'u_mouse')
  uMouseStrengthLoc = gl.getUniformLocation(program, 'u_mouseStrength')

  for (let i = 0; i < MAX_RIPPLES; i++) {
    uRippleCentersLoc[i] = gl.getUniformLocation(program, `u_rippleCenters[${i}]`)
    uRippleTimesLoc[i] = gl.getUniformLocation(program, `u_rippleTimes[${i}]`)
    uRippleStrengthsLoc[i] = gl.getUniformLocation(program, `u_rippleStrengths[${i}]`)
  }

  // 设置顶点数据
  const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1])
  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)

  const aPosition = gl.getAttribLocation(program, 'a_position')
  gl.enableVertexAttribArray(aPosition)
  gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0)

  return true
}

/**
 * 加载纹理
 * @param {WebGLRenderingContext} gl - WebGL 上下文
 * @param {string} url - 图片 URL
 * @returns {Promise<WebGLTexture|null>} 纹理对象
 */
const loadTexture = (gl, url) => {
  return new Promise((resolve) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'

    image.onload = () => {
      const tex = gl.createTexture()
      gl.bindTexture(gl.TEXTURE_2D, tex)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      textureImage = image
      resolve(tex)
    }

    image.onerror = () => {
      console.error('[HomeBg] Failed to load texture:', url)
      resolve(null)
    }

    image.src = url
  })
}

/**
 * 调整 Canvas 大小
 * @param {HTMLCanvasElement} canvas - Canvas 元素
 */
const resize = (canvas) => {
  const dpr = window.devicePixelRatio || 1
  const w = window.innerWidth
  const h = window.innerHeight

  canvas.width = w * dpr
  canvas.height = h * dpr
  canvas.style.width = w + 'px'
  canvas.style.height = h + 'px'

  if (gl) {
    gl.viewport(0, 0, canvas.width, canvas.height)
    updateCoverRatio()
  }
}

/**
 * 计算并设置 object-fit: cover 的 UV 缩放比例
 * 让背景图始终填满画布、保持原始比例、居中裁切溢出部分（手机/电脑都不会被压扁）
 */
function updateCoverRatio() {
  if (!gl || !uCoverRatioLoc) return
  const cw = canvasRef.value?.width || 1
  const ch = canvasRef.value?.height || 1
  const canvasAspect = cw / ch
  const rx = Math.min(canvasAspect / imageAspect, 1.0)
  const ry = Math.min(imageAspect / canvasAspect, 1.0)
  gl.uniform2f(uCoverRatioLoc, rx, ry)
}

/**
 * 清理过期涟漪
 * @param {number} t - 当前时间（秒）
 */
const cleanupRipples = (t) => {
  const lifetime = RIPPLE_LIFETIME / 1000
  localRipples = localRipples.filter(r => t - r.time < lifetime)

  if (localRipples.length > MAX_RIPPLES) {
    localRipples = localRipples.slice(-MAX_RIPPLES)
  }
}

/**
 * 渲染循环
 * @param {number} time - 当前时间戳
 */
const render = (time) => {
  if (!gl || !program) return

  const t = time * 0.001
  cleanupRipples(t)

  // 平滑跟随光标：每帧把平滑点拉向目标点，按「本帧实际位移」估算速度，水痕强度随之增减，停下自然消散
  const px = mouseSmooth.x, py = mouseSmooth.y
  mouseSmooth.x += (mouseTarget.x - mouseSmooth.x) * 0.5
  mouseSmooth.y += (mouseTarget.y - mouseSmooth.y) * 0.5
  const frameSpeed = Math.hypot(mouseSmooth.x - px, mouseSmooth.y - py)
  mouseVel += (frameSpeed - mouseVel) * 0.2
  const targetA = mouseInside ? Math.min(mouseVel * 25.0, 1.0) : 0.0
  mouseActive += (targetA - mouseActive) * 0.08
  // 鼠标位置：x 不翻，y 已在 pointermove 中预翻（1 - y/H），与点击涟漪同一坐标系、严格对齐光标
  if (uMouseLoc) gl.uniform2f(uMouseLoc, mouseSmooth.x, mouseSmooth.y)
  if (uMouseStrengthLoc) gl.uniform1f(uMouseStrengthLoc, mouseActive * 0.045)

  // 使用缓存的 uniform 位置
  gl.uniform1f(uTimeLoc, t)
  gl.uniform2f(uResolutionLoc, canvasRef.value.width, canvasRef.value.height)

  const activeRipples = localRipples.slice(-MAX_RIPPLES)
  gl.uniform1i(uRippleCountLoc, activeRipples.length)

  for (let i = 0; i < MAX_RIPPLES; i++) {
    const r = activeRipples[i] || { x: 0, y: 0, time: 0, strength: 0 }
    if (uRippleCentersLoc[i]) gl.uniform2f(uRippleCentersLoc[i], r.x, r.y)
    if (uRippleTimesLoc[i]) gl.uniform1f(uRippleTimesLoc[i], r.time)
    if (uRippleStrengthsLoc[i]) gl.uniform1f(uRippleStrengthsLoc[i], r.strength)
  }

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  animationId = requestAnimationFrame(render)
}

/**
 * 添加涟漪（暴露给父组件调用）
 * @param {number} x - 归一化 X 坐标 (0-1)
 * @param {number} y - 归一化 Y 坐标 (0-1)
 * @param {number} strength - 涟漪强度
 */
const addRipple = (x, y, strength = 0.025) => {
  if (useFallback.value) return
  localRipples.push({
    x,
    y,
    time: performance.now() * 0.001,
    strength
  })

  if (localRipples.length > MAX_RIPPLES) {
    localRipples = localRipples.slice(-MAX_RIPPLES)
  }
}

// 暴露方法给父组件
defineExpose({ addRipple })

// 生命周期钩子
onMounted(async () => {
  const canvas = canvasRef.value
  // 移动端 / 不支持 WebGL → 不初始化，直接显示完整背景图（home-bg.png）
  if (!canvas || useFallback.value) return

  resize(canvas)
  window.addEventListener('resize', () => resize(canvas))

  if (!initGL(canvas)) {
    console.warn('[HomeBg] WebGL init failed, using fallback')
    useFallback.value = true
    return
  }

  // 先启动渲染循环（纹理异步加载期间显示原图）
  animationId = requestAnimationFrame(render)

  texture = await loadTexture(gl, '/home-bg.png')
  if (!texture) {
    console.warn('[HomeBg] Texture load failed, using fallback')
    if (animationId) cancelAnimationFrame(animationId)
    useFallback.value = true
    return
  }

  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.uniform1i(gl.getUniformLocation(program, 'u_texture'), 0)

  // 记录图片真实比例，启用居中裁切（cover），避免被拉伸压扁
  if (textureImage) {
    imageAspect = textureImage.width / textureImage.height
    updateCoverRatio()
  }

  // 鼠标位置：仅记录目标点；真正的「水痕」在渲染循环里平滑跟随（无离散波纹、不卡顿）
  pointerMoveHandler = (e) => {
    mouseTarget.x = e.clientX / window.innerWidth
    // 与点击涟漪共用坐标系：JS 预翻 Y（1 - y/H），着色器内再翻一次 → 与光标屏幕坐标严格对齐（修「鼠标下移、水痕上移」的 Y 镜像）
    mouseTarget.y = 1.0 - e.clientY / window.innerHeight
    mouseInside = true
  }
  window.addEventListener('pointermove', pointerMoveHandler, { passive: true })

  // 光标移出窗口 → 水痕强度自然衰减
  pointerLeaveHandler = () => { mouseInside = false }
  window.addEventListener('pointerleave', pointerLeaveHandler, { passive: true })

  // WebGL 上下文丢失（驱动崩溃 / 省电策略杀 GPU）→ 退回静态图片
  contextLostHandler = (e) => {
    e.preventDefault()
    if (animationId) cancelAnimationFrame(animationId)
    useFallback.value = true
  }
  canvas.addEventListener('webglcontextlost', contextLostHandler, { passive: true })

  // 环境涟漪：每隔一段时间自动生成一圈柔和涟漪，让水面始终有呼吸感（尊重「减少动态效果」偏好）
  if (!reduceMotion) {
    ambientTimer = setInterval(() => {
      addRipple(Math.random(), Math.random(), 0.015)
    }, 3500)
  }
})

onUnmounted(() => {
  if (animationId) cancelAnimationFrame(animationId)
  if (ambientTimer) clearInterval(ambientTimer)
  if (pointerMoveHandler) window.removeEventListener('pointermove', pointerMoveHandler)
  if (pointerLeaveHandler) window.removeEventListener('pointerleave', pointerLeaveHandler)
  if (contextLostHandler && canvasRef.value) {
    canvasRef.value.removeEventListener('webglcontextlost', contextLostHandler)
  }
  if (gl) {
    gl.getExtension('WEBGL_lose_context')?.loseContext()
  }
})
</script>

<style scoped>
.home-bg-wrapper {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
}

.water-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.bg-fallback {
  position: absolute;
  inset: 0;
  background: url('/home-bg.png') center center / cover no-repeat;
  z-index: -1;
}
</style>
