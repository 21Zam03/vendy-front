import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { guestOnly: true, title: 'Iniciar sesión' },
  },
  {
    path: '/registro',
    name: 'register',
    component: () => import('@/views/auth/RegisterView.vue'),
    meta: { guestOnly: true, title: 'Crear cuenta' },
  },
  {
    path: '/recuperar-contrasena',
    name: 'forgot-password',
    component: () => import('@/views/auth/ForgotPasswordView.vue'),
    meta: { guestOnly: true, title: 'Recuperar contraseña' },
  },
  {
    path: '/tienda/:slug',
    name: 'storefront-profile',
    component: () => import('@/views/storefront/StorefrontProfileView.vue'),
    meta: { title: 'Perfil del negocio' },
  },
  {
    path: '/tienda/:slug/catalogo',
    name: 'storefront-catalog',
    component: () => import('@/views/storefront/StorefrontCatalogView.vue'),
    meta: { title: 'Catálogo' },
  },
  {
    path: '/tienda/:slug/producto/:id',
    name: 'storefront-product',
    component: () => import('@/views/storefront/StorefrontProductView.vue'),
    meta: { title: 'Producto' },
  },
  {
    path: '/tienda/:slug/c/:collectionSlug',
    name: 'storefront-collection',
    component: () => import('@/views/storefront/StorefrontCollectionView.vue'),
    meta: { title: 'Colección' },
  },
  {
    path: '/',
    redirect: '/catalogo',
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { requiresAuth: true, title: 'Estadísticas' },
  },
  {
    path: '/catalogo',
    name: 'catalog',
    component: () => import('@/views/CatalogView.vue'),
    meta: { requiresAuth: true, title: 'Mi catálogo' },
  },
  {
    path: '/mi-negocio',
    name: 'business-profile',
    component: () => import('@/views/BusinessProfileView.vue'),
    meta: { requiresAuth: true, title: 'Mi negocio' },
  },
  {
    path: '/colecciones',
    name: 'collections',
    component: () => import('@/views/CollectionsView.vue'),
    meta: { requiresAuth: true, title: 'Colecciones' },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/catalogo',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach(async (to) => {
  const { state, ensureInitialized } = useAuth()
  await ensureInitialized()

  if (to.meta.requiresAuth && !state.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.guestOnly && state.isAuthenticated) {
    return { name: 'catalog' }
  }
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · Vendy` : 'Vendy'
})

export default router
