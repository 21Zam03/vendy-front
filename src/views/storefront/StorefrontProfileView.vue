<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { LayoutGrid, Sparkles, X } from '@lucide/vue'
import StorefrontLayout from '@/layouts/StorefrontLayout.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import PerfilPublicoRenderer from '@/components/storefront/PerfilPublicoRenderer.vue'
import { getPerfilPublico, getDestacadosPublico, getColeccionesPublico, buildNegocioPreviewUrl } from '@/api/tienda'
import { setPageMeta } from '@/utils/head'
import { shareOrCopy } from '@/utils/share'
import { useToast } from '@/composables/useToast'
import { useAuth } from '@/composables/useAuth'

const { error: toastError } = useToast()
const { state: authState, ensureInitialized } = useAuth()
ensureInitialized()

const route = useRoute()
const business = ref(null)
const featured = ref([])
const collections = ref([])
const loading = ref(true)
const notFound = ref(false)
const shared = ref(false)

async function load() {
  loading.value = true
  notFound.value = false
  try {
    const [perfil, destacados, colecciones] = await Promise.all([
      getPerfilPublico(route.params.slug),
      getDestacadosPublico(route.params.slug).catch(() => []),
      getColeccionesPublico(route.params.slug).catch(() => []),
    ])
    business.value = perfil
    featured.value = destacados
    collections.value = colecciones
    setPageMeta({ title: business.value.name, description: business.value.description })
  } catch {
    notFound.value = true
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(() => route.params.slug, load)

// CTA de "únete a Vendy" solo para visitantes sin sesión activa — se recuerda el
// cierre por pestaña (sessionStorage) para no insistir mientras navega el catálogo.
const joinCtaDismissed = ref(false)
try {
  joinCtaDismissed.value = sessionStorage.getItem('vendy_join_cta_dismissed') === '1'
} catch {
  joinCtaDismissed.value = false
}

function dismissJoinCta() {
  joinCtaDismissed.value = true
  try {
    sessionStorage.setItem('vendy_join_cta_dismissed', '1')
  } catch {
    // localStorage/sessionStorage puede fallar en navegación privada; no es crítico.
  }
}

const showJoinCta = computed(
  () =>
    !loading.value &&
    !notFound.value &&
    !authState.initializing &&
    !authState.isAuthenticated &&
    !joinCtaDismissed.value,
)

// Se comparte el link de preview del backend (no window.location.href) para que
// WhatsApp/Facebook muestren un preview real con el nombre y la descripción del negocio.
async function shareProfile() {
  const url = buildNegocioPreviewUrl(route.params.slug)
  const result = await shareOrCopy({ title: business.value.name, text: business.value.description, url })

  if (result === 'copied') {
    shared.value = true
    setTimeout(() => (shared.value = false), 2000)
  } else if (result === 'failed') {
    toastError('No se pudo copiar el enlace', { description: url })
  }
}
</script>

<template>
  <StorefrontLayout :appearance="business?.appearance">
    <div v-if="loading" class="flex min-h-[60vh] items-center justify-center text-sm text-slate-400">
      Cargando…
    </div>

    <EmptyState
      v-else-if="notFound"
      :icon="LayoutGrid"
      title="No encontramos este negocio"
      description="El enlace puede estar mal escrito o el negocio ya no está disponible."
      class="min-h-[60vh]"
    />

    <PerfilPublicoRenderer
      v-else
      :business="business"
      :featured="featured"
      :collections="collections"
      :links="business.links"
      :slug="route.params.slug"
      :shared="shared"
      @share="shareProfile"
    />

    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 translate-y-3"
      leave-active-class="transition duration-200 ease-in"
      leave-to-class="opacity-0 translate-y-2"
    >
      <div
        v-if="showJoinCta"
        class="fixed inset-x-0 z-40 flex justify-center px-4"
        :style="{ bottom: 'calc(1rem + env(safe-area-inset-bottom))' }"
      >
        <div
          class="flex max-w-full items-center gap-1 rounded-full bg-slate-900/95 py-1.5 pl-4 pr-1.5 text-white shadow-xl ring-1 ring-white/10 backdrop-blur-md"
        >
          <span class="mr-1 hidden items-center gap-1.5 whitespace-nowrap text-sm font-medium sm:flex">
            <Sparkles class="size-4 text-brand-400" />
            Crea tu propio catálogo con Vendy
          </span>
          <span class="mr-1 whitespace-nowrap text-sm font-medium sm:hidden">Crea tu catálogo</span>

          <router-link
            :to="{ name: 'register' }"
            class="whitespace-nowrap rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-400"
          >
            Únete gratis
          </router-link>

          <router-link
            :to="{ name: 'login' }"
            class="hidden whitespace-nowrap px-2.5 text-sm font-medium text-slate-300 transition-colors hover:text-white sm:block"
          >
            Inicia sesión
          </router-link>

          <button
            type="button"
            class="ml-0.5 flex size-7 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
            title="Cerrar"
            @click="dismissJoinCta"
          >
            <X class="size-3.5" />
          </button>
        </div>
      </div>
    </Transition>
  </StorefrontLayout>
</template>
