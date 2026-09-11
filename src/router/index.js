import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useBusiness } from '@/composables/useBusiness'
import { useToast } from '@/composables/useToast'
import { planAlcanza } from '@/data/plans'

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
    meta: { requiresAuth: true, title: 'Estadísticas', requiresPlan: 'go' },
  },
  {
    path: '/catalogo',
    name: 'catalog',
    component: () => import('@/views/CatalogView.vue'),
    meta: { requiresAuth: true, title: 'Mi catálogo' },
  },
  {
    path: '/catalogo/editar',
    name: 'catalog-editor',
    component: () => import('@/views/CatalogEditorView.vue'),
    meta: { requiresAuth: true, title: 'Editar catálogo' },
  },
  {
    path: '/mi-negocio',
    name: 'business-profile',
    component: () => import('@/views/BusinessProfileView.vue'),
    meta: { requiresAuth: true, title: 'Mi negocio' },
  },
  {
    path: '/mi-negocio/estilo-de-pagina',
    name: 'business-appearance',
    component: () => import('@/views/BusinessAppearanceView.vue'),
    meta: { requiresAuth: true, title: 'Estilo de página' },
  },
  {
    path: '/colecciones',
    name: 'collections',
    component: () => import('@/views/CollectionsView.vue'),
    meta: { requiresAuth: true, title: 'Colecciones', requiresPlan: 'go' },
  },
  {
    path: '/archivos',
    name: 'archivos',
    component: () => import('@/views/ArchivosView.vue'),
    meta: { requiresAuth: true, title: 'Archivos guardados' },
  },
  {
    path: '/membresias',
    name: 'memberships',
    component: () => import('@/views/MembershipsView.vue'),
    meta: { requiresAuth: true, title: 'Membresías' },
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

  // Sin negocio todavía (cuenta nueva por Google, o cualquier cuenta a la que
  // todavía no se le armó el negocio) no puede navegar a ningún otro módulo hasta
  // completar los datos mínimos en "Mi negocio" (ver BusinessProfileView.vue).
  if (to.meta.requiresAuth && state.isAuthenticated && to.name !== 'business-profile') {
    const { state: businessState, business, ensureInitialized: ensureBusinessInitialized } = useBusiness()
    await ensureBusinessInitialized()
    if (!businessState.exists) {
      useToast().info('Completa los datos de tu negocio', {
        description: 'Antes de seguir, necesitamos algunos datos básicos de tu negocio.',
      })
      return { name: 'business-profile' }
    }

    // Módulos que un plan no incluye (ver src/data/plans.js): Colecciones y Estadísticas
    // requieren plan Go o superior — el plan Gratis no puede ni siquiera navegar ahí.
    if (to.meta.requiresPlan && !planAlcanza(business.plan, to.meta.requiresPlan)) {
      useToast().info('Esta función no está en tu plan actual', {
        description: 'Mejora tu plan para acceder a este módulo.',
      })
      return { name: 'memberships' }
    }
  }
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · Vendy` : 'Vendy'
})

export default router
