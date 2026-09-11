<script setup>
import { computed, onUnmounted, ref, watch } from 'vue'
import { Search, LayoutGrid, ChevronLeft, ChevronRight, ImagePlus, Camera, Loader2, ArrowLeftRight } from '@lucide/vue'
import EditableTileOverlay from './EditableTileOverlay.vue'
import EditableSectionTitle from './EditableSectionTitle.vue'
import TopbarMarquee from './TopbarMarquee.vue'
import GallerySection from './GallerySection.vue'
import ScheduleLocationSection from './ScheduleLocationSection.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { formatCurrency } from '@/utils/format'
import { groupBySections } from '@/utils/sections'
import { getTemplate } from '@/data/templates'

// Motor de renderizado del catálogo: recibe los datos ya cargados (por la página pública
// o por el editor visual admin) y dibuja la estructura según la plantilla del negocio.
// No hace fetch ni sabe de dónde vienen los datos — eso es responsabilidad de quien lo usa.
// Con editable=true, cada foto muestra un overlay para subir imagen y reordenar, y los
// clics dejan de navegar al detalle del producto (se convierten en <div>, no <router-link>).
const props = defineProps({
  business: { type: Object, required: true },
  productos: { type: Array, required: true },
  categorias: { type: Array, default: () => [] },
  secciones: { type: Array, default: () => [] },
  pestanas: { type: Array, default: () => [] },
  slug: { type: String, default: '' },
  initialCategoryFilter: { type: [Number, String], default: 'all' },
  editable: { type: Boolean, default: false },
  uploadingIds: { type: Object, default: () => new Set() },
  banners: { type: Object, default: () => ({}) },
  uploadingBannerSlots: { type: Object, default: () => new Set() },
  textos: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['move-product', 'upload-photo', 'pick-banner', 'reorder-hero', 'save-title', 'remove-title'])

// Título opcional de cada sección de Home: el negocio elige el texto (o ninguno) — nunca
// hay un título por defecto armado con nombres de categorías, secciones o productos.
function sectionTitle(slot) {
  return props.textos[slot] || ''
}
function saveSectionTitle(slot, texto) {
  emit('save-title', { slot, texto })
}
function removeSectionTitle(slot) {
  emit('remove-title', slot)
}

function isUploading(productId) {
  return props.uploadingIds.has(productId)
}
// productId (no el índice local dentro de la sección) porque ese índice puede estar
// calculado sobre una lista ya filtrada por búsqueda/categoría — quien escuche este
// evento reordena sobre la lista completa real de la sección, usando el id.
function emitMove(sectionId, productId, direction) {
  emit('move-product', { sectionId, productId, direction })
}
function emitUpload(product, file) {
  emit('upload-photo', { product, file })
}
function handleFileInput(product, event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (file) emitUpload(product, file)
}

// Banners de plantilla (secciones de Home de Moda): la foto que se ve en cada espacio es
// SOLO la que el negocio eligió a mano para ese "slot" (persistida, independiente de
// cualquier Producto) — a propósito NO cae de vuelta en la foto de un producto
// destacado/en oferta, para que el catálogo nunca muestre fotos que el negocio no eligió
// para ese espacio; mientras no haya elegido una, la celda queda como guía vacía. El
// ícono de cámara no sube el archivo directo: le pide a quien usa este componente que
// abra el selector de "subir nueva o elegir de mis archivos" (ver MediaPickerModal), para
// no repetir esa lógica en cada una de estas ~20 celdas.
function bannerUrl(slot) {
  return props.banners[slot] || null
}
function isUploadingBanner(slot) {
  return props.uploadingBannerSlots.has(slot)
}
function pickBanner(slot) {
  emit('pick-banner', slot)
}

// La plantilla del negocio (elegida en Mi negocio → Estilo de negocio) define la
// estructura del CATÁLOGO — nunca la del perfil público, que se mantiene única para
// todos los negocios. Cada plantilla organiza su catálogo en las Secciones reales que
// el negocio administra (creadas a mano, o sugeridas al elegir la plantilla), respetando
// su orden y el orden de los productos dentro de cada una.
const template = computed(() => getTemplate(props.business.appearance.template))
const galleryProducts = computed(() => props.productos.filter((p) => p.imagenUrl).slice(0, 9))

const isModa = computed(() => template.value?.key === 'moda')
const isAccesorios = computed(() => template.value?.key === 'accesorios')

// Modelo fijo: cada negocio tiene como máximo 2 pestañas, "Inicio" y "General" (ver
// PestanaService.asegurarSinHuerfanas en el backend, que las garantiza apenas hay una
// plantilla elegida y absorbe cualquier pestaña vieja que haya quedado de antes de esta
// regla — nombres viejos, "Varones"/"Mujeres" de una Moda anterior, etc. — pasando sus
// secciones a "General" antes de eliminarlas, así que este filtro es solo una defensa
// extra por si el negocio no pasó todavía por ese autocurado).
//
// Además, en el catálogo público (editable=false) se ocultan las que el negocio desactivó
// a mano (ver el interruptor "Activa" en el editor) — en el editor admin (editable=true)
// siguen apareciendo igual, marcadas como desactivadas, para poder seguir editándolas y
// reactivarlas cuando quiera.
//
// Siempre en este orden — "Inicio" primero, "General" después — sin importar el campo
// "orden" real de cada una: "General" se crea al dar de alta el negocio (orden 0) y
// "Inicio" recién al elegir una plantilla (un orden mayor), así que por creación quedaría
// al revés para cualquier negocio.
const visiblePestanas = computed(() =>
  props.pestanas
    .filter((p) => (p.esGeneral || p.esHome) && (props.editable || p.activa !== false))
    .sort((a, b) => Number(!!b.esHome) - Number(!!a.esHome)),
)

// Pestaña activa: primer nivel de la estructura del catálogo, por encima de las
// Secciones. Si el negocio solo tiene una (o ninguna), no tiene sentido mostrar el
// selector — el catálogo se ve exactamente igual que antes de que existieran pestañas.
const activePestanaId = ref(visiblePestanas.value[0]?.id ?? null)
watch(
  visiblePestanas,
  (list) => {
    if (!list.some((p) => p.id === activePestanaId.value)) {
      activePestanaId.value = list[0]?.id ?? null
    }
  },
  { immediate: true },
)

// Secciones/productos de la pestaña activa. Los productos sin sección no pertenecen a
// ninguna pestaña en particular, así que se muestran en todas — solo se ocultan los que
// están en una Sección de OTRA pestaña.
const visibleSecciones = computed(() => {
  if (!activePestanaId.value) return props.secciones
  return props.secciones.filter((s) => s.pestanaId === activePestanaId.value)
})
const visibleSeccionIds = computed(() => new Set(visibleSecciones.value.map((s) => s.id)))
const productsForActiveTab = computed(() => {
  if (!visiblePestanas.value.length) return filtered.value
  return filtered.value.filter((p) => p.seccionId == null || visibleSeccionIds.value.has(p.seccionId))
})

// Pestaña "Inicio": la única pestaña propia de cada plantilla (la otra, "General", es
// siempre el mismo catálogo neutro — ver isGeneralTab). Moda y Accesorios ya tienen su
// estructura definida (portada tipo tienda real: carrusel + mosaico de categorías + fila de
// estilos); el resto de plantillas todavía no la tiene, así que su "Inicio" muestra un
// aviso de "por definir" (ver isPendingHomeTab).
const activePestana = computed(() => visiblePestanas.value.find((p) => p.id === activePestanaId.value) ?? null)
// Accesorios reusa la misma portada que Moda (carrusel + mosaico + estilos + shop the
// look), pero sin las secciones 5-7 (spotlight, estilos duplicada, piezas clave) — ver
// los "v-if=isModa" alrededor de esas tres en el template.
const isHomeTab = computed(() => (isModa.value || isAccesorios.value) && !!activePestana.value?.esHome)
// "Inicio" de una plantilla sin estructura definida todavía (Comida, Belleza, Calzado,
// Barbería) — mismo criterio que isHomeTab pero para el resto de plantillas.
const isPendingHomeTab = computed(() => !!activePestana.value?.esHome && !isHomeTab.value)

const search = ref('')
const categoryFilter = ref(props.initialCategoryFilter)

const filtered = computed(() =>
  props.productos
    .filter((p) => categoryFilter.value === 'all' || p.categoriaId === categoryFilter.value)
    .filter((p) => p.nombre.toLowerCase().includes(search.value.toLowerCase())),
)

// Catálogo general: se ven TODOS los productos registrados (respetando la búsqueda), sin
// importar en qué Sección estén, en vez de cualquier estilo decorativo. Se activa si el
// negocio no eligió ninguna plantilla (sin importar qué pestaña esté viendo — un negocio
// sin estilo no tiene estructura propia que mostrar) o si la pestaña activa es la
// "General" que arma la autocuración del backend (ver PestanaService.asegurarSinHuerfanas).
const isGeneralTab = computed(() => !template.value || !!activePestana.value?.esGeneral)
const generalProducts = computed(() => (isGeneralTab.value ? filtered.value : []))
const GENERAL_PAGE_SIZE = 12
const generalVisibleCount = ref(GENERAL_PAGE_SIZE)
watch(generalProducts, () => {
  generalVisibleCount.value = GENERAL_PAGE_SIZE
})
const generalVisibleProducts = computed(() => generalProducts.value.slice(0, generalVisibleCount.value))
function showMoreGeneral() {
  generalVisibleCount.value += GENERAL_PAGE_SIZE
}

// Todas las Secciones de Home arman el mosaico de categorías de más abajo.
const homeCategoryGroups = computed(() => (isHomeTab.value ? sectionGroups.value : []))
function firstImage(products) {
  return products.find((p) => p.imagenUrl) ?? null
}

// Mosaico de categorías, justo debajo del carrusel: SIEMPRE 2 filas — la primera con 2
// celdas, la segunda con 3 (5 celdas en total, cada una con su propio slot fijo
// "home-mosaic-1".."home-mosaic-5"), como el catálogo de referencia. La celda siempre se
// puede editar; si hay una Sección real de Home en esa posición, se usa como referencia
// para el nombre y el link, pero nunca es un requisito para poder subir la foto.
const categoryMosaicRows = computed(() => {
  const list = homeCategoryGroups.value
  const tiles = Array.from({ length: 5 }, (_, i) => ({ position: i + 1, section: list[i] ?? null }))
  return [tiles.slice(0, 2), tiles.slice(2, 5)]
})

// Tercera sección de Home: "Diferentes estilos para cada ocasión" — SIEMPRE 5 celdas fijas
// ("home-style-1".."home-style-5"), cada una editable sin importar cuántas Categorías
// tenga el negocio. Si hay una Categoría real en esa posición, se usa para el nombre y el
// producto representativo (destacado si hay, si no el primero con foto), pero nunca es un
// requisito para poder subir la foto.
const shopByStyleSlots = computed(() =>
  isHomeTab.value ? Array.from({ length: 5 }, (_, i) => ({ position: i + 1, categoria: props.categorias[i] ?? null })) : [],
)
function categoryHeroProduct(categoriaId) {
  if (categoriaId == null) return null
  const list = props.productos.filter((p) => p.categoriaId === categoriaId && p.imagenUrl)
  return list.find((p) => p.destacado) ?? list[0] ?? null
}

// Cuarta sección de Home: "Shop the look" — foto grande a la izquierda + producto
// destacado sobre fondo claro con botón "Comprar" a la derecha, como el catálogo de
// referencia. Se arma con hasta 2 productos reales destacados/en oferta; si el negocio
// solo tiene uno con foto, se usa el mismo de los dos lados.
const shopTheLookProducts = computed(() => {
  if (!isHomeTab.value) return []
  const withImages = props.productos.filter((p) => p.imagenUrl)
  const destacados = withImages.filter((p) => p.destacado)
  const promos = withImages.filter((p) => p.precioComparacion)
  const pool = destacados.length ? destacados : promos.length ? promos : withImages
  return pool.slice(0, 2)
})
const shopTheLookHighlight = computed(() => shopTheLookProducts.value[1] ?? shopTheLookProducts.value[0] ?? null)

// Quinta sección de Home: dos fotos grandes lado a lado — a la izquierda, el producto
// destacado con su nombre como título; a la derecha, un detalle/otra vista de otro
// producto real (o el mismo si es el único disponible), como el catálogo de referencia.
const productSpotlightProducts = computed(() => {
  if (!isHomeTab.value) return []
  const withImages = props.productos.filter((p) => p.imagenUrl)
  const destacados = withImages.filter((p) => p.destacado)
  const promos = withImages.filter((p) => p.precioComparacion)
  const pool = destacados.length ? destacados : promos.length ? promos : withImages
  return pool.slice(0, 2)
})
const productSpotlightDetail = computed(() => productSpotlightProducts.value[1] ?? productSpotlightProducts.value[0] ?? null)

// Séptima sección de Home: "Piezas clave" — SIEMPRE 3 celdas fijas ("home-keyitem-1".."3"),
// foto de borde a borde y el nombre como enlace subrayado debajo. Igual que la tercera
// sección, la Categoría real es solo referencia para el nombre/link, nunca un requisito.
const keyItemSlots = computed(() =>
  isHomeTab.value ? Array.from({ length: 3 }, (_, i) => ({ position: i + 1, categoria: props.categorias[i] ?? null })) : [],
)

// Carrusel de portada: hasta 5 posiciones fijas ("home-hero-1".."home-hero-5"), cada una
// con la foto que el negocio eligió para ese slot. En el editor se navegan las 5 siempre
// (para poder subir a cualquiera, incluso vacías, y reordenarlas); en público solo se ven
// las que ya tienen foto, en su mismo orden.
const HERO_SLOTS = ['home-hero-1', 'home-hero-2', 'home-hero-3', 'home-hero-4', 'home-hero-5']
const heroSlots = computed(() => {
  if (!isHomeTab.value) return []
  return props.editable ? HERO_SLOTS : HERO_SLOTS.filter((slot) => props.banners[slot])
})
const heroSlideIndex = ref(0)
function nextHeroSlide() {
  if (heroSlots.value.length) heroSlideIndex.value = (heroSlideIndex.value + 1) % heroSlots.value.length
}
function prevHeroSlide() {
  if (heroSlots.value.length) heroSlideIndex.value = (heroSlideIndex.value - 1 + heroSlots.value.length) % heroSlots.value.length
}
let heroAutoplay = null
watch(
  heroSlots,
  (slots) => {
    if (heroSlideIndex.value >= slots.length) heroSlideIndex.value = Math.max(0, slots.length - 1)
    clearInterval(heroAutoplay)
    // Sin autoplay mientras se edita: si avanzara solo, competiría con el negocio
    // navegando a mano para elegir/reordenar una diapositiva puntual.
    if (!props.editable && slots.length > 1) heroAutoplay = setInterval(nextHeroSlide, 5000)
  },
  { immediate: true },
)
onUnmounted(() => clearInterval(heroAutoplay))

// Con plantilla, el catálogo se muestra completo (sin paginar) organizado por Secciones
// reales de la pestaña activa. Si el negocio todavía no creó ninguna, groupBySections
// devuelve un solo grupo sin nombre con todos los productos — el catálogo se ve igual de
// bien, solo sin encabezados. En el editor (editable=true) también se incluyen las
// secciones vacías: si no se mostraran, el negocio no tendría forma de saber que una
// sección recién creada existe.
const sectionGroups = computed(() =>
  groupBySections(productsForActiveTab.value, visibleSecciones.value, { includeEmpty: props.editable }),
)
</script>

<template>
  <!-- Navbar compartido por todos los estilos de catálogo: franja negra con mensaje en
       movimiento arriba, nombre del negocio centrado, pestañas centradas debajo (si hay
       más de una). En mobile, sin espacio para centrar sin que se corten, las pestañas
       bajan a una fila con scroll horizontal. Todo el bloque queda pegado arriba al hacer scroll. -->
  <div class="sticky top-0 z-10">
    <TopbarMarquee
      :model-value="sectionTitle('catalog-topbar')"
      :editable="editable"
      @save="(texto) => saveSectionTitle('catalog-topbar', texto)"
      @clear="() => removeSectionTitle('catalog-topbar')"
    />
    <div class="border-b border-slate-200 bg-white/90 backdrop-blur">
      <div class="mx-auto flex h-24 max-w-6xl items-center justify-center px-4 sm:px-6">
        <p class="min-w-0 truncate text-3xl font-bold uppercase tracking-wide text-slate-900">{{ business.name }}</p>
      </div>

      <div v-if="visiblePestanas.length > 1" class="hidden flex-wrap items-center justify-center gap-10 px-4 pb-3 md:flex">
        <button
          v-for="p in visiblePestanas"
          :key="p.id"
          type="button"
          class="border-b-2 pb-1 text-sm uppercase tracking-wide text-slate-900 transition-colors"
          :class="activePestanaId === p.id ? 'border-slate-900 font-semibold' : 'border-transparent font-medium opacity-60 hover:opacity-100'"
          @click="activePestanaId = p.id"
        >
          {{ p.nombre }}
          <span v-if="editable && p.activa === false" class="ml-1 normal-case tracking-normal text-rose-500">(desactivada)</span>
        </button>
      </div>

      <div v-if="visiblePestanas.length > 1" class="flex gap-6 overflow-x-auto px-4 pb-3 md:hidden">
        <button
          v-for="p in visiblePestanas"
          :key="p.id"
          type="button"
          class="shrink-0 border-b-2 pb-1 text-sm text-slate-900 transition-colors"
          :class="activePestanaId === p.id ? 'border-slate-900 font-semibold' : 'border-transparent font-medium opacity-60 hover:opacity-100'"
          @click="activePestanaId = p.id"
        >
          {{ p.nombre }}
          <span v-if="editable && p.activa === false" class="ml-1 text-rose-500">(desactivada)</span>
        </button>
      </div>
    </div>
  </div>

  <!-- Pestaña "General": catálogo completo del negocio, sin el estilo decorativo de la
       plantilla — todos los productos registrados, en una grilla simple con precio,
       descuento y buscador, como el catálogo de referencia (catalog.png). -->
  <template v-if="isGeneralTab">
    <div class="mx-auto max-w-[1440px] px-6 pb-16 pt-8 sm:px-10 lg:px-12">
      <div class="relative mb-8">
        <Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input
          v-model="search"
          type="text"
          placeholder="Buscar productos…"
          class="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </div>

      <EditableSectionTitle
        :model-value="sectionTitle('general-catalog-title')"
        :editable="editable"
        @save="(texto) => saveSectionTitle('general-catalog-title', texto)"
        @clear="() => removeSectionTitle('general-catalog-title')"
      />

      <div v-if="generalVisibleProducts.length" class="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
        <component
          :is="editable ? 'div' : 'router-link'"
          v-for="p in generalVisibleProducts"
          :key="p.id"
          :to="editable ? undefined : { name: 'storefront-product', params: { slug, id: p.id } }"
          class="group flex flex-col"
        >
          <div class="relative flex aspect-square items-center justify-center overflow-hidden bg-slate-50 p-4 text-5xl">
            <img
              v-if="p.imagenUrl"
              :src="p.imagenUrl"
              class="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
              alt=""
            />
            <template v-else>{{ p.emoji }}</template>
            <span
              v-if="p.precioComparacion"
              class="absolute right-2.5 top-2.5 rounded bg-slate-900 px-2 py-1 text-[10px] font-bold uppercase text-white"
            >
              -{{ Math.round((1 - p.precio / p.precioComparacion) * 100) }}% off
            </span>
            <EditableTileOverlay
              v-if="editable"
              :show-move="false"
              :uploading="isUploading(p.id)"
              @upload="emitUpload(p, $event)"
            />
          </div>
          <div class="mt-3 flex flex-col gap-0.5">
            <p class="text-xs font-bold uppercase tracking-wide text-slate-900">{{ p.nombre }}</p>
            <div class="flex items-baseline gap-2">
              <span class="text-sm font-bold text-slate-900">{{ formatCurrency(p.precio) }}</span>
              <span v-if="p.precioComparacion" class="text-xs text-slate-400 line-through">{{ formatCurrency(p.precioComparacion) }}</span>
            </div>
            <p v-if="p.descripcion" class="line-clamp-1 text-xs text-slate-500">{{ p.descripcion }}</p>
          </div>
        </component>
      </div>
      <EmptyState
        v-else
        :icon="LayoutGrid"
        title="No encontramos productos"
        description="Prueba con otra búsqueda."
      />

      <div v-if="generalVisibleProducts.length < generalProducts.length" class="mt-10 flex justify-center">
        <button
          type="button"
          class="text-sm font-semibold uppercase tracking-wide text-slate-900 underline underline-offset-4 hover:no-underline"
          @click="showMoreGeneral"
        >
          Ver más
        </button>
      </div>
    </div>
  </template>

  <!-- Template PRO: tipografía minimalista, fotos grandes — comparte el navbar de arriba. -->
  <!-- Pestaña "Inicio" de Moda/Accesorios: portada tipo home de tienda de ropa (carrusel +
       mosaico de categorías + fila de estilos + shop the look, ver isModa más abajo para
       las secciones 5-7 exclusivas de Moda). -->
  <template v-else-if="isHomeTab">
    <div class="mx-auto max-w-[1600px] px-6 pb-16 sm:px-10 lg:px-16">
      <template v-if="sectionGroups.length">
        <div class="flex flex-col gap-16">
          <!-- Carrusel de portada: banner grande con flechas + puntos si hay más de una foto.
               La foto de cada diapositiva es SOLO la que el negocio eligió para ese slot.
               En el editor, el botón "Reordenar" abre un modal con todas las diapositivas
               para cambiar su orden o su foto sin ir moviéndolas una por una. -->
          <EditableSectionTitle
            :model-value="sectionTitle('home-title-hero')"
            :editable="editable"
            @save="(texto) => saveSectionTitle('home-title-hero', texto)"
            @clear="() => removeSectionTitle('home-title-hero')"
          />
          <div class="group relative left-1/2 h-[78vh] max-h-[50rem] min-h-[28rem] w-screen -translate-x-1/2 overflow-hidden">
            <template v-if="bannerUrl(heroSlots[heroSlideIndex])">
              <img :src="bannerUrl(heroSlots[heroSlideIndex])" class="h-full w-full object-cover" alt="" />
              <div class="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-transparent" />
              <p class="absolute bottom-6 left-6 text-[11px] font-semibold uppercase tracking-[0.25em] text-white sm:bottom-10 sm:left-10">
                Nueva colección
              </p>
            </template>
            <div v-else class="flex h-full w-full flex-col items-center justify-center gap-2 border border-dashed border-slate-300 bg-slate-50/60 px-4 text-center">
              <ImagePlus class="size-8 text-slate-300" />
              <p class="text-xs text-slate-400">Sube una foto para esta diapositiva</p>
            </div>
            <button
              v-if="editable"
              type="button"
              class="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/0 opacity-0 transition-all group-hover:bg-slate-900/40 group-hover:opacity-100"
              @click.stop="pickBanner(heroSlots[heroSlideIndex])"
            >
              <span class="flex size-9 items-center justify-center rounded-full bg-white/90 text-slate-700"><Camera class="size-4" /></span>
            </button>
            <div v-if="isUploadingBanner(heroSlots[heroSlideIndex])" class="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/60">
              <Loader2 class="size-5 animate-spin text-white" />
            </div>
            <button
              v-if="editable"
              type="button"
              class="absolute right-4 top-4 z-10 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-white sm:right-6 sm:top-6"
              @click.stop="emit('reorder-hero')"
            >
              <ArrowLeftRight class="size-3.5" />
              Reordenar
            </button>
            <template v-if="heroSlots.length > 1">
              <button
                type="button"
                class="absolute left-4 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-slate-700 backdrop-blur transition-colors hover:bg-white sm:left-6"
                @click="prevHeroSlide"
              >
                <ChevronLeft class="size-5" />
              </button>
              <button
                type="button"
                class="absolute right-4 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-slate-700 backdrop-blur transition-colors hover:bg-white sm:right-6"
                @click="nextHeroSlide"
              >
                <ChevronRight class="size-5" />
              </button>
              <div class="absolute inset-x-0 bottom-4 z-10 flex justify-center gap-1.5 sm:bottom-6">
                <button
                  v-for="(slot, si) in heroSlots"
                  :key="slot"
                  type="button"
                  class="h-1.5 rounded-full transition-all"
                  :class="si === heroSlideIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/50'"
                  @click="heroSlideIndex = si"
                />
              </div>
            </template>
          </div>

          <!-- Mosaico: SIEMPRE fila de 2 + fila de 3. Las 5 celdas son siempre editables,
               tengan o no una Sección real detrás — nunca dependen de que el negocio ya
               haya creado una. Título opcional a elección del negocio. -->
          <EditableSectionTitle
            :model-value="sectionTitle('home-title-mosaic')"
            :editable="editable"
            @save="(texto) => saveSectionTitle('home-title-mosaic', texto)"
            @clear="() => removeSectionTitle('home-title-mosaic')"
          />
          <div class="relative left-1/2 flex w-screen -translate-x-1/2 flex-col gap-1">
            <div v-for="(row, ri) in categoryMosaicRows" :key="ri" class="grid gap-1" :class="ri === 0 ? 'grid-cols-2' : 'grid-cols-3'">
              <component
                :is="!editable && tile.section && bannerUrl(`home-mosaic-${tile.position}`) && firstImage(tile.section.productos) ? 'router-link' : 'div'"
                v-for="tile in row"
                :key="tile.position"
                :to="
                  !editable && tile.section && bannerUrl(`home-mosaic-${tile.position}`) && firstImage(tile.section.productos)
                    ? { name: 'storefront-product', params: { slug, id: firstImage(tile.section.productos).id } }
                    : undefined
                "
                class="group relative block overflow-hidden bg-slate-100"
                :class="ri === 0 ? 'aspect-[6/5]' : 'aspect-[4/5]'"
              >
                <img
                  v-if="bannerUrl(`home-mosaic-${tile.position}`)"
                  :src="bannerUrl(`home-mosaic-${tile.position}`)"
                  class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  alt=""
                />
                <div
                  v-else
                  class="flex h-full w-full flex-col items-center justify-center gap-2 border border-dashed border-slate-300 bg-slate-50/60 px-4 text-center"
                >
                  <ImagePlus class="size-6 text-slate-300" />
                  <p class="text-xs text-slate-400">Sube una foto para este espacio</p>
                </div>
                <button
                  v-if="editable"
                  type="button"
                  class="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/0 opacity-0 transition-all group-hover:bg-slate-900/40 group-hover:opacity-100"
                  @click.stop="pickBanner(`home-mosaic-${tile.position}`)"
                >
                  <span class="flex size-8 items-center justify-center rounded-full bg-white/90 text-slate-700"><Camera class="size-4" /></span>
                </button>
                <div v-if="isUploadingBanner(`home-mosaic-${tile.position}`)" class="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/60">
                  <Loader2 class="size-5 animate-spin text-white" />
                </div>
              </component>
            </div>
          </div>

          <!-- Tercera sección: título opcional a elección del negocio. -->
          <div class="relative left-1/2 w-screen -translate-x-1/2">
            <EditableSectionTitle
              :model-value="sectionTitle('home-title-style-1')"
              :editable="editable"
              @save="(texto) => saveSectionTitle('home-title-style-1', texto)"
              @clear="() => removeSectionTitle('home-title-style-1')"
            />
            <div class="bg-slate-100 px-6 py-12 sm:px-10">
              <div class="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 md:grid-cols-5">
                <div v-for="tile in shopByStyleSlots" :key="tile.position" class="flex flex-col items-center gap-3 text-center">
                  <component
                    :is="!editable && bannerUrl(`home-style-${tile.position}`) && categoryHeroProduct(tile.categoria?.id) ? 'router-link' : 'div'"
                    :to="
                      !editable && bannerUrl(`home-style-${tile.position}`) && categoryHeroProduct(tile.categoria?.id)
                        ? { name: 'storefront-product', params: { slug, id: categoryHeroProduct(tile.categoria?.id).id } }
                        : undefined
                    "
                    class="group relative flex aspect-square w-full items-center justify-center overflow-hidden bg-white p-4"
                  >
                    <img
                      v-if="bannerUrl(`home-style-${tile.position}`)"
                      :src="bannerUrl(`home-style-${tile.position}`)"
                      class="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                      alt=""
                    />
                    <div v-else class="flex h-full w-full flex-col items-center justify-center gap-2 border border-dashed border-slate-300 text-center">
                      <ImagePlus class="size-6 text-slate-300" />
                      <p class="text-[11px] text-slate-400">Sube una foto para este espacio</p>
                    </div>
                    <button
                      v-if="editable"
                      type="button"
                      class="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/0 opacity-0 transition-all group-hover:bg-slate-900/40 group-hover:opacity-100"
                      @click.stop="pickBanner(`home-style-${tile.position}`)"
                    >
                      <span class="flex size-8 items-center justify-center rounded-full bg-white/90 text-slate-700"><Camera class="size-4" /></span>
                    </button>
                    <div v-if="isUploadingBanner(`home-style-${tile.position}`)" class="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/60">
                      <Loader2 class="size-5 animate-spin text-white" />
                    </div>
                  </component>
                </div>
              </div>
            </div>
          </div>

          <!-- Cuarta sección ("Shop the look"): foto grande a la izquierda + producto
               destacado con botón "Comprar" a la derecha. Siempre editable, tenga o no el
               negocio productos destacados/en oferta con foto todavía. Título opcional. -->
          <EditableSectionTitle
            :model-value="sectionTitle('home-title-look')"
            :editable="editable"
            @save="(texto) => saveSectionTitle('home-title-look', texto)"
            @clear="() => removeSectionTitle('home-title-look')"
          />
          <div class="relative left-1/2 grid w-screen -translate-x-1/2 grid-cols-1 sm:grid-cols-2">
            <div class="group relative h-[28rem] overflow-hidden bg-slate-100 sm:h-[34rem]">
              <img v-if="bannerUrl('home-look-left')" :src="bannerUrl('home-look-left')" class="h-full w-full object-cover" alt="" />
              <div v-else class="flex h-full w-full flex-col items-center justify-center gap-2 border border-dashed border-slate-300 bg-slate-50/60 px-4 text-center">
                <ImagePlus class="size-6 text-slate-300" />
                <p class="text-xs text-slate-400">Sube una foto para este espacio</p>
              </div>
              <button
                v-if="editable"
                type="button"
                class="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/0 opacity-0 transition-all group-hover:bg-slate-900/40 group-hover:opacity-100"
                @click.stop="pickBanner('home-look-left')"
              >
                <span class="flex size-9 items-center justify-center rounded-full bg-white/90 text-slate-700"><Camera class="size-4" /></span>
              </button>
              <div v-if="isUploadingBanner('home-look-left')" class="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/60">
                <Loader2 class="size-5 animate-spin text-white" />
              </div>
            </div>
            <div class="group relative flex h-[28rem] flex-col items-center justify-center gap-6 bg-slate-50 px-6 py-10 sm:h-[34rem]">
              <div v-if="bannerUrl('home-look-right')" class="flex w-full max-w-xs items-center justify-center">
                <img :src="bannerUrl('home-look-right')" class="max-h-56 w-full object-contain" alt="" />
              </div>
              <div v-else class="flex w-full max-w-xs flex-col items-center justify-center gap-2 border border-dashed border-slate-300 px-4 py-10 text-center">
                <ImagePlus class="size-6 text-slate-300" />
                <p class="text-xs text-slate-400">Sube una foto para este espacio</p>
              </div>
              <component
                :is="!editable && bannerUrl('home-look-right') && shopTheLookHighlight ? 'router-link' : 'div'"
                :to="
                  !editable && bannerUrl('home-look-right') && shopTheLookHighlight
                    ? { name: 'storefront-product', params: { slug, id: shopTheLookHighlight.id } }
                    : undefined
                "
                class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-900 underline underline-offset-4"
              >
                Comprar
              </component>
              <button
                v-if="editable"
                type="button"
                class="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/0 opacity-0 transition-all group-hover:bg-slate-900/40 group-hover:opacity-100"
                @click.stop="pickBanner('home-look-right')"
              >
                <span class="flex size-9 items-center justify-center rounded-full bg-white/90 text-slate-700"><Camera class="size-4" /></span>
              </button>
              <div v-if="isUploadingBanner('home-look-right')" class="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/60">
                <Loader2 class="size-5 animate-spin text-white" />
              </div>
            </div>
          </div>

          <!-- Secciones 5-7: exclusivas de Moda — Accesorios reusa esta misma portada pero
               solo hasta la cuarta sección (shop the look). -->
          <template v-if="isModa">
          <!-- Quinta sección (producto en detalle): dos fotos grandes lado a lado. Siempre
               editable, tenga o no el negocio productos destacados/en oferta con foto
               todavía. Título opcional a elección del negocio. -->
          <EditableSectionTitle
            :model-value="sectionTitle('home-title-spotlight')"
            :editable="editable"
            @save="(texto) => saveSectionTitle('home-title-spotlight', texto)"
            @clear="() => removeSectionTitle('home-title-spotlight')"
          />
          <div class="relative left-1/2 grid w-screen -translate-x-1/2 grid-cols-1 sm:grid-cols-2">
            <div class="group relative h-[26rem] overflow-hidden bg-slate-100 sm:h-[32rem]">
              <img v-if="bannerUrl('home-spotlight-left')" :src="bannerUrl('home-spotlight-left')" class="h-full w-full object-cover" alt="" />
              <div v-else class="flex h-full w-full flex-col items-center justify-center gap-2 border border-dashed border-slate-300 bg-slate-50/60 px-4 text-center">
                <ImagePlus class="size-6 text-slate-300" />
                <p class="text-xs text-slate-400">Sube una foto para este espacio</p>
              </div>
              <button
                v-if="editable"
                type="button"
                class="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/0 opacity-0 transition-all group-hover:bg-slate-900/40 group-hover:opacity-100"
                @click.stop="pickBanner('home-spotlight-left')"
              >
                <span class="flex size-9 items-center justify-center rounded-full bg-white/90 text-slate-700"><Camera class="size-4" /></span>
              </button>
              <div v-if="isUploadingBanner('home-spotlight-left')" class="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/60">
                <Loader2 class="size-5 animate-spin text-white" />
              </div>
            </div>
            <component
              :is="!editable && bannerUrl('home-spotlight-right') && productSpotlightDetail ? 'router-link' : 'div'"
              :to="
                !editable && bannerUrl('home-spotlight-right') && productSpotlightDetail
                  ? { name: 'storefront-product', params: { slug, id: productSpotlightDetail.id } }
                  : undefined
              "
              class="group relative block h-[26rem] overflow-hidden bg-slate-100 sm:h-[32rem]"
            >
              <img
                v-if="bannerUrl('home-spotlight-right')"
                :src="bannerUrl('home-spotlight-right')"
                class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                alt=""
              />
              <div v-else class="flex h-full w-full flex-col items-center justify-center gap-2 border border-dashed border-slate-300 bg-slate-50/60 px-4 text-center">
                <ImagePlus class="size-6 text-slate-300" />
                <p class="text-xs text-slate-400">Sube una foto para este espacio</p>
              </div>
              <button
                v-if="editable"
                type="button"
                class="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/0 opacity-0 transition-all group-hover:bg-slate-900/40 group-hover:opacity-100"
                @click.stop="pickBanner('home-spotlight-right')"
              >
                <span class="flex size-9 items-center justify-center rounded-full bg-white/90 text-slate-700"><Camera class="size-4" /></span>
              </button>
              <div v-if="isUploadingBanner('home-spotlight-right')" class="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/60">
                <Loader2 class="size-5 animate-spin text-white" />
              </div>
            </component>
          </div>

          <!-- Sexta sección: misma estructura y datos de la tercera; título opcional propio. -->
          <div class="relative left-1/2 w-screen -translate-x-1/2">
            <EditableSectionTitle
              :model-value="sectionTitle('home-title-style-2')"
              :editable="editable"
              @save="(texto) => saveSectionTitle('home-title-style-2', texto)"
              @clear="() => removeSectionTitle('home-title-style-2')"
            />
            <div class="bg-slate-100 px-6 py-12 sm:px-10">
              <div class="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 md:grid-cols-5">
                <div v-for="tile in shopByStyleSlots" :key="tile.position" class="flex flex-col items-center gap-3 text-center">
                  <component
                    :is="!editable && bannerUrl(`home-style-${tile.position}`) && categoryHeroProduct(tile.categoria?.id) ? 'router-link' : 'div'"
                    :to="
                      !editable && bannerUrl(`home-style-${tile.position}`) && categoryHeroProduct(tile.categoria?.id)
                        ? { name: 'storefront-product', params: { slug, id: categoryHeroProduct(tile.categoria?.id).id } }
                        : undefined
                    "
                    class="group relative flex aspect-square w-full items-center justify-center overflow-hidden bg-white p-4"
                  >
                    <img
                      v-if="bannerUrl(`home-style-${tile.position}`)"
                      :src="bannerUrl(`home-style-${tile.position}`)"
                      class="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                      alt=""
                    />
                    <div v-else class="flex h-full w-full flex-col items-center justify-center gap-2 border border-dashed border-slate-300 text-center">
                      <ImagePlus class="size-6 text-slate-300" />
                      <p class="text-[11px] text-slate-400">Sube una foto para este espacio</p>
                    </div>
                    <button
                      v-if="editable"
                      type="button"
                      class="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/0 opacity-0 transition-all group-hover:bg-slate-900/40 group-hover:opacity-100"
                      @click.stop="pickBanner(`home-style-${tile.position}`)"
                    >
                      <span class="flex size-8 items-center justify-center rounded-full bg-white/90 text-slate-700"><Camera class="size-4" /></span>
                    </button>
                    <div v-if="isUploadingBanner(`home-style-${tile.position}`)" class="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/60">
                      <Loader2 class="size-5 animate-spin text-white" />
                    </div>
                  </component>
                </div>
              </div>
            </div>
          </div>

          <!-- Séptima sección: foto de borde a borde, título opcional a elección del negocio. -->
          <div class="relative left-1/2 w-screen -translate-x-1/2">
            <EditableSectionTitle
              :model-value="sectionTitle('home-title-keyitems')"
              :editable="editable"
              @save="(texto) => saveSectionTitle('home-title-keyitems', texto)"
              @clear="() => removeSectionTitle('home-title-keyitems')"
            />
            <div class="grid grid-cols-1 gap-1 sm:grid-cols-3">
              <div v-for="tile in keyItemSlots" :key="tile.position" class="flex flex-col">
                <component
                  :is="!editable && bannerUrl(`home-keyitem-${tile.position}`) && categoryHeroProduct(tile.categoria?.id) ? 'router-link' : 'div'"
                  :to="
                    !editable && bannerUrl(`home-keyitem-${tile.position}`) && categoryHeroProduct(tile.categoria?.id)
                      ? { name: 'storefront-product', params: { slug, id: categoryHeroProduct(tile.categoria?.id).id } }
                      : undefined
                  "
                  class="group relative block aspect-[4/3] overflow-hidden bg-slate-100"
                >
                  <img
                    v-if="bannerUrl(`home-keyitem-${tile.position}`)"
                    :src="bannerUrl(`home-keyitem-${tile.position}`)"
                    class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    alt=""
                  />
                  <div
                    v-else
                    class="flex h-full w-full flex-col items-center justify-center gap-2 border border-dashed border-slate-300 bg-slate-50/60 text-center"
                  >
                    <ImagePlus class="size-6 text-slate-300" />
                    <p class="text-xs text-slate-400">Sube una foto para este espacio</p>
                  </div>
                  <button
                    v-if="editable"
                    type="button"
                    class="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/0 opacity-0 transition-all group-hover:bg-slate-900/40 group-hover:opacity-100"
                    @click.stop="pickBanner(`home-keyitem-${tile.position}`)"
                  >
                    <span class="flex size-8 items-center justify-center rounded-full bg-white/90 text-slate-700"><Camera class="size-4" /></span>
                  </button>
                  <div v-if="isUploadingBanner(`home-keyitem-${tile.position}`)" class="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/60">
                    <Loader2 class="size-5 animate-spin text-white" />
                  </div>
                </component>
              </div>
            </div>
          </div>
          </template>
        </div>
      </template>
      <EmptyState
        v-else
        :icon="LayoutGrid"
        title="No encontramos productos"
        description="Prueba con otra búsqueda o categoría."
        class="mt-10"
      />
    </div>
  </template>

  <!-- Pestaña "Inicio" de una plantilla sin estructura definida todavía (Comida, Belleza,
       Calzado, Barbería): aviso de "por definir" en vez de un diseño propio — el catálogo
       completo del negocio sigue disponible en la pestaña "General". -->
  <template v-else-if="isPendingHomeTab">
    <div class="mx-auto flex max-w-2xl flex-col items-center gap-3 px-6 py-24 text-center">
      <LayoutGrid class="size-8 text-slate-300" />
      <p class="text-lg font-semibold text-slate-900">Estructura por definir próximamente</p>
      <p class="text-sm text-slate-500">
        Estamos preparando el diseño de "Inicio" para {{ template?.label }}. Mientras tanto, tu
        catálogo completo ya está disponible en la pestaña "General".
      </p>
    </div>
  </template>


  <GallerySection v-if="template?.showGallery" :products="galleryProducts" :slug="slug" class="mt-10" />

  <ScheduleLocationSection
    v-if="template && (template.showSchedule || template.showLocation)"
    :schedule="template.showSchedule ? business.schedule : ''"
    :location="template.showLocation ? business.location : ''"
    class="mt-10"
  />
</template>
