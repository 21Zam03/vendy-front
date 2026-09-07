<script setup>
import { computed, onUnmounted, ref, watch } from 'vue'
import { Search, LayoutGrid, ChevronLeft, ChevronRight, ImagePlus, ChevronUp, ChevronDown, Camera, Loader2, ArrowLeftRight } from '@lucide/vue'
import EditableTileOverlay from './EditableTileOverlay.vue'
import EditableSectionTitle from './EditableSectionTitle.vue'
import TopbarMarquee from './TopbarMarquee.vue'
import GallerySection from './GallerySection.vue'
import ScheduleLocationSection from './ScheduleLocationSection.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { accentClasses } from '@/utils/theme'
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

const accent = computed(() => accentClasses(props.business.appearance.accentColor))
const layout = computed(() => props.business.appearance.catalogLayout ?? 'grid')

// La plantilla del negocio (elegida en Mi negocio → Estilo de negocio) define la
// estructura del CATÁLOGO — nunca la del perfil público, que se mantiene única para
// todos los negocios. Cada plantilla organiza su catálogo en las Secciones reales que
// el negocio administra (creadas a mano, o sugeridas al elegir la plantilla), respetando
// su orden y el orden de los productos dentro de cada una.
const template = computed(() => getTemplate(props.business.appearance.template))
const galleryProducts = computed(() => props.productos.filter((p) => p.imagenUrl).slice(0, 9))
const isPro = computed(() => layout.value === 'pro')

const isModa = computed(() => template.value?.key === 'moda')
const isComida = computed(() => template.value?.key === 'comida')
const isBelleza = computed(() => template.value?.key === 'belleza')
const isAccesorios = computed(() => template.value?.key === 'accesorios')
const isCalzado = computed(() => template.value?.key === 'calzado')
const isBarberia = computed(() => template.value?.key === 'barberia')

// Con el estilo "Catálogo general" (sin plantilla elegida), el catálogo es una sola
// grilla con todos los productos: cualquier otra pestaña que haya quedado de una
// plantilla anterior (ej. un "Inicio" de Moda) deja de mostrarse, aunque sigue existiendo
// en la base de datos por si el negocio vuelve a elegir esa plantilla más adelante — nunca
// se borra nada, solo se deja de listar acá.
const visiblePestanas = computed(() => (template.value ? props.pestanas : props.pestanas.filter((p) => p.esGeneral)))

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

// Pestaña "Home" de Moda: la plantilla Moda crea 3 pestañas por defecto (Home, Varones,
// Mujeres) — solo la de Home imita la portada de una tienda de ropa real (carrusel de
// banners + mosaico de categorías con foto + fila de estilos por categoría); Varones/Mujeres
// se quedan con la grilla lookbook simple de siempre.
const activePestana = computed(() => visiblePestanas.value.find((p) => p.id === activePestanaId.value) ?? null)
// "esHome" queda guardado en la pestaña misma (no depende de su nombre), así que el
// negocio puede renombrarla (ej. "Home" -> "Inicio") sin perder la estructura especial.
const isHomeTab = computed(() => isModa.value && !!activePestana.value?.esHome)

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

// Rellena una lista de productos con tarjetas vacías "sube una foto" hasta un mínimo, para
// que cada sección se vea completa aunque el negocio recién esté empezando (Moda, Accesorios,
// Calzado, y el resto de la grilla de Belleza).
function padTiles(products, minTiles) {
  const real = products.map((p) => ({ type: 'product', product: p }))
  const placeholders = Math.max(0, minTiles - real.length)
  return [...real, ...Array.from({ length: placeholders }, () => ({ type: 'placeholder' }))]
}
function isLargeTile(index) {
  return index % 4 === 0
}

// Elige el producto/servicio "estrella" de una sección (Belleza): el que está en oferta,
// o si no hay, el primero con foto, o el primero que sea.
function pickHero(products) {
  const withImages = products.filter((p) => p.imagenUrl)
  return withImages.find((p) => p.precioComparacion) ?? withImages[0] ?? products[0] ?? null
}

// Banners grandes intercalados entre secciones (Comida, como las fotos de campaña de
// Zara): se arman con fotos reales de productos en oferta o destacados; si el negocio
// todavía no tiene suficientes fotos, el espacio queda como guía vacía para que suba una.
const comidaBanners = computed(() => {
  const withImages = props.productos.filter((p) => p.imagenUrl)
  const promos = withImages.filter((p) => p.precioComparacion)
  const pool = promos.length ? promos : withImages
  return pool.slice(0, 2)
})
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
  <template v-else-if="isPro">
    <div class="mx-auto max-w-[1600px] px-6 pb-16 sm:px-10 lg:px-16">
      <!-- Con plantilla: cada Sección se muestra con el estilo de tarjeta del rubro. Este
           bloque solo se alcanza con isPro, que a su vez requiere una plantilla elegida
           (isGeneralTab ya se llevó todos los casos "sin plantilla" antes de llegar acá). -->
      <template v-if="sectionGroups.length">
        <!-- Moda · Home: portada tipo home de tienda de ropa (carrusel + mosaico de
             categorías + grilla densa de la primera sección). -->
        <div v-if="isHomeTab" class="flex flex-col gap-16">
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
        </div>

        <!-- Resto de plantillas (y las pestañas Varones/Mujeres de Moda): sin cambios. -->
        <div v-else class="mt-10 flex flex-col gap-16">
        <div v-for="g in sectionGroups" :key="g.id ?? 'sin-seccion'">
          <h2 v-if="g.nombre" class="mb-6 text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
            {{ g.nombre }}
          </h2>

          <!-- Moda: grilla estilo lookbook con tamaños alternados + espacios "sube más fotos". -->
          <div v-if="isModa" class="grid grid-flow-row-dense grid-cols-2 gap-x-6 gap-y-14 md:grid-cols-3 xl:grid-cols-4">
            <template v-for="(tile, i) in padTiles(g.productos, 8)" :key="i">
              <component
                :is="editable ? 'div' : 'router-link'"
                v-if="tile.type === 'product'"
                :to="editable ? undefined : { name: 'storefront-product', params: { slug, id: tile.product.id } }"
                class="group flex flex-col"
                :class="isLargeTile(i) ? 'col-span-2' : ''"
              >
                <div
                  class="relative flex aspect-[3/4] items-center justify-center overflow-hidden bg-gradient-to-br text-7xl transition-opacity group-hover:opacity-90 sm:text-8xl xl:text-9xl"
                  :class="tile.product.imagenUrl ? 'bg-slate-100' : tile.product.color"
                >
                  <img v-if="tile.product.imagenUrl" :src="tile.product.imagenUrl" class="h-full w-full object-cover" alt="" />
                  <template v-else>{{ tile.product.emoji }}</template>
                  <EditableTileOverlay
                    v-if="editable"
                    :can-move-up="i > 0"
                    :can-move-down="i < g.productos.length - 1"
                    :uploading="isUploading(tile.product.id)"
                    @move="emitMove(g.id, tile.product.id, $event)"
                    @upload="emitUpload(tile.product, $event)"
                  />
                </div>
                <div class="mt-3 flex flex-col gap-0.5">
                  <p class="line-clamp-1 text-xs font-medium uppercase tracking-wide text-slate-800">{{ tile.product.nombre }}</p>
                  <div class="flex items-baseline gap-2">
                    <span class="text-xs text-slate-600">{{ formatCurrency(tile.product.precio) }}</span>
                    <span v-if="tile.product.precioComparacion" class="text-xs text-slate-400 line-through">
                      {{ formatCurrency(tile.product.precioComparacion) }}
                    </span>
                  </div>
                </div>
              </component>

              <div
                v-else
                class="flex aspect-[3/4] flex-col items-center justify-center gap-2 rounded-sm border border-dashed border-slate-300 bg-slate-50/60 px-4 text-center"
                :class="isLargeTile(i) ? 'col-span-2' : ''"
              >
                <ImagePlus class="size-6 text-slate-300" />
                <p class="text-[11px] leading-snug text-slate-400">Sube más fotos para completar tu catálogo</p>
              </div>
            </template>
          </div>

          <!-- Belleza: un producto/servicio "estrella" grande arriba + grilla suave debajo. -->
          <template v-else-if="isBelleza">
            <component
              :is="editable ? 'div' : 'router-link'"
              v-if="pickHero(g.productos)"
              :to="editable ? undefined : { name: 'storefront-product', params: { slug, id: pickHero(g.productos).id } }"
              class="group block"
            >
              <div
                class="relative flex aspect-[16/9] items-center justify-center overflow-hidden rounded-[1.75rem] bg-gradient-to-br text-8xl sm:aspect-[21/9]"
                :class="pickHero(g.productos).imagenUrl ? 'bg-slate-100' : pickHero(g.productos).color"
              >
                <img
                  v-if="pickHero(g.productos).imagenUrl"
                  :src="pickHero(g.productos).imagenUrl"
                  class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  alt=""
                />
                <template v-else>{{ pickHero(g.productos).emoji }}</template>
                <EditableTileOverlay
                  v-if="editable"
                  :show-move="false"
                  :uploading="isUploading(pickHero(g.productos).id)"
                  @upload="emitUpload(pickHero(g.productos), $event)"
                />
              </div>
              <div class="mt-4 flex items-center justify-between">
                <p class="text-lg font-medium text-slate-900">{{ pickHero(g.productos).nombre }}</p>
                <span class="text-sm text-slate-500">{{ formatCurrency(pickHero(g.productos).precio) }}</span>
              </div>
            </component>

            <div class="mt-6 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3">
              <template
                v-for="(tile, i) in padTiles(g.productos.filter((p) => p.id !== pickHero(g.productos)?.id), 6)"
                :key="i"
              >
                <component
                  :is="editable ? 'div' : 'router-link'"
                  v-if="tile.type === 'product'"
                  :to="editable ? undefined : { name: 'storefront-product', params: { slug, id: tile.product.id } }"
                  class="group flex flex-col"
                >
                  <div
                    class="relative flex aspect-[4/5] items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br text-6xl transition-opacity group-hover:opacity-90"
                    :class="tile.product.imagenUrl ? 'bg-slate-100' : tile.product.color"
                  >
                    <img v-if="tile.product.imagenUrl" :src="tile.product.imagenUrl" class="h-full w-full object-cover" alt="" />
                    <template v-else>{{ tile.product.emoji }}</template>
                    <EditableTileOverlay
                      v-if="editable"
                      :can-move-up="g.productos.findIndex((p) => p.id === tile.product.id) > 0"
                      :can-move-down="g.productos.findIndex((p) => p.id === tile.product.id) < g.productos.length - 1"
                      :uploading="isUploading(tile.product.id)"
                      @move="emitMove(g.id, tile.product.id, $event)"
                      @upload="emitUpload(tile.product, $event)"
                    />
                  </div>
                  <div class="mt-2.5 flex items-center justify-between gap-2">
                    <p class="line-clamp-1 text-sm text-slate-800">{{ tile.product.nombre }}</p>
                    <span class="shrink-0 text-xs text-slate-500">{{ formatCurrency(tile.product.precio) }}</span>
                  </div>
                </component>

                <div
                  v-else
                  class="flex aspect-[4/5] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-4 text-center"
                >
                  <ImagePlus class="size-5 text-slate-300" />
                  <p class="text-[11px] leading-snug text-slate-400">Sube fotos de tus trabajos o productos</p>
                </div>
              </template>
            </div>
          </template>

          <!-- Accesorios: grilla uniforme minimalista, producto centrado y completo (sin recortar). -->
          <div v-else-if="isAccesorios" class="grid grid-cols-2 gap-x-8 gap-y-14 sm:grid-cols-3 xl:grid-cols-4">
            <template v-for="(tile, i) in padTiles(g.productos, 8)" :key="i">
              <component
                :is="editable ? 'div' : 'router-link'"
                v-if="tile.type === 'product'"
                :to="editable ? undefined : { name: 'storefront-product', params: { slug, id: tile.product.id } }"
                class="group flex flex-col"
              >
                <div class="relative flex aspect-square items-center justify-center overflow-hidden bg-slate-50 p-6 text-6xl">
                  <img
                    v-if="tile.product.imagenUrl"
                    :src="tile.product.imagenUrl"
                    class="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                    alt=""
                  />
                  <template v-else>{{ tile.product.emoji }}</template>
                  <EditableTileOverlay
                    v-if="editable"
                    :can-move-up="i > 0"
                    :can-move-down="i < g.productos.length - 1"
                    :uploading="isUploading(tile.product.id)"
                    @move="emitMove(g.id, tile.product.id, $event)"
                    @upload="emitUpload(tile.product, $event)"
                  />
                </div>
                <div class="mt-3 flex flex-col items-center gap-0.5 text-center">
                  <p class="line-clamp-1 text-xs font-medium uppercase tracking-wider text-slate-800">{{ tile.product.nombre }}</p>
                  <span class="text-xs text-slate-500">{{ formatCurrency(tile.product.precio) }}</span>
                </div>
              </component>

              <div
                v-else
                class="flex aspect-square flex-col items-center justify-center gap-2 border border-dashed border-slate-300 bg-slate-50/60 px-4 text-center"
              >
                <ImagePlus class="size-5 text-slate-300" />
                <p class="text-[11px] leading-snug text-slate-400">Sube una foto de cerca de tu producto</p>
              </div>
            </template>
          </div>

          <!-- Calzado: fotos horizontales completas + precio como etiqueta sobre la foto. -->
          <div v-else-if="isCalzado" class="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3">
            <template v-for="(tile, i) in padTiles(g.productos, 8)" :key="i">
              <component
                :is="editable ? 'div' : 'router-link'"
                v-if="tile.type === 'product'"
                :to="editable ? undefined : { name: 'storefront-product', params: { slug, id: tile.product.id } }"
                class="group flex flex-col"
              >
                <div class="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl bg-slate-50 p-5 text-6xl">
                  <img
                    v-if="tile.product.imagenUrl"
                    :src="tile.product.imagenUrl"
                    class="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                    alt=""
                  />
                  <template v-else>{{ tile.product.emoji }}</template>

                  <span
                    v-if="tile.product.precioComparacion"
                    class="absolute right-2.5 top-2.5 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-semibold text-white"
                  >
                    -{{ Math.round((1 - tile.product.precio / tile.product.precioComparacion) * 100) }}%
                  </span>
                  <span
                    class="absolute bottom-2.5 left-2.5 rounded-lg px-2.5 py-1 text-xs font-bold text-white shadow"
                    :class="accent.solid"
                  >
                    {{ formatCurrency(tile.product.precio) }}
                  </span>
                  <EditableTileOverlay
                    v-if="editable"
                    :can-move-up="i > 0"
                    :can-move-down="i < g.productos.length - 1"
                    :uploading="isUploading(tile.product.id)"
                    @move="emitMove(g.id, tile.product.id, $event)"
                    @upload="emitUpload(tile.product, $event)"
                  />
                </div>
                <p class="mt-3 line-clamp-1 text-sm font-semibold text-slate-900">{{ tile.product.nombre }}</p>
              </component>

              <div
                v-else
                class="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-4 text-center"
              >
                <ImagePlus class="size-5 text-slate-300" />
                <p class="text-[11px] leading-snug text-slate-400">Sube una foto de tu modelo</p>
              </div>
            </template>
          </div>
        </div>
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

  <!-- Templates Clásico / Lista: comparten el navbar de arriba. -->
  <template v-else>
    <div class="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div class="relative mb-6">
        <Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input
          v-model="search"
          type="text"
          placeholder="Buscar productos…"
          class="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </div>

      <!-- Barbería: lista de precios agrupada por Sección, como el cartel de una barbería. -->
      <div v-if="isBarberia" class="flex flex-col gap-8">
        <div v-for="g in sectionGroups" :key="g.id ?? 'sin-seccion'">
          <h2 class="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-slate-500">{{ g.nombre || 'Servicios' }}</h2>
          <div class="flex flex-col divide-y divide-slate-200 border-y border-slate-200">
            <component
              :is="editable ? 'div' : 'router-link'"
              v-for="(p, pIndex) in g.productos"
              :key="p.id"
              :to="editable ? undefined : { name: 'storefront-product', params: { slug, id: p.id } }"
              class="flex items-center gap-3 py-3.5 transition-colors hover:bg-slate-50"
            >
              <div
                class="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br text-xl"
                :class="p.imagenUrl ? 'bg-slate-100' : p.color"
              >
                <img v-if="p.imagenUrl" :src="p.imagenUrl" class="h-full w-full object-cover" alt="" />
                <template v-else>{{ p.emoji }}</template>
                <label v-if="editable" class="absolute inset-0 z-10 flex cursor-pointer items-center justify-center bg-slate-900/0 text-white opacity-0 transition-all hover:bg-slate-900/60 hover:opacity-100" @click.stop>
                  <Camera class="size-4" />
                  <input type="file" accept="image/*" class="hidden" @change="handleFileInput(p, $event)" />
                </label>
                <div v-if="isUploading(p.id)" class="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/60">
                  <Loader2 class="size-4 animate-spin text-white" />
                </div>
              </div>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-semibold text-slate-900">{{ p.nombre }}</p>
                <p v-if="p.descripcion" class="truncate text-xs text-slate-400">{{ p.descripcion }}</p>
              </div>
              <span class="shrink-0 text-base font-bold text-slate-900">{{ formatCurrency(p.precio) }}</span>
              <div v-if="editable" class="flex shrink-0 items-center gap-0.5" @click.stop.prevent>
                <button
                  type="button"
                  class="flex size-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-30"
                  :disabled="pIndex === 0"
                  @click="emitMove(g.id, p.id, -1)"
                >
                  <ChevronUp class="size-4" />
                </button>
                <button
                  type="button"
                  class="flex size-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-30"
                  :disabled="pIndex === g.productos.length - 1"
                  @click="emitMove(g.id, p.id, 1)"
                >
                  <ChevronDown class="size-4" />
                </button>
              </div>
            </component>
            <p v-if="editable && !g.productos.length" class="py-4 text-center text-xs text-slate-400">
              Sección vacía — asigna productos a "{{ g.nombre }}" desde el editor de secciones.
            </p>
          </div>
        </div>
        <EmptyState
          v-if="!sectionGroups.length"
          :icon="LayoutGrid"
          title="No encontramos servicios"
          description="Prueba con otra búsqueda."
        />
      </div>

      <!-- Comida/Repostería: agrupado por Sección, tipo menú, con precio destacado en la foto
           y banners grandes intercalados (como las fotos de campaña de un catálogo de moda),
           armados con productos reales en oferta/destacados. -->
      <div v-else-if="isComida" class="flex flex-col gap-10">
        <div
          class="relative flex h-40 items-center justify-center overflow-hidden rounded-2xl sm:h-56"
          :class="comidaBanners[0] ? '' : 'border border-dashed border-slate-300 bg-slate-50/60'"
        >
          <template v-if="comidaBanners[0]">
            <img :src="comidaBanners[0].imagenUrl" class="h-full w-full object-cover" alt="" />
            <div class="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent" />
            <div class="absolute inset-x-0 bottom-0 p-4">
              <p class="text-[11px] font-semibold uppercase tracking-wide text-white/80">
                {{ comidaBanners[0].precioComparacion ? 'Oferta especial' : 'Especial de la casa' }}
              </p>
              <p class="text-lg font-bold text-white">{{ comidaBanners[0].nombre }}</p>
            </div>
          </template>
          <div v-else class="flex flex-col items-center gap-2 px-4 text-center">
            <ImagePlus class="size-6 text-slate-300" />
            <p class="text-xs text-slate-400">Sube una foto grande para promocionar tu producto estrella</p>
          </div>
        </div>

        <template v-for="(g, gi) in sectionGroups" :key="g.id ?? 'sin-seccion'">
          <div>
            <h2 class="mb-4 text-base font-bold text-slate-900">{{ g.nombre || 'Catálogo' }}</h2>
            <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              <component
                :is="editable ? 'div' : 'router-link'"
                v-for="(p, pIndex) in g.productos"
                :key="p.id"
                :to="editable ? undefined : { name: 'storefront-product', params: { slug, id: p.id } }"
                class="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-shadow hover:shadow-md"
              >
                <div
                  class="relative flex aspect-square items-center justify-center overflow-hidden bg-gradient-to-br text-5xl"
                  :class="p.imagenUrl ? 'bg-slate-100' : p.color"
                >
                  <img v-if="p.imagenUrl" :src="p.imagenUrl" class="h-full w-full object-cover" alt="" />
                  <template v-else>{{ p.emoji }}</template>
                  <span
                    v-if="p.precioComparacion"
                    class="absolute left-2 top-2 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-semibold text-white"
                  >
                    -{{ Math.round((1 - p.precio / p.precioComparacion) * 100) }}%
                  </span>
                  <EditableTileOverlay
                    v-if="editable"
                    :can-move-up="pIndex > 0"
                    :can-move-down="pIndex < g.productos.length - 1"
                    :uploading="isUploading(p.id)"
                    @move="emitMove(g.id, p.id, $event)"
                    @upload="emitUpload(p, $event)"
                  />
                </div>
                <div class="flex flex-1 flex-col gap-1.5 p-3">
                  <p class="line-clamp-2 text-sm font-medium text-slate-900">{{ p.nombre }}</p>
                  <span
                    class="mt-auto inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-bold text-white"
                    :class="accent.solid"
                  >
                    {{ formatCurrency(p.precio) }}
                  </span>
                </div>
              </component>
            </div>
            <p v-if="editable && !g.productos.length" class="py-4 text-center text-xs text-slate-400">
              Sección vacía — asigna productos a "{{ g.nombre }}" desde el editor de secciones.
            </p>
          </div>

          <div
            v-if="gi === 0 && sectionGroups.length > 1"
            class="relative flex h-40 items-center justify-center overflow-hidden rounded-2xl sm:h-56"
            :class="comidaBanners[1] ? '' : 'border border-dashed border-slate-300 bg-slate-50/60'"
          >
            <template v-if="comidaBanners[1]">
              <img :src="comidaBanners[1].imagenUrl" class="h-full w-full object-cover" alt="" />
              <div class="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent" />
              <div class="absolute inset-x-0 bottom-0 p-4">
                <p class="text-[11px] font-semibold uppercase tracking-wide text-white/80">
                  {{ comidaBanners[1].precioComparacion ? 'Oferta especial' : 'Especial de la casa' }}
                </p>
                <p class="text-lg font-bold text-white">{{ comidaBanners[1].nombre }}</p>
              </div>
            </template>
            <div v-else class="flex flex-col items-center gap-2 px-4 text-center">
              <ImagePlus class="size-6 text-slate-300" />
              <p class="text-xs text-slate-400">Sube otra foto grande para destacar más productos</p>
            </div>
          </div>
        </template>

        <EmptyState
          v-if="!sectionGroups.length"
          :icon="LayoutGrid"
          title="No encontramos productos"
          description="Prueba con otra búsqueda o categoría."
        />
      </div>

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
