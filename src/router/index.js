import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Artwork from '../views/Artwork.vue'
import Article from '../views/Article.vue'
import About from '../views/About.vue'
import AskBox from '../views/AskBox.vue'

const routes = [
  { path: '/', name: 'Home', component: Home, meta: { transition: 'home' } },
  { path: '/artwork', name: 'Artwork', component: Artwork, meta: { transition: 'page' } },
  { path: '/article', name: 'Article', component: Article, meta: { transition: 'page' } },
  { path: '/about', name: 'About', component: About, meta: { transition: 'page' } },
  { path: '/ask', name: 'AskBox', component: AskBox, meta: { transition: 'page' } },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
