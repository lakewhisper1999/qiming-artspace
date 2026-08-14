<template>
  <div class="askbox-page">
    <!-- ID 弹窗（Teleport 到 body，防穿模） -->
    <Teleport to="body">
      <div v-if="showIdModal" class="id-modal-overlay" @click.self="showIdModal = false">
        <div class="id-modal">
          <h3 class="id-modal-title">设置你的 ID</h3>
          <input
            ref="idInputRef"
            v-model="nickname"
            class="id-modal-input"
            placeholder="输入昵称（留空则为匿名）"
            maxlength="12"
            @keyup.enter="confirmId"
          />
          <div class="id-modal-actions">
            <button class="id-modal-btn cancel" @click="showIdModal = false">取消</button>
            <button class="id-modal-btn confirm" @click="confirmId">确定</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 页面头部 -->
    <section class="page-header">
      <div class="container">
        <RevealText tag="span" class="section-label" text="ASK BOX" />
        <RevealText tag="h1" class="page-title" text="提问箱" />
        <p class="page-desc">你可以在这里留下想说的话。</p>
      </div>
    </section>

    <!-- 液态玻璃提问卡 -->
    <section class="ask-section">
      <div class="container">
        <div class="glass-card">
<!--          &lt;!&ndash; 顶部：头像 + "正在倾听" &ndash;&gt;-->
<!--          <div class="card-top">-->
<!--            <div class="avatar-ring">-->
<!--              <img src="/logo.png" alt="启明" class="avatar-img" />-->
<!--            </div>-->
<!--            <span class="listening-text">正在倾听</span>-->
<!--          </div>-->

          <!-- 输入行：+ 按钮 + 输入框 + 发送按钮 -->
          <div class="input-row">
            <button class="id-btn" v-magnetic @click="openIdModal" title="设置 ID">
              <span>+</span>
            </button>
            <input
              v-model="content"
              class="question-input"
              placeholder="输入你想说的..."
              maxlength="500"
              @keyup.enter="sendQuestion"
            />
            <button
              class="send-btn"
              v-magnetic
              :disabled="!content.trim()"
              @click="sendQuestion"
              title="发送"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="19" x2="12" y2="5"/>
                <polyline points="5 12 12 5 19 12"/>
              </svg>
            </button>
          </div>

          <!-- 字数统计 -->
          <div class="char-count">{{ content.length }} / 500</div>
        </div>
      </div>
    </section>

    <!-- 提问列表 -->
    <section class="questions-section">
      <div class="container">
        <TransitionGroup name="q-list" tag="div" class="questions-grid">
          <div v-for="q in questions" :key="q.id" class="question-card" v-tilt>
            <!-- 卡片头部：ID + 时间 -->
            <div class="q-header">
              <span class="q-id">ID: {{ q.nickname || '匿名' }}</span>
              <span class="q-time">{{ q.time }}</span>
            </div>
            <!-- 提问内容 -->
            <p class="q-content">{{ q.content }}</p>
            <!-- 回答区域（数据库预留） -->
            <div v-if="q.reply" class="q-reply">
              {{ q.reply }}
            </div>
            <div v-else class="q-reply-placeholder">
              等待回复...
            </div>
          </div>
        </TransitionGroup>

        <div v-if="questions.length === 0" class="empty">
          <p>还没有人提问，来做第一个吧。</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import RevealText from '../components/RevealText.vue'

// ===== 状态 =====
const nickname = ref('')
const content = ref('')
const questions = ref([])
const showIdModal = ref(false)
const idInputRef = ref(null)
const loading = ref(false)

// ===== 方法 =====
const openIdModal = () => {
  showIdModal.value = true
  nextTick(() => {
    idInputRef.value?.focus()
  })
}

const confirmId = () => {
  showIdModal.value = false
}

/** 格式化时间：ISO → "2026-05-14 09:41" */
const formatTime = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day} ${h}:${min}`
}

/** 发送提问 → POST /api/public/comments */
const sendQuestion = async () => {
  const text = content.value.trim()
  if (!text) return

  try {
    const res = await fetch('/api/public/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nickname: nickname.value.trim() || '匿名',
        content: text,
      }),
    })
    const json = await res.json()
    if (json.code === 200 || json.code === 0) {
      // 成功 → 刷新列表
      content.value = ''
      await loadQuestions()
    }
  } catch (e) {
    console.warn('[AskBox] 发送失败', e)
    alert('演示环境暂未连接后端，提问暂不支持在线提交～')
  }
}

/** 从后端加载提问列表 */
const loadQuestions = async () => {
  loading.value = true
  try {
    const res = await fetch('/api/public/comments?page=1&size=50')
    const json = await res.json()
    const records = json.data?.records || json.data || []
    questions.value = records.map(c => ({
      id: c.id,
      nickname: c.nickname || '匿名',
      content: c.content,
      time: formatTime(c.createdAt),
      reply: c.reply || '',
    }))
  } catch (e) {
    // 后端不可用时（纯静态部署）回退到本地 mock 提问，保证页面不空白
    console.warn('[AskBox] 加载失败，使用本地 mock 提问', e)
    questions.value = [
      { id: 1, nickname: '小鹿', content: '你的配色灵感一般来自哪里？', time: '2026-03-01 20:14', reply: '生活里随手拍的照片，还有老电影里的氛围光。' },
      { id: 2, nickname: '阿元', content: '零基础想学动效，从哪入手比较好？', time: '2026-02-18 11:02', reply: '先学缓动曲线，再练关键帧，工具反而是最后的事。' },
    ]
  } finally {
    loading.value = false
  }
}

// ===== 生命周期 =====
onMounted(() => {
  loadQuestions()
})
</script>

<style scoped>
/* ===== 页面基底 ===== */
.askbox-page {
  min-height: 100vh;
  padding-bottom: 120px;
  background: var(--artwork-bg);
  color: var(--text);
}

/* ===== 页面头部 ===== */
.page-header {
  padding: 7rem 0 2rem;
  text-align: left;
  background: var(--artwork-bg);
}

.section-label {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.12em;
  color: var(--text-secondary);
  opacity: 0.5;
  text-transform: uppercase;
  margin-bottom: 1rem;
}

.page-title {
  font-size: clamp(2.25rem, 5vw, 3.25rem);
  color: var(--text);
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.15;
  margin-bottom: 0.5rem;
}

.page-desc {
  font-size: 1rem;
  color: var(--text-secondary);
  opacity: 0.6;
  margin-top: 0.5rem;
}

/* ===== 容器 ===== */
.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

/* ===== 液态玻璃提问卡 ===== */
.ask-section {
  padding: 1rem 0 3rem;
}

.glass-card {
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 24px;
  padding: 2rem;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.06),
    0 2px 8px rgba(0, 0, 0, 0.03),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  transition: box-shadow 0.4s ease;
}

.glass-card:focus-within {
  box-shadow:
    0 12px 40px rgba(0, 0, 0, 0.1),
    0 4px 12px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

/* 顶部：头像 + 文字 */
.card-top {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 1.5rem;
}

.avatar-ring {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.8);
  border: 2px solid rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.avatar-img {
  width: 28px;
  height: 28px;
  object-fit: contain;
}

.listening-text {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-secondary);
  opacity: 0.7;
}

/* 输入行 */
.input-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.id-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 1.5px dashed rgba(0, 0, 0, 0.15);
  background: transparent;
  color: var(--text-secondary);
  font-size: 1.3rem;
  font-weight: 300;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.25s ease;
}

.id-btn:hover {
  border-color: rgba(0, 0, 0, 0.3);
  color: var(--text);
  background: rgba(0, 0, 0, 0.04);
}

.question-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 0.95rem;
  color: var(--text);
  outline: none;
  padding: 0.5rem 0;
  font-family: var(--font-body);
}

.question-input::placeholder {
  color: var(--text-secondary);
  opacity: 0.4;
}

.send-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: none;
  background: #1a1a1a;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.25s ease;
}

.send-btn:hover:not(:disabled) {
  background: #333;
  transform: scale(1.08);
}

.send-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* 字数统计 */
.char-count {
  text-align: right;
  font-size: 0.8rem;
  color: var(--text-secondary);
  opacity: 0.4;
  margin-top: 0.6rem;
}

/* ===== 提问列表 ===== */
.questions-section {
  padding: 0 0 4rem;
}

.questions-grid {
  columns: auto 360px;
  column-gap: 1.2rem;
}

.question-card {
  break-inside: avoid;
  margin-bottom: 1.2rem;
  display: inline-block;
  width: 100%;
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 16px;
  padding: 1.2rem 1.4rem;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.question-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

/* 卡片头部 */
.q-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.q-id {
  font-size: 0.8rem;
  color: var(--text-secondary);
  opacity: 0.5;
  font-weight: 500;
}

.q-time {
  font-size: 0.75rem;
  color: var(--text-secondary);
  opacity: 0.4;
}

/* 提问内容 */
.q-content {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text);
  line-height: 1.5;
  margin-bottom: 0.75rem;
  word-break: break-word;
}

/* 回复区域 */
.q-reply {
  padding: 0.7rem 1rem;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 10px;
  font-size: 0.9rem;
  color: var(--text);
  line-height: 1.5;
}

.q-reply-placeholder {
  padding: 0.7rem 1rem;
  background: rgba(0, 0, 0, 0.02);
  border: 1px dashed rgba(0, 0, 0, 0.08);
  border-radius: 10px;
  font-size: 0.85rem;
  color: var(--text-secondary);
  opacity: 0.4;
  text-align: center;
}

/* ===== TransitionGroup 动画 ===== */
.q-list-enter-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.q-list-leave-active {
  transition: all 0.3s ease;
}

.q-list-enter-from {
  opacity: 0;
  transform: translateY(12px) scale(0.96);
}

.q-list-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.q-list-move {
  transition: transform 0.35s ease;
}

/* ===== 空状态 ===== */
.empty {
  text-align: center;
  color: var(--text-secondary);
  opacity: 0.4;
  padding: 4rem 0;
  font-size: 1rem;
}

/* ===== ID 弹窗（Teleport + fixed overlay） ===== */
.id-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: overlay-in 0.25s ease;
}

.id-modal {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 20px;
  padding: 2rem;
  width: 90%;
  max-width: 380px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  animation: modal-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.id-modal-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 1rem;
}

.id-modal-input {
  width: 100%;
  padding: 0.7rem 1rem;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  font-size: 0.95rem;
  outline: none;
  background: rgba(0, 0, 0, 0.03);
  color: var(--text);
  font-family: var(--font-body);
  transition: border-color 0.25s ease;
}

.id-modal-input:focus {
  border-color: rgba(0, 0, 0, 0.25);
}

.id-modal-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.2rem;
  justify-content: flex-end;
}

.id-modal-btn {
  padding: 0.55rem 1.4rem;
  border-radius: 999px;
  border: none;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.25s ease;
}

.id-modal-btn.cancel {
  background: rgba(0, 0, 0, 0.06);
  color: var(--text-secondary);
}

.id-modal-btn.cancel:hover {
  background: rgba(0, 0, 0, 0.1);
}

.id-modal-btn.confirm {
  background: #1a1a1a;
  color: #fff;
}

.id-modal-btn.confirm:hover {
  background: #333;
}

@keyframes overlay-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes modal-in {
  from { opacity: 0; transform: scale(0.92) translateY(12px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

/* ===== 响应式 ===== */
@media (max-width: 640px) {
  .questions-grid {
    columns: auto 280px;
    column-gap: 1rem;
  }

  .question-card {
    margin-bottom: 1rem;
    padding: 1rem 1.1rem;
  }

  .glass-card {
    padding: 1.4rem;
  }

  .page-title {
    font-size: 1.8rem;
  }

  .id-modal {
    padding: 1.5rem;
  }
}
</style>
