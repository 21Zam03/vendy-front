<script setup>
import { computed, onMounted, ref } from 'vue'
import { Eye, MessageCircle, LayoutGrid, ArrowRight, ExternalLink, Store } from '@lucide/vue'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import Skeleton from '@/components/ui/Skeleton.vue'
import StatCard from '@/components/dashboard/StatCard.vue'
import SalesChart from '@/components/dashboard/SalesChart.vue'
import { useAuth } from '@/composables/useAuth'
import { useBusiness } from '@/composables/useBusiness'
import { useDashboard } from '@/composables/useDashboard'
import { listProductos } from '@/api/productos'
import { ApiError } from '@/api/http'
import { formatCurrency, formatNumber, formatWeekday, timeAgo } from '@/utils/format'

const { state } = useAuth()
const { business } = useBusiness()
const { state: dashboardState, reload: reloadDashboard } = useDashboard()

const loadingProducts = ref(true)
const productsNotFound = ref(false)
const products = ref([])
const dashboard = computed(() => dashboardState.data)
const loading = computed(() => dashboardState.loading || loadingProducts.value)
const noNegocio = computed(
  () => productsNotFound.value || (dashboardState.error instanceof ApiError && dashboardState.error.status === 404),
)

onMounted(async () => {
  reloadDashboard()
  try {
    products.value = await listProductos()
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      productsNotFound.value = true
    }
  } finally {
    loadingProducts.value = false
  }
})

const stats = computed(() => [
  {
    label: 'Visitas al catálogo',
    value: formatNumber(dashboard.value?.catalogVisits ?? 0),
    icon: Eye,
    iconClass: 'bg-brand-50 text-brand-600',
  },
  {
    label: 'Intentos de consulta por WhatsApp',
    value: formatNumber(dashboard.value?.whatsappInquiries ?? 0),
    icon: MessageCircle,
    iconClass: 'bg-whatsapp-50 text-whatsapp-600',
  },
  {
    label: 'Productos publicados',
    value: formatNumber(dashboard.value?.publishedProducts ?? 0),
    icon: LayoutGrid,
    iconClass: 'bg-sky-50 text-sky-600',
  },
])

const visitsChartData = computed(
  () => dashboard.value?.visitsByDay.map((d) => ({ label: formatWeekday(d.fecha), value: d.cantidad })) ?? [],
)

const mostViewed = computed(() => [...products.value].sort((a, b) => b.vistas - a.vistas).slice(0, 6))
</script>

<template>
  <DashboardLayout>
    <div class="flex flex-col gap-6">
      <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 class="text-2xl font-semibold tracking-tight text-slate-900">
            Hola, {{ state.user?.name?.split(' ')[0] }} 👋
          </h1>
          <p class="mt-1 text-sm text-slate-500">Así está funcionando tu página esta semana.</p>
        </div>
        <a v-if="business.slug" :href="`/tienda/${business.slug}`" target="_blank" rel="noopener">
          <BaseButton variant="outline">
            <ExternalLink class="size-4" />
            Ver mi página
          </BaseButton>
        </a>
      </div>

      <EmptyState
        v-if="!loading && noNegocio"
        :icon="Store"
        title="Todavía no configuraste tu negocio"
        description="Configura tu negocio para empezar a ver estadísticas de tu catálogo."
      >
        <template #action>
          <router-link :to="{ name: 'business-profile' }">
            <BaseButton>Configurar mi negocio</BaseButton>
          </router-link>
        </template>
      </EmptyState>

      <template v-else>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <template v-if="loading">
            <div v-for="i in 3" :key="i" class="rounded-xl border border-slate-200 bg-white p-5">
              <Skeleton class="size-10 rounded-lg" />
              <Skeleton class="mt-4 h-7 w-24" />
              <Skeleton class="mt-2 h-4 w-32" />
            </div>
          </template>
          <StatCard v-else v-for="s in stats" :key="s.label" v-bind="s" />
        </div>

        <div class="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <BaseCard class="xl:col-span-2">
            <template #header>
              <div>
                <h2 class="text-base font-semibold text-slate-900">Visitas al catálogo</h2>
                <p class="text-sm text-slate-400">Últimos 7 días</p>
              </div>
            </template>
            <div v-if="loading" class="flex h-60 items-end gap-3">
              <Skeleton v-for="i in 7" :key="i" class="flex-1" :style="{ height: `${40 + (i % 3) * 20}%` }" />
            </div>
            <SalesChart v-else :data="visitsChartData" />
          </BaseCard>

          <BaseCard>
            <template #header>
              <h2 class="text-base font-semibold text-slate-900">Productos más vistos</h2>
              <router-link :to="{ name: 'catalog' }" class="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700">
                Ver catálogo
                <ArrowRight class="size-3.5" />
              </router-link>
            </template>
            <div v-if="loading" class="flex flex-col gap-4">
              <div v-for="i in 5" :key="i" class="flex items-center gap-3">
                <Skeleton class="size-8 rounded-lg" />
                <div class="flex-1">
                  <Skeleton class="h-3.5 w-28" />
                  <Skeleton class="mt-1.5 h-3 w-16" />
                </div>
              </div>
            </div>
            <div v-else-if="mostViewed.length" class="flex flex-col gap-4">
              <div v-for="p in mostViewed" :key="p.id" class="flex items-center gap-3">
                <span class="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br text-lg" :class="p.imagenUrl ? 'bg-slate-100' : p.color">
                  <img v-if="p.imagenUrl" :src="p.imagenUrl" class="h-full w-full object-cover" alt="" />
                  <template v-else>{{ p.emoji }}</template>
                </span>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-medium text-slate-900">{{ p.nombre }}</p>
                  <p class="text-xs text-slate-400">{{ formatNumber(p.vistas) }} visitas</p>
                </div>
                <BaseBadge size="sm" variant="slate">{{ formatCurrency(p.precio) }}</BaseBadge>
              </div>
            </div>
            <p v-else class="text-sm text-slate-400">Todavía no tienes productos.</p>
          </BaseCard>
        </div>

        <BaseCard v-if="dashboard?.recentInquiries.length">
          <template #header>
            <h2 class="text-base font-semibold text-slate-900">Intentos de consulta recientes</h2>
          </template>
          <div class="flex flex-col divide-y divide-slate-100">
            <div v-for="i in dashboard.recentInquiries" :key="i.id" class="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
              <MessageCircle class="size-4 shrink-0 text-whatsapp-600" />
              <p class="flex-1 text-sm text-slate-600">
                Alguien intentó consultar por <span class="font-medium text-slate-900">{{ i.productoNombre }}</span>
              </p>
              <span class="text-xs text-slate-400">{{ timeAgo(i.creadoEn) }}</span>
            </div>
          </div>
        </BaseCard>
      </template>
    </div>
  </DashboardLayout>
</template>
