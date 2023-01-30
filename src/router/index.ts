
import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    component: () => import('@/views/threejs/Index.vue'),
    name: 'editor3d',
    children: [
      {
        path: 'view',
        name: 'view',
        component: () => import('@/views/threejs/Index.vue'),
      },
      {
        path: 'basic',
        name: 'basic',
        component: () => import('@/views/threejs/Index.vue'),
      },
      {
        path: 'hot',
        name: 'hot',
        component: () => import('@/views/threejs/Index.vue'),
      },
      {
        path: 'sandTable',
        name: 'sandTable',
        component: () => import('@/views/threejs/Index.vue'),
      },
    ]
  },
  {
    path: '/preview',
    name: 'preview',
    component: () => import('@/views/threejs/comps/Preview.vue')
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})



export default router