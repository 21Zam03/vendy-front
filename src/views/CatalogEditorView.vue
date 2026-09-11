<script setup>
import { onMounted, ref } from 'vue'
import StorefrontLayout from '@/layouts/StorefrontLayout.vue'
import CatalogTemplateRenderer from '@/components/storefront/CatalogTemplateRenderer.vue'
import MediaPickerModal from '@/components/storefront/MediaPickerModal.vue'
import HeroOrderModal from '@/components/storefront/HeroOrderModal.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import { Store, X, Rows3, Trash2, ChevronUp, ChevronDown } from '@lucide/vue'
import { useBusiness } from '@/composables/useBusiness'
import { listCategorias } from '@/api/categorias'
import { listSecciones, deleteSeccion, reorderSecciones } from '@/api/secciones'
import { listPestanas, updatePestanaActiva } from '@/api/pestanas'
import { listBanners, saveBanner, deleteBanner } from '@/api/banners'
import { listTextos, saveTexto, deleteTexto } from '@/api/textos'
import { listArchivos, uploadArchivo } from '@/api/archivos'
import { listProductos, updateProducto, uploadProductoImagen, reorderProductos } from '@/api/productos'
import { ApiError } from '@/api/http'
import { useToast } from '@/composables/useToast'
import { catalogAppearance } from '@/utils/theme'

// Pantalla aparte (sin el layout de administración) que renderiza el catálogo con el
// mismo motor que usan los visitantes reales (CatalogTemplateRenderer) — para que el
// negocio sienta que está parado en su propia página, pero en versión editable: subir
// fotos y reordenar directamente sobre las mismas tarjetas, en vez de un formulario aparte.
const { business, state: businessState, ensureInitialized } = useBusiness()
ensureInitialized()

const loading = ref(true)
const noNegocio = ref(false)
const categorias = ref([])
const productos = ref([])
const secciones = ref([])
const pestanas = ref([])
const banners = ref({})
const textos = ref({})
const archivos = ref([])

const { error: toastError } = useToast()

async function loadAll() {
  loading.value = true
  noNegocio.value = false
  try {
    const [cats, prods, secs, pest, bans, txts, archs] = await Promise.all([
      listCategorias(),
      listProductos(),
      listSecciones(),
      listPestanas(),
      listBanners(),
      listTextos(),
      listArchivos(),
    ])
    categorias.value = cats
    productos.value = prods
    secciones.value = secs
    pestanas.value = pest
    banners.value = bans
    textos.value = txts
    archivos.value = archs
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      noNegocio.value = true
    } else {
      toastError('No se pudo cargar el catálogo', { description: err.message })
    }
  } finally {
    loading.value = false
  }
}

onMounted(loadAll)

function productsInSection(sectionId) {
  return productos.value
    .filter((p) => p.seccionId === sectionId)
    .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0) || a.id - b.id)
}

async function handleMoveProduct({ sectionId, productId, direction }) {
  const list = productsInSection(sectionId)
  const index = list.findIndex((p) => p.id === productId)
  if (index === -1) return
  const target = index + direction
  if (target < 0 || target >= list.length) return

  const reordered = [...list]
  ;[reordered[index], reordered[target]] = [reordered[target], reordered[index]]

  try {
    const updated = await reorderProductos(sectionId, reordered.map((p) => p.id))
    updated.forEach((u) => {
      const i = productos.value.findIndex((p) => p.id === u.id)
      if (i !== -1) productos.value[i] = u
    })
  } catch (err) {
    toastError('No se pudo reordenar', { description: err.message })
  }
}

function productPayload(p, overrides = {}) {
  return {
    categoriaId: p.categoriaId,
    seccionId: p.seccionId,
    nombre: p.nombre,
    descripcion: p.descripcion,
    precio: p.precio,
    precioComparacion: p.precioComparacion,
    stock: p.stock,
    activo: p.activo,
    destacado: p.destacado,
    emoji: p.emoji,
    color: p.color,
    imagenUrl: p.imagenUrl,
    ...overrides,
  }
}

// Panel de secciones: solo para identificar, reordenar y eliminar — la estructura de
// pestañas y secciones viene fija según la plantilla elegida (ver Mi negocio → Estilo
// del catálogo), no se pueden agregar pestañas ni secciones nuevas desde ningún lado.
const showSectionsModal = ref(false)

function seccionesEnPestana(pestanaId) {
  return secciones.value.filter((s) => s.pestanaId === pestanaId)
}

// Desactivar una pestaña la oculta del catálogo público (ver visiblePestanas en
// CatalogTemplateRenderer.vue) sin perder sus secciones/productos — a diferencia de
// crear/renombrar/eliminar, esto sí está permitido. El backend rechaza dejar el negocio
// sin ninguna pestaña activa.
const togglingPestanaId = ref(null)
async function togglePestanaActiva(pestana) {
  togglingPestanaId.value = pestana.id
  try {
    const updated = await updatePestanaActiva(pestana.id, pestana.activa === false)
    const i = pestanas.value.findIndex((p) => p.id === pestana.id)
    if (i !== -1) pestanas.value[i] = updated
  } catch (err) {
    toastError('No se pudo cambiar el estado de la pestaña', { description: err.message })
  } finally {
    togglingPestanaId.value = null
  }
}

async function removeSection(section) {
  const inUse = productos.value.some((p) => p.seccionId === section.id)
  if (inUse) {
    toastError('No se puede eliminar', { description: 'Mueve sus productos a otra sección primero' })
    return
  }
  try {
    await deleteSeccion(section.id)
    secciones.value = secciones.value.filter((s) => s.id !== section.id)
  } catch (err) {
    toastError('No se pudo eliminar la sección', { description: err.message })
  }
}

// El orden solo importa entre secciones de la misma pestaña — reordenar acá nunca toca
// secciones de otras pestañas (el backend solo actualiza los ids que se le mandan).
async function moveSection(pestanaId, index, direction) {
  const list = seccionesEnPestana(pestanaId)
  const target = index + direction
  if (target < 0 || target >= list.length) return

  const reordered = [...list]
  ;[reordered[index], reordered[target]] = [reordered[target], reordered[index]]

  try {
    secciones.value = await reorderSecciones(reordered.map((s) => s.id))
  } catch (err) {
    toastError('No se pudo reordenar', { description: err.message })
  }
}

const uploadingIds = ref(new Set())

async function handleUploadPhoto({ product, file }) {
  uploadingIds.value = new Set(uploadingIds.value).add(product.id)
  try {
    const { url } = await uploadProductoImagen(file)
    const updated = await updateProducto(product.id, productPayload(product, { imagenUrl: url }))
    const i = productos.value.findIndex((p) => p.id === product.id)
    if (i !== -1) productos.value[i] = updated
  } catch (err) {
    toastError('No se pudo subir la foto', { description: err.message })
  } finally {
    const next = new Set(uploadingIds.value)
    next.delete(product.id)
    uploadingIds.value = next
  }
}

// Banners de plantilla (ej. las diapositivas del carrusel de Moda): a diferencia de las
// fotos de producto, no pertenecen a ningún Producto — son la foto elegida a mano por el
// negocio para ese espacio puntual, guardada por su "slot" y anulan la foto automática
// (destacado/en oferta) mientras exista. Se eligen desde MediaPickerModal: subiendo una
// foto nueva (que además queda guardada en "Archivos guardados" para reusar después) o
// eligiendo una ya subida ahí.
const uploadingBannerSlots = ref(new Set())
const pickerOpen = ref(false)
const pickerSlot = ref(null)
const pickerUploading = ref(false)
// Si el selector de fotos se abrió desde "Reordenar carrusel", hay que volver a ese modal
// al terminar (subir/elegir), en vez de dejar todo cerrado.
const pickerReturnsToHeroOrder = ref(false)

// Carrusel de portada de Home: 5 posiciones fijas, reordenables desde HeroOrderModal.
const HERO_SLOTS = ['home-hero-1', 'home-hero-2', 'home-hero-3', 'home-hero-4', 'home-hero-5']
const heroOrderOpen = ref(false)

function openBannerPicker(slot) {
  pickerReturnsToHeroOrder.value = false
  pickerSlot.value = slot
  pickerOpen.value = true
}

function openBannerPickerFromHeroOrder(slot) {
  heroOrderOpen.value = false
  pickerReturnsToHeroOrder.value = true
  pickerSlot.value = slot
  pickerOpen.value = true
}

function closePicker() {
  pickerOpen.value = false
  if (pickerReturnsToHeroOrder.value) {
    pickerReturnsToHeroOrder.value = false
    heroOrderOpen.value = true
  }
}

async function applyBannerSelection(slot, url) {
  uploadingBannerSlots.value = new Set(uploadingBannerSlots.value).add(slot)
  try {
    await saveBanner(slot, url)
    banners.value = { ...banners.value, [slot]: url }
  } catch (err) {
    toastError('No se pudo guardar la foto', { description: err.message })
  } finally {
    const next = new Set(uploadingBannerSlots.value)
    next.delete(slot)
    uploadingBannerSlots.value = next
  }
}

async function handlePickerUpload(file) {
  pickerUploading.value = true
  try {
    const archivo = await uploadArchivo(file)
    archivos.value = [archivo, ...archivos.value]
    await applyBannerSelection(pickerSlot.value, archivo.url)
    closePicker()
  } catch (err) {
    toastError('No se pudo subir la foto', { description: err.message })
  } finally {
    pickerUploading.value = false
  }
}

function handlePickerSelect(archivo) {
  closePicker()
  applyBannerSelection(pickerSlot.value, archivo.url)
}

// Reordenar el carrusel = intercambiar la foto guardada de dos slots. Se actualiza el
// estado local al toque (para que se vea instantáneo) y se persiste cada lado por
// separado — si un slot queda sin foto, se borra su registro en vez de guardar "".
async function handleMoveBanner({ slotA, slotB }) {
  const urlA = banners.value[slotA] ?? null
  const urlB = banners.value[slotB] ?? null
  if (!urlA && !urlB) return

  const next = { ...banners.value }
  if (urlB) next[slotA] = urlB
  else delete next[slotA]
  if (urlA) next[slotB] = urlA
  else delete next[slotB]
  banners.value = next

  try {
    await Promise.all([
      urlB ? saveBanner(slotA, urlB) : deleteBanner(slotA),
      urlA ? saveBanner(slotB, urlA) : deleteBanner(slotB),
    ])
  } catch (err) {
    toastError('No se pudo reordenar el carrusel', { description: err.message })
    banners.value = await listBanners()
  }
}

async function handleRemoveBanner(slot) {
  if (!banners.value[slot]) return
  const previous = banners.value
  const next = { ...banners.value }
  delete next[slot]
  banners.value = next

  try {
    await deleteBanner(slot)
  } catch (err) {
    toastError('No se pudo quitar la foto', { description: err.message })
    banners.value = previous
  }
}

// Títulos de sección: el negocio elige el texto (o ninguno) para cada una de las 7
// secciones de Home — nunca hay un título por defecto armado con categorías/productos.
async function handleSaveTitle({ slot, texto }) {
  const previous = textos.value
  textos.value = { ...textos.value, [slot]: texto }
  try {
    await saveTexto(slot, texto)
  } catch (err) {
    toastError('No se pudo guardar el título', { description: err.message })
    textos.value = previous
  }
}

async function handleRemoveTitle(slot) {
  if (!textos.value[slot]) return
  const previous = textos.value
  const next = { ...textos.value }
  delete next[slot]
  textos.value = next

  try {
    await deleteTexto(slot)
  } catch (err) {
    toastError('No se pudo quitar el título', { description: err.message })
    textos.value = previous
  }
}
</script>

<template>
  <div v-if="loading || businessState.loading" class="flex min-h-screen items-center justify-center text-sm text-slate-400">
    Cargando…
  </div>

  <EmptyState
    v-else-if="noNegocio || !businessState.exists"
    :icon="Store"
    title="Todavía no configuraste tu negocio"
    class="min-h-screen"
  >
    <template #action>
      <router-link :to="{ name: 'business-profile' }">
        <BaseButton>Configurar mi negocio</BaseButton>
      </router-link>
    </template>
  </EmptyState>

  <template v-else>
    <StorefrontLayout :appearance="catalogAppearance(business.appearance)">
      <CatalogTemplateRenderer
        editable
        :business="business"
        :productos="productos"
        :categorias="categorias"
        :secciones="secciones"
        :pestanas="pestanas"
        :banners="banners"
        :textos="textos"
        :slug="business.slug"
        :uploading-ids="uploadingIds"
        :uploading-banner-slots="uploadingBannerSlots"
        @move-product="handleMoveProduct"
        @upload-photo="handleUploadPhoto"
        @pick-banner="openBannerPicker"
        @reorder-hero="heroOrderOpen = true"
        @save-title="handleSaveTitle"
        @remove-title="handleRemoveTitle"
      />
    </StorefrontLayout>

    <MediaPickerModal
      :model-value="pickerOpen"
      :archivos="archivos"
      :uploading="pickerUploading"
      @update:model-value="(value) => (value ? (pickerOpen = true) : closePicker())"
      @upload="handlePickerUpload"
      @select="handlePickerSelect"
    />

    <HeroOrderModal
      v-model="heroOrderOpen"
      :slots="HERO_SLOTS"
      :banners="banners"
      :uploading-slots="uploadingBannerSlots"
      @move="handleMoveBanner"
      @pick="openBannerPickerFromHeroOrder"
      @remove="handleRemoveBanner"
    />

    <div class="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-4">
      <div class="flex items-center gap-2 rounded-full bg-slate-900/95 py-2 pl-4 pr-2 text-white shadow-xl ring-1 ring-white/10 backdrop-blur-md">
        <span class="text-sm font-medium">✏️ Estás editando tu catálogo</span>
        <button
          type="button"
          class="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-white/20"
          @click="showSectionsModal = true"
        >
          <Rows3 class="size-3.5" />
          Secciones
          <span v-if="secciones.length" class="rounded-full bg-white/20 px-1.5 text-[11px]">{{ secciones.length }}</span>
        </button>
        <router-link
          :to="{ name: 'catalog' }"
          class="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-white/20"
        >
          <X class="size-3.5" />
          Salir
        </router-link>
      </div>
    </div>

    <BaseModal
      v-model="showSectionsModal"
      title="Pestañas y secciones"
      description="Así se organiza tu catálogo: cada pestaña agrupa sus propias secciones, en este orden. Inicio y General son fijas (no se pueden renombrar, agregar más pestañas ni secciones nuevas), pero puedes desactivar la que no quieras mostrar en tu catálogo."
    >
      <div class="flex flex-col gap-4">
        <div v-for="p in pestanas" :key="p.id" class="rounded-lg border border-slate-200 p-3">
          <div class="mb-2 flex items-center justify-between gap-2">
            <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">{{ p.nombre }}</p>
            <button
              v-if="p.esHome || p.esGeneral"
              type="button"
              class="flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors disabled:opacity-50"
              :class="p.activa !== false ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'"
              :disabled="togglingPestanaId === p.id"
              @click="togglePestanaActiva(p)"
            >
              <span class="size-1.5 rounded-full" :class="p.activa !== false ? 'bg-emerald-500' : 'bg-slate-400'" />
              {{ p.activa !== false ? 'Activa' : 'Desactivada' }}
            </button>
          </div>
          <div class="flex flex-col gap-2">
            <div
              v-for="(s, index) in seccionesEnPestana(p.id)"
              :key="s.id"
              class="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2"
            >
              <span class="text-sm text-slate-700">{{ s.nombre }}</span>
              <div class="flex items-center gap-1">
                <BaseBadge size="sm" variant="slate">
                  {{ productos.filter((prod) => prod.seccionId === s.id).length }} productos
                </BaseBadge>
                <button
                  class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-30"
                  :disabled="index === 0"
                  @click="moveSection(p.id, index, -1)"
                >
                  <ChevronUp class="size-4" />
                </button>
                <button
                  class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-30"
                  :disabled="index === seccionesEnPestana(p.id).length - 1"
                  @click="moveSection(p.id, index, 1)"
                >
                  <ChevronDown class="size-4" />
                </button>
                <button class="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500" @click="removeSection(s)">
                  <Trash2 class="size-4" />
                </button>
              </div>
            </div>
            <p v-if="!seccionesEnPestana(p.id).length" class="text-xs text-slate-400">Sin secciones todavía.</p>
          </div>
        </div>
        <EmptyState
          v-if="!pestanas.length"
          :icon="Rows3"
          title="Sin pestañas"
          description="Elige un estilo de catálogo desde Mi negocio → Estilo del catálogo para armar tu estructura."
        />
      </div>
    </BaseModal>
  </template>
</template>
