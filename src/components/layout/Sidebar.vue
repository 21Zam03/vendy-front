<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { BarChart3, LayoutGrid, Store, LogOut, ExternalLink, X, Layers, Images, ChevronDown, Sparkles } from '@lucide/vue'
import BaseAvatar from '@/components/ui/BaseAvatar.vue'
import BaseDropdown from '@/components/ui/BaseDropdown.vue'
import { useAuth } from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'
import { useBusiness } from '@/composables/useBusiness'

const { business } = useBusiness()

defineProps({
  open: { type: Boolean, default: false },
})
const emit = defineEmits(['close'])

const router = useRouter()
const route = useRoute()
const { state, logout } = useAuth()
const { info } = useToast()

// "Estilo de página" vive en su propia ruta (pantalla completa, sin este sidebar — ver
// BusinessAppearanceView.vue); el resto de los datos del negocio (perfil, info, métodos de
// pago, enlaces) se editan desde ahí mismo, en modales flotantes sobre el perfil público en
// vivo — ya no son submódulos aparte.
const businessSections = [
  { to: { name: 'business-profile', query: { section: 'template' } }, label: 'Estilo de catálogo' },
  { to: { name: 'business-appearance' }, label: 'Estilo de página' },
  { to: { name: 'business-profile', query: { section: 'account' } }, label: 'Cuenta' },
]

const nav = computed(() => [
  { type: 'link', to: { name: 'catalog' }, label: 'Mi catálogo', icon: LayoutGrid },
  { type: 'link', to: { name: 'collections' }, label: 'Colecciones', icon: Layers },
  { type: 'link', to: { name: 'archivos' }, label: 'Archivos guardados', icon: Images },
  { type: 'group', label: 'Mi negocio', icon: Store, children: businessSections },
  { type: 'link', to: { name: 'dashboard' }, label: 'Estadísticas', icon: BarChart3 },
  { type: 'link', to: { name: 'memberships' }, label: 'Membresías', icon: Sparkles },
])

const isBusinessRoute = computed(() => route.name === 'business-profile' || route.name === 'business-appearance')
function isActiveSection(s) {
  return route.name === s.to.name && (!s.to.query?.section || route.query.section === s.to.query.section)
}
const businessMenuOpen = ref(isBusinessRoute.value)

watch(isBusinessRoute, (isBusiness) => {
  if (isBusiness) businessMenuOpen.value = true
})

async function handleLogout() {
  await logout()
  info('Sesión cerrada')
  router.push({ name: 'login' })
}
</script>

<template>
  <Transition
    enter-active-class="transition-opacity duration-150"
    leave-active-class="transition-opacity duration-150"
    enter-from-class="opacity-0"
    leave-to-class="opacity-0"
  >
    <div v-if="open" class="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" @click="emit('close')" />
  </Transition>

  <aside
    class="fixed inset-y-0 left-0 z-40 flex w-64 -translate-x-full flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:static lg:translate-x-0"
    :class="{ 'translate-x-0': open }"
  >
    <div class="flex h-16 shrink-0 items-center justify-between px-5">
      <router-link :to="{ name: 'dashboard' }" class="flex items-center gap-2">
        <img src="/favicon.svg" width="26" height="26" alt="Vendy" />
        <span class="text-base font-semibold tracking-tight text-slate-900">Vendy</span>
      </router-link>
      <button class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden" @click="emit('close')">
        <X class="size-5" />
      </button>
    </div>

    <nav class="scrollbar-thin flex-1 overflow-y-auto px-3 py-2">
      <template v-for="item in nav" :key="item.label">
        <router-link
          v-if="item.type === 'link'"
          :to="item.to"
          class="group mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 [&.router-link-active]:bg-brand-50 [&.router-link-active]:text-brand-700"
          @click="emit('close')"
        >
          <component :is="item.icon" class="size-[18px] shrink-0 text-slate-400 group-hover:text-slate-600 group-[&.router-link-active]:text-brand-600" />
          <span class="flex-1 truncate">{{ item.label }}</span>
        </router-link>

        <div v-else class="mb-0.5">
          <button
            type="button"
            class="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
            :class="isBusinessRoute ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'"
            @click="businessMenuOpen = !businessMenuOpen"
          >
            <component
              :is="item.icon"
              class="size-[18px] shrink-0"
              :class="isBusinessRoute ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-600'"
            />
            <span class="flex-1 truncate text-left">{{ item.label }}</span>
            <ChevronDown
              class="size-4 shrink-0 text-slate-400 transition-transform"
              :class="businessMenuOpen ? 'rotate-180' : ''"
            />
          </button>

          <div v-show="businessMenuOpen" class="ml-[1.15rem] mt-0.5 flex flex-col gap-0.5 border-l border-slate-200 pl-3">
            <router-link
              v-for="s in item.children"
              :key="s.label"
              :to="s.to"
              class="rounded-lg px-2.5 py-1.5 text-sm transition-colors"
              :class="
                isActiveSection(s)
                  ? 'bg-brand-50 font-medium text-brand-700'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              "
              @click="emit('close')"
            >
              {{ s.label }}
            </router-link>
          </div>
        </div>
      </template>

      <a
        v-if="business.slug"
        :href="`/tienda/${business.slug}`"
        target="_blank"
        rel="noopener"
        class="mt-3 flex items-center gap-3 rounded-lg border border-dashed border-slate-200 px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
      >
        <ExternalLink class="size-[18px] shrink-0" />
        <span class="flex-1 truncate">Ver mi página</span>
      </a>
    </nav>

    <div class="border-t border-slate-100 p-3">
      <BaseDropdown align="left" full-width>
        <template #trigger>
          <button class="flex w-full min-w-0 items-center gap-2.5 rounded-lg p-2 text-left transition-colors hover:bg-slate-100">
            <BaseAvatar :name="state.user?.name" size="sm" />
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-slate-900">{{ state.user?.name }}</p>
              <p class="truncate text-xs text-slate-400">{{ business.name }}</p>
            </div>
          </button>
        </template>
        <template #content>
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
  </aside>
</template>
