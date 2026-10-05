import { createRouter, createWebHistory } from 'vue-router'
import { getRole } from '../api/client'
import Login from '../views/Login.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: Login },
    { path: '/register', component: () => import('../views/Register.vue') },
    { path: '/', component: () => import('../views/Dashboard.vue'), meta: { auth: true } },
    { path: '/profile', component: () => import('../views/Profile.vue'), meta: { auth: true } },
    { path: '/placement', component: () => import('../views/Placement.vue'), meta: { auth: true } },
    { path: '/logbook', component: () => import('../views/LogbookList.vue'), meta: { auth: true } },
    { path: '/logbook/:id', component: () => import('../views/LogbookDetail.vue'), meta: { auth: true } },
    { path: '/feedback', component: () => import('../views/Feedback.vue'), meta: { auth: true } },
    { path: '/progress', component: () => import('../views/Progress.vue'), meta: { auth: true } },
    { path: '/admin', component: () => import('../views/AdminDashboard.vue'), meta: { auth: true, role: 'SUPERVISOR' } },
    { path: '/admin/students/:id', component: () => import('../views/AdminStudent.vue'), meta: { auth: true, role: 'SUPERVISOR' } },
  ],
})

// Client-side convenience guard. The backend re-verifies the session + DB
// role on every request, so this can never widen access.
router.beforeEach((to) => {
  if (!to.meta.auth) return true
  const role = getRole()
  if (!role) return '/login'
  if (to.meta.role && role !== to.meta.role) return '/'
  return true
})

export default router
