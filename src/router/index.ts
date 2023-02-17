import { createRouter, createWebHistory } from 'vue-router'
import JobView from '../views/JobView.vue'
import BenchmarkView from '../views/BenchmarkView.vue'
import DataView from '../views/DataView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: JobView
    },
    {
      path: '/benchmark',
      name: 'benchmark',
      component: BenchmarkView
    },
    {
      path: '/data',
      name: 'data',
      component: DataView
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue')
    }
  ]
})

export default router
