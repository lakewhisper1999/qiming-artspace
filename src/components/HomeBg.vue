<template>
  <div class="home-bg-wrapper">
    <canvas ref="canvasRef" class="water-canvas"></canvas>
    <div class="bg-fallback"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { MAX_RIPPLES, RIPPLE_LIFETIME, SHADER_PARAMS } from '../constants/ripple.js'

const canvasRef = ref(null)

// WebGL 上下文和状态
let animationId = null
let ambientTimer = null
let gl = null
let program = null
let texture = null
let textureImage = null
let imageAspect = 1.0
let localRipples = []

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

  void main() {
    vec2 uv = vec2(v_uv.x, 1.0 - v_uv.y);
    vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);

    // object-fit: cover —— 保持图片比例、居中裁切，避免在不同屏幕比例下被压扁
    vec2 baseUv = (uv - 0.5) * u_coverRatio + 0.5;

    vec2 displacement = vec2(0.0);

    // 响应显式触发的扩散涟漪（点击 / 停留）
    for (int i = 0; i < ${MAX_RIPPLES}; i++) {
      if (i >= u_rippleCount) break;
      vec2 center = u_rippleCenters[i];
      center.y = 1.0 - center.y;
      float t = u_time - u_rippleTimes[i];
      if (t < 0.0 || t > 2.5) continue;
      float dist = length((uv - center) * aspect);
      // 降低频率、衰减更快，使涟漪更柔和
      float wave = sin(dist * ${SHADER_PARAMS.frequency.toFixed(1)} - t * ${SHADER_PARAMS.speed.toFixed(1)}) 
                   * exp(-dist * ${SHADER_PARAMS.distanceDecay.toFixed(1)}) 
                   * exp(-t * ${SHADER_PARAMS.timeDecay.toFixed(1)}) 
                   * u_rippleStrengths[i];
      displacement += normalize(uv - center + 0.0001) * wave;
    }

    gl_FragColor = texture2D(u_texture, clamp(baseUv + displacement, 0.001, 0.999));
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
  console.log('[HomeBg] Adding ripple at:', x.toFixed(3), y.toFixed(3))
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
  if (!canvas) return

  resize(canvas)
  window.addEventListener('resize', () => resize(canvas))

  if (!initGL(canvas)) {
    console.warn('[HomeBg] WebGL init failed, using fallback')
    return
  }

  // 先启动渲染循环（显示黑色背景），纹理异步加载
  animationId = requestAnimationFrame(render)

  texture = await loadTexture(gl, '/home-bg.png')
  if (!texture) {
    console.warn('[HomeBg] Texture load failed, showing black bg')
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

  // 环境涟漪：每隔一段时间自动生成一圈柔和涟漪，让水面始终有呼吸感（修复「涟漪效果消失」观感）
  ambientTimer = setInterval(() => {
    addRipple(Math.random(), Math.random(), 0.02)
  }, 3500)

  console.log('[HomeBg] WebGL ready, texture loaded')
})

onUnmounted(() => {
  if (animationId) cancelAnimationFrame(animationId)
  if (ambientTimer) clearInterval(ambientTimer)
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
