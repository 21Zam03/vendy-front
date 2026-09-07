<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { LayoutGrid } from '@lucide/vue'
import StorefrontLayout from '@/layouts/StorefrontLayout.vue'
import CatalogTemplateRenderer from '@/components/storefront/CatalogTemplateRenderer.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import WhatsAppIcon from '@/components/icons/WhatsAppIcon.vue'
import { getPerfilPublico, getCatalogoPublico, getSeccionesPublico, getPestanasPublico, getBannersPublico, getTextosPublico } from '@/api/tienda'
import { setPageMeta } from '@/utils/head'
import { catalogAppearance } from '@/utils/theme'
import { buildWhatsAppLink } from '@/utils/whatsapp'

// Esta vista solo carga los datos PÚBLICOS del catálogo; toda la lógica de cómo se
// organiza y se ve (según la plantilla del negocio) vive en CatalogTemplateRenderer,
// compartido con el editor visual admin (CatalogEditorView) para que ambos se vean
// exactamente igual.
const route = useRoute()
const business = ref(null)
const categorias = ref([])
const productos = ref([])
const secciones = ref([])
const pestanas = ref([])
const banners = ref({})
const textos = ref({})
const loading = ref(true)
const notFound = ref(false)

async function load() {
  loading.value = true
  notFound.value = false
  try {
    const [perfil, catalogo, secc, pest, bans, txts] = await Promise.all([
      getPerfilPublico(route.params.slug),
      getCatalogoPublico(route.params.slug),
      getSeccionesPublico(route.params.slug).catch(() => []),
      getPestanasPublico(route.params.slug).catch(() => []),
      getBannersPublico(route.params.slug).catch(() => ({})),
      getTextosPublico(route.params.slug).catch(() => ({})),
    ])
    business.value = perfil
    categorias.value = catalogo.categorias
    productos.value = catalogo.productos
    secciones.value = secc
    pestanas.value = pest
    banners.value = bans
    textos.value = txts
    setPageMeta({ title: `Catálogo · ${perfil.name}`, description: perfil.description })
  } catch {
    notFound.value = true
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(() => route.params.slug, load)

// Permite llegar con una categoría ya filtrada desde los chips del perfil público
// (?categoria=<id>), sin cambiar el resto del comportamiento del filtro local.
const initialCategoria = Number(route.query.categoria)

// Botón flotante de WhatsApp: mismo destino que el CTA del perfil público, para
// consultar por cualquier producto sin tener que volver a esa página.
const whatsappLink = computed(() =>
  business.value?.whatsapp
    ? buildWhatsAppLink(business.value.whatsapp, `Hola ${business.value.name}! vi tu catálogo en Vendy y quiero más información.`)
    : null,
)
</script>

<template>
  <StorefrontLayout :appearance="business ? catalogAppearance(business.appearance) : undefined">
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

    <CatalogTemplateRenderer
      v-else
      :business="business"
      :productos="productos"
      :categorias="categorias"
      :secciones="secciones"
      :pestanas="pestanas"
      :banners="banners"
      :textos="textos"
      :slug="route.params.slug"
      :initial-category-filter="Number.isFinite(initialCategoria) ? initialCategoria : 'all'"
    />

    <a
      v-if="whatsappLink"
      :href="whatsappLink"
      target="_blank"
      rel="noopener"
      class="fixed bottom-5 right-5 z-40 flex size-14 items-center justify-center rounded-full bg-whatsapp-500 text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
      aria-label="Escribir por WhatsApp"
    >
      <WhatsAppIcon class="size-7" />
    </a>
  </StorefrontLayout>
</template>
