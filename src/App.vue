<template>
  <!-- 首次进入加载动画 -->
  <LoadingScreen v-if="showLoading" @done="onLoadingDone" />

  <!-- 首页跳转加载动画 -->
  <HomeTransition v-if="showHomeTransition" @done="onHomeTransitionDone" />

  <!-- 其他页面切换过渡 -->
  <PageTransition v-if="showPageTransition" :logo-text="logoText" @done="onPageTransitionDone" />

  <!-- 玻璃砖导览栏 -->
  <GlassNav :current-route="currentRoute" @navigate="handleNavigate" />

  <!-- 路由出口 -->
  <router-view />
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import LoadingScreen from './components/LoadingScreen.vue'
import HomeTransition from './components/HomeTransition.vue'
import PageTransition from './components/PageTransition.vue'
import GlassNav from './components/GlassNav.vue'

const route = useRoute()
const router = useRouter()

const showLoading = ref(true)
const showHomeTransition = ref(false)
const showPageTransition = ref(false)
const logoText = ref('启明')
const currentRoute = ref(route.name)
const pendingNavigation = ref(null)

const onLoadingDone = () => {
  showLoading.value = false
}

const onHomeTransitionDone = () => {
  showHomeTransition.value = false
}

const onPageTransitionDone = () => {
  showPageTransition.value = false
}

const handleNavigate = (routeName, category = null) => {
  if (routeName === route.name && !category) return
  if (routeName === route.name && category && route.query.category === category) return

  const targetQuery = category ? { category } : undefined
  pendingNavigation.value = { name: routeName, query: targetQuery }

  if (routeName === 'Home') {
    showHomeTransition.value = true
  } else {
    showPageTransition.value = true
  }

  setTimeout(() => {
    router.push({ name: routeName, query: targetQuery })
  }, 600)
}

watch(() => route.name, (newName) => {
  currentRoute.value = newName
}, { immediate: true })
</script>
