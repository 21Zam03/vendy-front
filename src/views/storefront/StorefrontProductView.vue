<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft, MessageCircle, Share2, Check, LayoutGrid } from '@lucide/vue'
import StorefrontLayout from '@/layouts/StorefrontLayout.vue'
import ProductGridCard from '@/components/storefront/ProductGridCard.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import {
  getPerfilPublico,
  getCatalogoPublico,
  getProductoPublico,
  registrarConsultaWhatsapp,
  buildProductoPreviewUrl,
} from '@/api/tienda'
import { formatCurrency } from '@/utils/format'
import { buildInquiryMessage, buildWhatsAppLink } from '@/utils/whatsapp'
import { setPageMeta } from '@/utils/head'
import { shareOrCopy } from '@/utils/share'
import { useToast } from '@/composables/useToast'
import { catalogAppearance } from '@/utils/theme'

const { error: toastError } = useToast()

const route = useRoute()
const business = ref(null)
const product = ref(null)
const categorias = ref([])
const related = ref([])
const shared = ref(false)
const loading = ref(true)
const notFound = ref(false)

async function load() {
  loading.value = true
  notFound.value = false
  try {
    const [perfil, catalogo, producto] = await Promise.all([
      getPerfilPublico(route.params.slug),
      getCatalogoPublico(route.params.slug),
      getProductoPublico(route.params.slug, route.params.id),
    ])
    business.value = perfil
    categorias.value = catalogo.categorias
    product.value = producto
    related.value = catalogo.productos
      .filter((p) => p.id !== producto.id && p.categoriaId === producto.categoriaId)
      .slice(0, 4)
    setPageMeta({ title: `${producto.nombre} · ${perfil.name}`, description: producto.descripcion })
  } catch {
    notFound.value = true
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(() => [route.params.slug, route.params.id], load)

const categoryName = computed(() => categorias.value.find((c) => c.id === product.value?.categoriaId)?.nombre)

const whatsappLink = computed(() =>
  product.value && business.value
    ? buildWhatsAppLink(business.value.whatsapp, buildInquiryMessage(product.value.nombre))
    : '#',
)

function registerInquiry() {
  registrarConsultaWhatsapp(route.params.slug, product.value.id).catch(() => {})
}

async function shareProduct() {
  // Se comparte el link de preview del backend (no window.location.href) para que
  // WhatsApp/Facebook muestren un preview real con el nombre y la descripción del producto.
  const url = buildProductoPreviewUrl(route.params.slug, product.value.id)
  const result = await shareOrCopy({
    title: product.value.nombre,
    text: `Mira este producto de ${business.value.name}`,
    url,
  })

  if (result === 'copied') {
    shared.value = true
    setTimeout(() => (shared.value = false), 2000)
  } else if (result === 'failed') {
    toastError('No se pudo copiar el enlace', { description: url })
  }
}
</script>

<template>
  <StorefrontLayout :appearance="business ? catalogAppearance(business.appearance) : undefined">
    <div v-if="loading" class="flex min-h-[60vh] items-center justify-center text-sm text-slate-400">
      Cargando…
    </div>

    <EmptyState
      v-else-if="notFound"
      :icon="LayoutGrid"
      title="No encontramos este producto"
      description="El enlace puede estar mal escrito o el producto ya no está disponible."
      class="min-h-[60vh]"
    />

    <template v-else>
      <div class="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div class="mx-auto flex h-16 max-w-3xl items-center gap-3 px-4 sm:px-6">
          <router-link
            :to="{ name: 'storefront-catalog', params: { slug: route.params.slug } }"
            class="flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
          >
            <ArrowLeft class="size-5" />
          </router-link>
          <p class="truncate text-sm font-semibold text-slate-900">{{ business.name }}</p>
        </div>
      </div>

      <div class="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <div class="grid grid-cols-1 gap-8 sm:grid-cols-2">
          <div
            class="flex aspect-square items-center justify-center overflow-hidden rounded-[var(--vendy-radius,1rem)] bg-gradient-to-br text-8xl"
            :class="product.imagenUrl ? 'bg-slate-100' : product.color"
          >
            <img v-if="product.imagenUrl" :src="product.imagenUrl" class="h-full w-full object-cover" alt="" />
            <template v-else>{{ product.emoji }}</template>
          </div>

          <div class="flex flex-col">
            <BaseBadge v-if="categoryName" variant="slate" size="sm" class="w-fit">{{ categoryName }}</BaseBadge>
            <h1 class="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{{ product.nombre }}</h1>
            <div class="mt-2 flex items-baseline gap-2">
              <span class="text-2xl font-semibold text-slate-900">{{ formatCurrency(product.precio) }}</span>
              <span v-if="product.precioComparacion" class="text-sm text-slate-400 line-through">
                {{ formatCurrency(product.precioComparacion) }}
              </span>
            </div>
            <p class="mt-4 text-sm leading-relaxed text-slate-500">{{ product.descripcion }}</p>

            <div class="mt-6 flex flex-col gap-2.5">
              <a
                :href="whatsappLink"
                target="_blank"
                rel="noopener"
                class="flex h-12 w-full items-center justify-center gap-2 rounded-[var(--vendy-radius,1rem)] bg-whatsapp-500 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-whatsapp-600"
                @click="registerInquiry"
              >
                <MessageCircle class="size-4" />
                Consultar por WhatsApp
              </a>
              <button
                class="flex h-12 w-full items-center justify-center gap-2 rounded-[var(--vendy-radius,1rem)] border border-slate-200 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                @click="shareProduct"
              >
                <Check v-if="shared" class="size-4 text-emerald-500" />
                <Share2 v-else class="size-4" />
                {{ shared ? 'Enlace copiado' : 'Compartir producto' }}
              </button>
            </div>
          </div>
        </div>

        <div v-if="related.length" class="mt-12">
          <h2 class="mb-4 text-base font-semibold text-slate-900">También te puede interesar</h2>
          <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <ProductGridCard v-for="p in related" :key="p.id" :product="p" :slug="route.params.slug" />
          </div>
        </div>
      </div>
    </template>
  </StorefrontLayout>
</template>
