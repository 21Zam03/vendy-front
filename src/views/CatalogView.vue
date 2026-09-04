<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import {
  Search,
  Plus,
  LayoutGrid,
  MoreHorizontal,
  Pencil,
  Trash2,
  Tags,
  Store,
  AlertTriangle,
  Star,
  Megaphone,
  Rows3,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  ImageOff,
} from '@lucide/vue'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseDropdown from '@/components/ui/BaseDropdown.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import Skeleton from '@/components/ui/Skeleton.vue'
import GeneratePostModal from '@/components/catalog/GeneratePostModal.vue'
import { productColorOptions } from '@/data/mock'
import { useBusiness } from '@/composables/useBusiness'
import { listCategorias, createCategoria, deleteCategoria } from '@/api/categorias'
import { listSecciones, createSeccion, deleteSeccion, reorderSecciones } from '@/api/secciones'
import { listProductos, createProducto, updateProducto, deleteProducto, uploadProductoImagen } from '@/api/productos'
import { buildProductoPreviewUrl, buildNegocioPreviewUrl } from '@/api/tienda'
import { ApiError } from '@/api/http'
import { formatCurrency } from '@/utils/format'
import { buildProductPost, buildCatalogPost } from '@/utils/socialContent'
import { useToast } from '@/composables/useToast'

const { success, error: toastError } = useToast()
const { business } = useBusiness()

const loading = ref(true)
const noNegocio = ref(false)
const products = ref([])
const categories = ref([])
const sections = ref([])

async function loadAll() {
  loading.value = true
  noNegocio.value = false
  try {
    const [cats, prods, secs] = await Promise.all([listCategorias(), listProductos(), listSecciones()])
    categories.value = cats
    products.value = prods
    sections.value = secs
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

const search = ref('')
const categoryFilter = ref('all')
const statusFilter = ref('all')

const showProductModal = ref(false)
const showCategoryModal = ref(false)
const showSectionModal = ref(false)
const showDeleteConfirm = ref(false)
const editingProduct = ref(null)
const productToDelete = ref(null)
const saving = ref(false)

const emptyForm = () => ({
  nombre: '',
  descripcion: '',
  precio: '',
  precioComparacion: '',
  stock: '',
  categoriaId: categories.value[0]?.id ?? null,
  seccionId: null,
  activo: true,
  destacado: false,
  emoji: '🛍️',
  color: productColorOptions[0],
  imagenUrl: '',
})
const form = ref(emptyForm())
const formErrors = ref({})
const uploadingImage = ref(false)

const categoryOptions = computed(() => [{ id: 'all', nombre: 'Todas' }, ...categories.value])

const filtered = computed(() =>
  products.value
    .filter((p) => categoryFilter.value === 'all' || p.categoriaId === categoryFilter.value)
    .filter((p) => statusFilter.value === 'all' || (statusFilter.value === 'active' ? p.activo : !p.activo))
    .filter((p) => p.nombre.toLowerCase().includes(search.value.toLowerCase())),
)

// Paginación del catálogo
const pageSizeOptions = [8, 12, 24]
const pageSize = ref(12)
const currentPage = ref(1)

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize.value)))
const paginated = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filtered.value.slice(start, start + pageSize.value)
})

watch([search, categoryFilter, statusFilter, pageSize], () => {
  currentPage.value = 1
})

watch(totalPages, (pages) => {
  if (currentPage.value > pages) currentPage.value = pages
})

function openCreate() {
  editingProduct.value = null
  form.value = emptyForm()
  formErrors.value = {}
  showProductModal.value = true
}

function openEdit(product) {
  editingProduct.value = product
  form.value = {
    nombre: product.nombre,
    descripcion: product.descripcion,
    precio: product.precio,
    precioComparacion: product.precioComparacion,
    stock: product.stock,
    categoriaId: product.categoriaId,
    seccionId: product.seccionId,
    activo: product.activo,
    destacado: product.destacado,
    emoji: product.emoji,
    color: product.color,
    imagenUrl: product.imagenUrl ?? '',
  }
  formErrors.value = {}
  showProductModal.value = true
}

async function handleImageUpload(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return

  uploadingImage.value = true
  try {
    const { url } = await uploadProductoImagen(file)
    form.value.imagenUrl = url
  } catch (err) {
    toastError('No se pudo subir la imagen', { description: err.message })
  } finally {
    uploadingImage.value = false
  }
}

async function saveProduct() {
  if (!form.value.nombre || !form.value.precio) return

  const payload = {
    categoriaId: form.value.categoriaId || null,
    seccionId: form.value.seccionId || null,
    nombre: form.value.nombre,
    descripcion: form.value.descripcion,
    precio: Number(form.value.precio),
    precioComparacion: form.value.precioComparacion ? Number(form.value.precioComparacion) : null,
    stock: form.value.stock ? Number(form.value.stock) : 0,
    activo: form.value.activo,
    destacado: form.value.destacado,
    emoji: form.value.emoji,
    color: form.value.color,
    imagenUrl: form.value.imagenUrl || null,
  }

  saving.value = true
  formErrors.value = {}
  try {
    if (editingProduct.value) {
      const updated = await updateProducto(editingProduct.value.id, payload)
      const index = products.value.findIndex((p) => p.id === editingProduct.value.id)
      products.value[index] = updated
      success('Producto actualizado', { description: updated.nombre })
    } else {
      const created = await createProducto(payload)
      products.value.unshift(created)
      success('Producto creado', { description: `${created.nombre} ya está en tu catálogo` })
    }
    showProductModal.value = false
  } catch (err) {
    if (err instanceof ApiError && err.status === 400 && err.data) {
      formErrors.value = err.data
    } else {
      toastError('No se pudo guardar el producto', { description: err.message })
    }
  } finally {
    saving.value = false
  }
}

function confirmDelete(product) {
  productToDelete.value = product
  showDeleteConfirm.value = true
}

async function deleteProductConfirmed() {
  try {
    await deleteProducto(productToDelete.value.id)
    products.value = products.value.filter((p) => p.id !== productToDelete.value.id)
    success('Producto eliminado', { description: productToDelete.value.nombre })
  } catch (err) {
    toastError('No se pudo eliminar el producto', { description: err.message })
  } finally {
    showDeleteConfirm.value = false
    productToDelete.value = null
  }
}

async function toggleActive(product) {
  const next = !product.activo
  try {
    const updated = await updateProducto(product.id, {
      categoriaId: product.categoriaId,
      seccionId: product.seccionId,
      nombre: product.nombre,
      descripcion: product.descripcion,
      precio: product.precio,
      precioComparacion: product.precioComparacion,
      stock: product.stock,
      activo: next,
      destacado: product.destacado,
      emoji: product.emoji,
      color: product.color,
      imagenUrl: product.imagenUrl,
    })
    Object.assign(product, updated)
  } catch (err) {
    toastError('No se pudo actualizar el producto', { description: err.message })
  }
}

async function toggleFeatured(product) {
  const next = !product.destacado
  try {
    const updated = await updateProducto(product.id, {
      categoriaId: product.categoriaId,
      seccionId: product.seccionId,
      nombre: product.nombre,
      descripcion: product.descripcion,
      precio: product.precio,
      precioComparacion: product.precioComparacion,
      stock: product.stock,
      activo: product.activo,
      destacado: next,
      emoji: product.emoji,
      color: product.color,
      imagenUrl: product.imagenUrl,
    })
    Object.assign(product, updated)
    success(next ? 'Producto destacado' : 'Ya no está destacado', { description: product.nombre })
  } catch (err) {
    toastError('No se pudo actualizar el producto', { description: err.message })
  }
}

// Categorías
const newCategory = ref({ nombre: '', emoji: '🏷️' })

async function addCategory() {
  if (!newCategory.value.nombre) return
  try {
    const created = await createCategoria({ nombre: newCategory.value.nombre, emoji: newCategory.value.emoji || '🏷️' })
    categories.value.push(created)
    categories.value.sort((a, b) => a.nombre.localeCompare(b.nombre))
    newCategory.value = { nombre: '', emoji: '🏷️' }
  } catch (err) {
    toastError('No se pudo crear la categoría', { description: err.message })
  }
}

async function removeCategory(category) {
  const inUse = products.value.some((p) => p.categoriaId === category.id)
  if (inUse) {
    toastError('No se puede eliminar', { description: 'Esta categoría tiene productos asignados' })
    return
  }
  try {
    await deleteCategoria(category.id)
    categories.value = categories.value.filter((c) => c.id !== category.id)
  } catch (err) {
    toastError('No se pudo eliminar la categoría', { description: err.message })
  }
}

// Secciones
const newSection = ref({ nombre: '' })

async function addSection() {
  if (!newSection.value.nombre) return
  try {
    const created = await createSeccion({ nombre: newSection.value.nombre })
    sections.value.push(created)
    newSection.value = { nombre: '' }
  } catch (err) {
    toastError('No se pudo crear la sección', { description: err.message })
  }
}

async function removeSection(section) {
  const inUse = products.value.some((p) => p.seccionId === section.id)
  if (inUse) {
    toastError('No se puede eliminar', { description: 'Esta sección tiene productos asignados' })
    return
  }
  try {
    await deleteSeccion(section.id)
    sections.value = sections.value.filter((s) => s.id !== section.id)
  } catch (err) {
    toastError('No se pudo eliminar la sección', { description: err.message })
  }
}

async function moveSection(index, direction) {
  const target = index + direction
  if (target < 0 || target >= sections.value.length) return

  const reordered = [...sections.value]
  ;[reordered[index], reordered[target]] = [reordered[target], reordered[index]]
  sections.value = reordered

  try {
    sections.value = await reorderSecciones(reordered.map((s) => s.id))
  } catch (err) {
    toastError('No se pudo reordenar', { description: err.message })
  }
}

// Generar publicación para redes sociales
const showPostModal = ref(false)
const postVariants = ref([])

function generateProductPost(product) {
  if (!business.slug) {
    toastError('Configura tu negocio primero', { description: 'Necesitas un enlace público para generar el texto' })
    return
  }
  const url = buildProductoPreviewUrl(business.slug, product.id)
  postVariants.value = buildProductPost(product, business.name, url)
  showPostModal.value = true
}

function generateCatalogPost() {
  if (!business.slug) {
    toastError('Configura tu negocio primero', { description: 'Necesitas un enlace público para generar el texto' })
    return
  }
  const url = buildNegocioPreviewUrl(business.slug)
  postVariants.value = buildCatalogPost(business.name, url)
  showPostModal.value = true
}
</script>

<template>
  <DashboardLayout>
    <PageHeader title="Mi catálogo" description="Los productos que tus clientes verán y podrán pedir por WhatsApp.">
      <template #action>
        <BaseButton variant="outline" @click="showCategoryModal = true">
          <Tags class="size-4" />
          Categorías
        </BaseButton>
        <BaseButton variant="outline" @click="showSectionModal = true">
          <Rows3 class="size-4" />
          Secciones
        </BaseButton>
        <a v-if="business.slug" :href="`/tienda/${business.slug}/catalogo`" target="_blank" rel="noopener">
          <BaseButton variant="outline">
            <Eye class="size-4" />
            Vista previa
          </BaseButton>
        </a>
        <BaseButton variant="outline" @click="generateCatalogPost">
          <Megaphone class="size-4" />
          Generar publicación
        </BaseButton>
        <BaseButton @click="openCreate">
          <Plus class="size-4" />
          Nuevo producto
        </BaseButton>
      </template>
    </PageHeader>

    <EmptyState
      v-if="!loading && noNegocio"
      :icon="Store"
      title="Todavía no configuraste tu negocio"
      description="Antes de agregar productos, completa el perfil de tu negocio."
    >
      <template #action>
        <router-link :to="{ name: 'business-profile' }">
          <BaseButton>Configurar mi negocio</BaseButton>
        </router-link>
      </template>
    </EmptyState>

    <BaseCard v-else :padded="false" class="flex flex-1 flex-col">
      <div class="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div class="relative w-full lg:max-w-xs">
          <Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            v-model="search"
            type="text"
            placeholder="Buscar producto…"
            class="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm focus:border-brand-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="c in categoryOptions"
              :key="c.id"
              class="rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
              :class="categoryFilter === c.id ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'"
              @click="categoryFilter = c.id"
            >
              {{ c.emoji ? c.emoji + ' ' : '' }}{{ c.nombre }}
            </button>
          </div>
          <select
            v-model="statusFilter"
            class="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-600 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
        </div>
      </div>

      <div class="flex-1 p-4">
        <div v-if="loading" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <div v-for="i in 8" :key="i" class="rounded-xl border border-slate-200 p-4">
            <Skeleton class="h-28 w-full" />
            <Skeleton class="mt-3 h-4 w-3/4" />
            <Skeleton class="mt-2 h-4 w-1/2" />
          </div>
        </div>

        <div v-else-if="filtered.length" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <div
            v-for="p in paginated"
            :key="p.id"
            class="rounded-xl border border-slate-200 transition-shadow hover:shadow-md"
            :class="!p.activo ? 'opacity-60' : ''"
          >
            <div class="relative flex h-44 items-center justify-center overflow-hidden rounded-t-xl bg-gradient-to-br text-5xl sm:h-48" :class="p.imagenUrl ? 'bg-slate-100' : p.color">
              <img v-if="p.imagenUrl" :src="p.imagenUrl" class="h-full w-full object-cover" alt="" />
              <template v-else>{{ p.emoji }}</template>
              <span
                v-if="p.precioComparacion"
                class="absolute right-2 top-2 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-semibold text-white"
              >
                -{{ Math.round((1 - p.precio / p.precioComparacion) * 100) }}%
              </span>
              <button
                class="absolute bottom-2 right-2 flex size-7 items-center justify-center rounded-full bg-white/90 shadow-sm transition-colors hover:bg-white"
                :title="p.destacado ? 'Quitar de destacados' : 'Marcar como destacado'"
                @click="toggleFeatured(p)"
              >
                <Star class="size-4" :class="p.destacado ? 'fill-amber-400 text-amber-400' : 'text-slate-400'" />
              </button>
            </div>
            <div class="p-4">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="truncate text-sm font-semibold text-slate-900">{{ p.nombre }}</p>
                  <p class="text-xs text-slate-400">{{ p.categoriaNombre || 'Sin categoría' }}</p>
                </div>
                <BaseDropdown align="right">
                  <template #trigger>
                    <button class="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                      <MoreHorizontal class="size-4" />
                    </button>
                  </template>
                  <template #content>
                    <button
                      class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50"
                      @click="openEdit(p)"
                    >
                      <Pencil class="size-4" />
                      Editar
                    </button>
                    <button
                      class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50"
                      @click="generateProductPost(p)"
                    >
                      <Megaphone class="size-4" />
                      Generar publicación
                    </button>
                    <button
                      class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
                      @click="confirmDelete(p)"
                    >
                      <Trash2 class="size-4" />
                      Eliminar
                    </button>
                  </template>
                </BaseDropdown>
              </div>

              <div class="mt-3 flex items-baseline gap-2">
                <span class="text-base font-semibold text-slate-900">{{ formatCurrency(p.precio) }}</span>
                <span v-if="p.precioComparacion" class="text-xs text-slate-400 line-through">{{ formatCurrency(p.precioComparacion) }}</span>
              </div>

              <div class="mt-2 flex items-center justify-end">
                <button
                  class="relative h-5 w-9 shrink-0 rounded-full transition-colors"
                  :class="p.activo ? 'bg-brand-600' : 'bg-slate-200'"
                  @click="toggleActive(p)"
                >
                  <span
                    class="absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform"
                    :class="p.activo ? 'translate-x-[18px]' : 'translate-x-0.5'"
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="filtered.length"
          class="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div class="flex items-center gap-2 text-xs text-slate-500">
            <span>Mostrar</span>
            <select
              v-model.number="pageSize"
              class="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-600 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100"
            >
              <option v-for="size in pageSizeOptions" :key="size" :value="size">{{ size }}</option>
            </select>
            <span>por página · {{ filtered.length }} en total</span>
          </div>

          <div v-if="totalPages > 1" class="flex items-center gap-2">
            <button
              class="flex size-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent"
              :disabled="currentPage === 1"
              @click="currentPage--"
            >
              <ChevronLeft class="size-4" />
            </button>
            <span class="text-xs font-medium text-slate-600">Página {{ currentPage }} de {{ totalPages }}</span>
            <button
              class="flex size-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent"
              :disabled="currentPage === totalPages"
              @click="currentPage++"
            >
              <ChevronRight class="size-4" />
            </button>
          </div>
        </div>

        <EmptyState
          v-else
          :icon="LayoutGrid"
          title="No se encontraron productos"
          description="Prueba con otra búsqueda o crea tu primer producto."
        >
          <template #action>
            <BaseButton @click="openCreate">
              <Plus class="size-4" />
              Nuevo producto
            </BaseButton>
          </template>
        </EmptyState>
      </div>
    </BaseCard>

    <!-- Modal producto -->
    <BaseModal v-model="showProductModal" size="lg" :title="editingProduct ? 'Editar producto' : 'Nuevo producto'">
      <form class="flex flex-col gap-4" @submit.prevent="saveProduct">
        <div>
          <label class="mb-1.5 block text-sm font-medium text-slate-700">Foto del producto</label>
          <div class="flex items-center gap-3">
            <label
              class="relative flex size-20 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br text-3xl"
              :class="form.imagenUrl ? 'bg-slate-100' : form.color"
            >
              <img v-if="form.imagenUrl" :src="form.imagenUrl" class="h-full w-full object-cover" alt="" />
              <span v-else>{{ form.emoji }}</span>
              <span
                v-if="uploadingImage"
                class="absolute inset-0 flex items-center justify-center bg-slate-900/50"
              >
                <Loader2 class="size-5 animate-spin text-white" />
              </span>
              <input type="file" accept="image/*" class="hidden" :disabled="uploadingImage" @change="handleImageUpload" />
            </label>

            <div class="flex flex-col gap-1">
              <p class="text-xs text-slate-500">JPG, PNG, WEBP o GIF. Se sube tal cual, sin comprimir.</p>
              <button
                v-if="form.imagenUrl"
                type="button"
                class="flex w-fit items-center gap-1 text-xs font-medium text-rose-600 hover:text-rose-700"
                @click="form.imagenUrl = ''"
              >
                <ImageOff class="size-3.5" />
                Quitar foto
              </button>
            </div>
          </div>

          <p class="mb-1.5 mt-4 text-xs font-medium text-slate-500">
            Sin foto se muestra este ícono en el catálogo:
          </p>
          <div class="flex items-center gap-3">
            <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-xl" :class="form.color">
              {{ form.emoji }}
            </span>
            <input
              v-model="form.emoji"
              maxlength="2"
              class="h-11 w-20 rounded-lg border border-slate-200 bg-white px-2 text-center text-lg focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="c in productColorOptions"
                :key="c"
                type="button"
                class="size-6 rounded-full bg-gradient-to-br"
                :class="[c, form.color === c ? 'ring-2 ring-offset-1 ring-brand-500' : '']"
                @click="form.color = c"
              />
            </div>
          </div>
        </div>

        <BaseInput v-model="form.nombre" label="Nombre del producto" placeholder="Ej. Cartera negra minimalista" required :error="formErrors.nombre" />

        <div>
          <label class="mb-1.5 block text-sm font-medium text-slate-700">Descripción</label>
          <textarea
            v-model="form.descripcion"
            rows="3"
            placeholder="Describe el producto: material, tallas, detalles…"
            class="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <BaseInput v-model="form.precio" type="number" label="Precio" placeholder="0" required :error="formErrors.precio" />
          <BaseInput v-model="form.precioComparacion" type="number" label="Precio anterior (opcional)" placeholder="0" />
        </div>

        <div>
          <label class="mb-1.5 block text-sm font-medium text-slate-700">Categoría</label>
          <select
            v-model="form.categoriaId"
            class="h-11 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          >
            <option :value="null">Sin categoría</option>
            <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.emoji }} {{ c.nombre }}</option>
          </select>
        </div>

        <div>
          <label class="mb-1.5 block text-sm font-medium text-slate-700">Sección del catálogo (opcional)</label>
          <select
            v-model="form.seccionId"
            class="h-11 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          >
            <option :value="null">Sin sección</option>
            <option v-for="s in sections" :key="s.id" :value="s.id">{{ s.nombre }}</option>
          </select>
          <p class="mt-1.5 text-xs text-slate-400">Agrupa este producto en un bloque del catálogo, ej. "Más vendidos".</p>
        </div>

        <label class="flex items-center justify-between rounded-lg border border-slate-200 px-3.5 py-2.5">
          <div>
            <p class="text-sm font-medium text-slate-900">Producto activo</p>
            <p class="text-xs text-slate-400">Visible en el catálogo público</p>
          </div>
          <input v-model="form.activo" type="checkbox" class="size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-400" />
        </label>

        <label class="flex items-center justify-between rounded-lg border border-slate-200 px-3.5 py-2.5">
          <div>
            <p class="text-sm font-medium text-slate-900">Producto destacado</p>
            <p class="text-xs text-slate-400">Aparece en la sección de destacados de tu perfil público</p>
          </div>
          <input v-model="form.destacado" type="checkbox" class="size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-400" />
        </label>

        <div class="mt-2 flex justify-end gap-2">
          <BaseButton type="button" variant="outline" @click="showProductModal = false">Cancelar</BaseButton>
          <BaseButton type="submit" :loading="saving">{{ editingProduct ? 'Guardar cambios' : 'Crear producto' }}</BaseButton>
        </div>
      </form>
    </BaseModal>

    <!-- Modal confirmar eliminación -->
    <BaseModal v-model="showDeleteConfirm" size="sm" title="Eliminar producto">
      <div class="flex items-start gap-3">
        <span class="flex size-10 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-500">
          <AlertTriangle class="size-5" />
        </span>
        <p class="text-sm text-slate-600">
          ¿Seguro que quieres eliminar <span class="font-medium text-slate-900">{{ productToDelete?.nombre }}</span>?
          Esta acción no se puede deshacer.
        </p>
      </div>
      <div class="mt-5 flex justify-end gap-2">
        <BaseButton variant="outline" @click="showDeleteConfirm = false">Cancelar</BaseButton>
        <BaseButton variant="danger" @click="deleteProductConfirmed">Eliminar</BaseButton>
      </div>
    </BaseModal>

    <!-- Modal categorías -->
    <BaseModal v-model="showCategoryModal" title="Categorías" description="Organiza tus productos para que sean más fáciles de encontrar.">
      <div class="flex flex-col gap-2">
        <div
          v-for="c in categories"
          :key="c.id"
          class="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2"
        >
          <span class="flex items-center gap-2 text-sm text-slate-700">
            <span>{{ c.emoji }}</span>
            {{ c.nombre }}
          </span>
          <div class="flex items-center gap-2">
            <BaseBadge size="sm" variant="slate">
              {{ products.filter((p) => p.categoriaId === c.id).length }} productos
            </BaseBadge>
            <button class="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500" @click="removeCategory(c)">
              <Trash2 class="size-4" />
            </button>
          </div>
        </div>
        <EmptyState v-if="!categories.length" :icon="Tags" title="Sin categorías" />
      </div>

      <form class="mt-4 flex items-end gap-2 border-t border-slate-100 pt-4" @submit.prevent="addCategory">
        <div class="w-16 shrink-0">
          <label class="mb-1.5 block text-sm font-medium text-slate-700">Icono</label>
          <input
            v-model="newCategory.emoji"
            maxlength="2"
            class="h-11 w-full rounded-lg border border-slate-200 bg-white px-2 text-center text-lg focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <div class="flex-1">
          <BaseInput v-model="newCategory.nombre" label="Nueva categoría" placeholder="Ej. Bolsos" />
        </div>
        <BaseButton type="submit" size="md">
          <Plus class="size-4" />
        </BaseButton>
      </form>
    </BaseModal>

    <!-- Modal secciones -->
    <BaseModal
      v-model="showSectionModal"
      title="Secciones"
      description="Agrupa productos en bloques con nombre libre, ej. 'Más vendidos' o 'Navidad'. Se muestran en este orden en el catálogo público."
    >
      <div class="flex flex-col gap-2">
        <div
          v-for="(s, index) in sections"
          :key="s.id"
          class="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2"
        >
          <span class="text-sm text-slate-700">{{ s.nombre }}</span>
          <div class="flex items-center gap-1">
            <BaseBadge size="sm" variant="slate">
              {{ products.filter((p) => p.seccionId === s.id).length }} productos
            </BaseBadge>
            <button
              class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-30"
              :disabled="index === 0"
              @click="moveSection(index, -1)"
            >
              <ChevronUp class="size-4" />
            </button>
            <button
              class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-30"
              :disabled="index === sections.length - 1"
              @click="moveSection(index, 1)"
            >
              <ChevronDown class="size-4" />
            </button>
            <button class="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500" @click="removeSection(s)">
              <Trash2 class="size-4" />
            </button>
          </div>
        </div>
        <EmptyState v-if="!sections.length" :icon="Rows3" title="Sin secciones" description="El catálogo se muestra sin agrupar." />
      </div>

      <form class="mt-4 flex items-end gap-2 border-t border-slate-100 pt-4" @submit.prevent="addSection">
        <div class="flex-1">
          <BaseInput v-model="newSection.nombre" label="Nueva sección" placeholder="Ej. Más vendidos" />
        </div>
        <BaseButton type="submit" size="md">
          <Plus class="size-4" />
        </BaseButton>
      </form>
    </BaseModal>

    <GeneratePostModal v-model="showPostModal" :variants="postVariants" />
  </DashboardLayout>
</template>
