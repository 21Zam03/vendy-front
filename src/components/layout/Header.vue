<script setup>
import { Menu, Search, Bell, MessageCircle, Store, LogOut } from '@lucide/vue'
import { useRoute, useRouter } from 'vue-router'
import { computed } from 'vue'
import BaseDropdown from '@/components/ui/BaseDropdown.vue'
import BaseAvatar from '@/components/ui/BaseAvatar.vue'
import { useBusiness } from '@/composables/useBusiness'
import { useDashboard } from '@/composables/useDashboard'
import { timeAgo } from '@/utils/format'
import { useAuth } from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'

defineEmits(['toggle-sidebar'])

const route = useRoute()
const router = useRouter()
const title = computed(() => route.meta.title || 'Vendy')

const { state, logout } = useAuth()
const { info } = useToast()
const { business } = useBusiness()
const { state: dashboardState, ensureInitialized: ensureDashboard } = useDashboard()
ensureDashboard()
const recentInquiries = computed(() => dashboardState.data?.recentInquiries ?? [])

async function handleLogout() {
  await logout()
  info('Sesión cerrada')
  router.push({ name: 'login' })
}
</script>

<template>
  <header class="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 bg-white/80 px-4 backdrop-blur sm:px-6">
    <button class="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden" @click="$emit('toggle-sidebar')">
      <Menu class="size-5" />
    </button>

    <h1 class="text-lg font-semibold tracking-tight text-slate-900 lg:hidden">{{ title }}</h1>

    <div class="hidden flex-1 max-w-md lg:block">
      <div class="relative">
        <Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar productos…"
          class="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 transition-colors focus:border-brand-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </div>
    </div>

    <div class="ml-auto flex items-center gap-1.5">
      <BaseDropdown align="right">
        <template #trigger>
          <button class="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100">
            <Bell class="size-5" />
            <span class="absolute right-1.5 top-1.5 size-2 rounded-full bg-whatsapp-500 ring-2 ring-white" />
          </button>
        </template>
        <template #content>
          <div class="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Intentos de consulta recientes
          </div>
          <div class="max-h-80 overflow-y-auto">
            <div
              v-for="i in recentInquiries"
              :key="i.id"
              class="flex items-start gap-2.5 rounded-lg px-3 py-2 hover:bg-slate-50"
            >
              <MessageCircle class="mt-0.5 size-4 shrink-0 text-whatsapp-600" />
              <div class="min-w-0">
                <p class="text-xs text-slate-600 leading-snug">
                  Alguien intentó consultar por <span class="font-medium text-slate-900">{{ i.productoNombre }}</span>
                </p>
                <p class="mt-0.5 text-[11px] text-slate-400">{{ timeAgo(i.creadoEn) }}</p>
              </div>
            </div>
            <p v-if="!recentInquiries.length" class="px-3 py-4 text-center text-xs text-slate-400">
              Todavía no hay intentos de consulta
            </p>
          </div>
        </template>
      </BaseDropdown>

      <BaseDropdown align="right">
        <template #trigger>
          <button class="ml-1 rounded-full transition-opacity hover:opacity-80">
            <BaseAvatar :name="state.user?.name" size="sm" />
          </button>
        </template>
        <template #content>
          <div class="px-3 py-2">
            <p class="truncate text-sm font-medium text-slate-900">{{ state.user?.name }}</p>
            <p class="truncate text-xs text-slate-400">{{ business.name }}</p>
          </div>
          <div class="my-1 h-px bg-slate-100" />
          <router-link
            :to="{ name: 'business-profile' }"
            class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            <Store class="size-4" />
            Mi negocio
          </router-link>
          <button
            class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
            @click="handleLogout"
          >
            <LogOut class="size-4" />
            Cerrar sesión
          </button>
        </template>
      </BaseDropdown>
    </div>
  </header>
</template>
