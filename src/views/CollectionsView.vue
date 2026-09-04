<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  Plus,
  Layers,
  MoreHorizontal,
  Pencil,
  Trash2,
  ExternalLink,
  AlertTriangle,
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
import {
  accentColors,
  backgroundOptions,
  fontOptions,
  radiusOptions,
  coverOptions,
  seasonalCoverOptions,
  catalogLayoutOptions,
} from '@/data/mock'
import { useBusiness } from '@/composables/useBusiness'
import { listCatalogos, createCatalogo, updateCatalogo, deleteCatalogo } from '@/api/catalogos'
import { listProductos } from '@/api/productos'
import { ApiError } from '@/api/http'
import { coverClasses } from '@/utils/theme'
import ThemedCoverPattern from '@/components/ui/ThemedCoverPattern.vue'
import { slugify, formatCurrency } from '@/utils/format'
import { useToast } from '@/composables/useToast'

const { success, error: toastError } = useToast()
const { business } = useBusiness()

const loading = ref(true)
const noNegocio = ref(false)
const collections = ref([])
const products = ref([])

async function loadAll() {
  loading.value = true
  noNegocio.value = false
  try {
    const [cats, prods] = await Promise.all([listCatalogos(), listProductos()])
    collections.value = cats
    products.value = prods
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      noNegocio.value = true
    } else {
      toastError('No se pudieron cargar tus colecciones', { description: err.message })
    }
  } finally {
    loading.value = false
  }
}

onMounted(loadAll)

const showModal = ref(false)
const showDeleteConfirm = ref(false)
const editing = ref(null)
const toDelete = ref(null)
const saving = ref(false)
const formErrors = ref({})

const emptyForm = () => ({
  nombre: '',
  slug: '',
  activo: true,
  accentColor: 'brand',
  background: 'white',
  font: 'sans',
  radius: 'soft',
  cover: 'gradient',
  catalogLayout: 'grid',
  productoIds: [],
})
const form = ref(emptyForm())

function openCreate() {
  editing.value = null
  form.value = emptyForm()
  formErrors.value = {}
  showModal.value = true
}

function openEdit(collection) {
  editing.value = collection
  form.value = {
    nombre: collection.nombre,
    slug: collection.slug,
    activo: collection.activo,
    accentColor: collection.accentColor,
    background: collection.background,
    font: collection.font,
    radius: collection.radius,
    cover: collection.cover,
    catalogLayout: collection.catalogLayout,
    productoIds: collection.productos.map((p) => p.id),
  }
  formErrors.value = {}
  showModal.value = true
}

function generateSlug() {
  form.value.slug = slugify(form.value.nombre)
}

function toggleProduct(id) {
  const index = form.value.productoIds.indexOf(id)
  if (index === -1) form.value.productoIds.push(id)
  else form.value.productoIds.splice(index, 1)
}

async function save() {
  if (!form.value.nombre || !form.value.slug) return
  saving.value = true
  formErrors.value = {}
  try {
    if (editing.value) {
      const updated = await updateCatalogo(editing.value.id, form.value)
      const index = collections.value.findIndex((c) => c.id === editing.value.id)
      collections.value[index] = updated
      success('Colección actualizada', { description: updated.nombre })
    } else {
      const created = await createCatalogo(form.value)
      collections.value.unshift(created)
      success('Colección creada', { description: `${created.nombre} ya está lista` })
    }
    showModal.value = false
  } catch (err) {
    if (err instanceof ApiError && err.status === 400 && err.data) {
      formErrors.value = err.data
    } else if (err instanceof ApiError && err.status === 409) {
      formErrors.value = { slug: err.message }
    } else {
      toastError('No se pudo guardar la colección', { description: err.message })
    }
  } finally {
    saving.value = false
  }
}

function confirmDelete(collection) {
  toDelete.value = collection
  showDeleteConfirm.value = true
}

async function deleteConfirmed() {
  try {
    await deleteCatalogo(toDelete.value.id)
    collections.value = collections.value.filter((c) => c.id !== toDelete.value.id)
    success('Colección eliminada', { description: toDelete.value.nombre })
  } catch (err) {
    toastError('No se pudo eliminar la colección', { description: err.message })
  } finally {
    showDeleteConfirm.value = false
    toDelete.value = null
  }
}

const previewCover = computed(() => coverClasses(form.value.accentColor, form.value.cover))
</script>

<template>
  <DashboardLayout>
    <PageHeader
      title="Colecciones"
      description="Catálogos temáticos con su propio estilo y enlace: Navidad, Halloween, temporada de verano…"
    >
      <template #action>
        <BaseButton @click="openCreate">
          <Plus class="size-4" />
          Nueva colección
        </BaseButton>
      </template>
    </PageHeader>

    <EmptyState
      v-if="!loading && noNegocio"
      :icon="Layers"
      title="Todavía no configuraste tu negocio"
      description="Antes de crear colecciones, completa el perfil de tu negocio."
    >
      <template #action>
        <router-link :to="{ name: 'business-profile' }">
          <BaseButton>Configurar mi negocio</BaseButton>
        </router-link>
      </template>
    </EmptyState>

    <template v-else-if="loading">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="i in 3" :key="i" class="rounded-xl border border-slate-200 p-4">
          <Skeleton class="h-16 w-full" />
          <Skeleton class="mt-3 h-4 w-2/3" />
          <Skeleton class="mt-2 h-3 w-1/3" />
        </div>
      </div>
    </template>

    <div v-else-if="collections.length" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <BaseCard v-for="c in collections" :key="c.id" :padded="false" class="overflow-hidden">
        <div class="relative h-16" :class="coverClasses(c.accentColor, c.cover)">
          <ThemedCoverPattern :cover="c.cover" />
        </div>
        <div class="p-4">
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <p class="truncate text-sm font-semibold text-slate-900">{{ c.nombre }}</p>
              <p class="truncate text-xs text-slate-400">/tienda/{{ business.slug }}/c/{{ c.slug }}</p>
            </div>
            <BaseDropdown align="right">
              <template #trigger>
                <button class="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                  <MoreHorizontal class="size-4" />
                </button>
              </template>
              <template #content>
                <a
                  v-if="business.slug"
                  :href="`/tienda/${business.slug}/c/${c.slug}`"
                  target="_blank"
                  rel="noopener"
                  class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50"
                >
                  <ExternalLink class="size-4" />
                  Ver colección
                </a>
                <button
                  class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50"
                  @click="openEdit(c)"
                >
                  <Pencil class="size-4" />
                  Editar
                </button>
                <button
                  class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
                  @click="confirmDelete(c)"
                >
                  <Trash2 class="size-4" />
                  Eliminar
                </button>
              </template>
            </BaseDropdown>
          </div>

          <div class="mt-3 flex items-center gap-2">
            <BaseBadge size="sm" :variant="c.activo ? 'whatsapp' : 'slate'">
              {{ c.activo ? 'Activa' : 'Oculta' }}
            </BaseBadge>
            <BaseBadge size="sm" variant="slate">{{ c.productos.length }} productos</BaseBadge>
          </div>
        </div>
      </BaseCard>
    </div>

    <EmptyState
      v-else
      :icon="Layers"
      title="Todavía no tienes colecciones"
      description="Crea una para agrupar productos de una campaña o temporada con su propio estilo."
    >
      <template #action>
        <BaseButton @click="openCreate">
          <Plus class="size-4" />
          Nueva colección
        </BaseButton>
      </template>
    </EmptyState>

    <BaseModal v-model="showModal" size="lg" :title="editing ? 'Editar colección' : 'Nueva colección'">
      <form class="flex flex-col gap-4" @submit.prevent="save">
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <BaseInput v-model="form.nombre" label="Nombre" placeholder="Ej. Catálogo de Navidad" :error="formErrors.nombre" />
          <div>
            <label class="mb-1.5 block text-sm font-medium text-slate-700">Enlace</label>
            <div class="flex gap-2">
              <input
                v-model="form.slug"
                class="h-11 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                placeholder="navidad"
              />
              <BaseButton type="button" variant="outline" @click="generateSlug">Generar</BaseButton>
            </div>
            <p v-if="formErrors.slug" class="mt-1.5 text-xs text-rose-600">{{ formErrors.slug }}</p>
          </div>
        </div>

        <label class="flex items-center justify-between rounded-lg border border-slate-200 px-3.5 py-2.5">
          <div>
            <p class="text-sm font-medium text-slate-900">Colección visible</p>
            <p class="text-xs text-slate-400">Si la desactivas, el enlace deja de funcionar</p>
          </div>
          <input v-model="form.activo" type="checkbox" class="size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-400" />
        </label>

        <div>
          <p class="mb-2 text-sm font-medium text-slate-700">Estilo de esta colección</p>
          <div class="relative h-10 w-full rounded-lg" :class="previewCover">
            <ThemedCoverPattern :cover="form.cover" />
          </div>
          <div class="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            <div>
              <label class="mb-1 block text-xs text-slate-500">Color de acento</label>
              <select v-model="form.accentColor" class="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100">
                <option v-for="a in accentColors" :key="a.key" :value="a.key">{{ a.label }}</option>
              </select>
            </div>
            <div>
              <label class="mb-1 block text-xs text-slate-500">Fondo</label>
              <select v-model="form.background" class="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100">
                <option v-for="b in backgroundOptions" :key="b.key" :value="b.key">{{ b.label }}</option>
              </select>
            </div>
            <div>
              <label class="mb-1 block text-xs text-slate-500">Letra</label>
              <select v-model="form.font" class="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100">
                <option v-for="f in fontOptions" :key="f.key" :value="f.key">{{ f.label }}</option>
              </select>
            </div>
            <div>
              <label class="mb-1 block text-xs text-slate-500">Bordes</label>
              <select v-model="form.radius" class="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100">
                <option v-for="r in radiusOptions" :key="r.key" :value="r.key">{{ r.label }}</option>
              </select>
            </div>
            <div>
              <label class="mb-1 block text-xs text-slate-500">Portada</label>
              <select v-model="form.cover" class="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100">
                <optgroup label="Colores">
                  <option v-for="c in coverOptions" :key="c.key" :value="c.key">{{ c.label }}</option>
                </optgroup>
                <optgroup label="Temporada">
                  <option v-for="c in seasonalCoverOptions" :key="c.key" :value="c.key">{{ c.emoji }} {{ c.label }}</option>
                </optgroup>
              </select>
            </div>
            <div>
              <label class="mb-1 block text-xs text-slate-500">Estructura</label>
              <select v-model="form.catalogLayout" class="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100">
                <option v-for="t in catalogLayoutOptions" :key="t.key" :value="t.key">{{ t.label }}</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <p class="mb-2 text-sm font-medium text-slate-700">
            Productos en esta colección
            <span class="font-normal text-slate-400">({{ form.productoIds.length }} seleccionados)</span>
          </p>
          <div class="max-h-56 overflow-y-auto rounded-lg border border-slate-200">
            <label
              v-for="p in products"
              :key="p.id"
              class="flex cursor-pointer items-center gap-2.5 border-b border-slate-100 px-3 py-2 last:border-b-0 hover:bg-slate-50"
            >
              <input
                type="checkbox"
                :checked="form.productoIds.includes(p.id)"
                class="size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-400"
                @change="toggleProduct(p.id)"
              />
              <span class="flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-md bg-gradient-to-br text-sm" :class="p.imagenUrl ? 'bg-slate-100' : p.color">
                <img v-if="p.imagenUrl" :src="p.imagenUrl" class="h-full w-full object-cover" alt="" />
                <template v-else>{{ p.emoji }}</template>
              </span>
              <span class="min-w-0 flex-1 truncate text-sm text-slate-700">{{ p.nombre }}</span>
              <span class="shrink-0 text-xs text-slate-400">{{ formatCurrency(p.precio) }}</span>
            </label>
            <p v-if="!products.length" class="px-3 py-4 text-center text-sm text-slate-400">
              Primero agrega productos en Catálogo.
            </p>
          </div>
        </div>

        <div class="mt-2 flex justify-end gap-2">
          <BaseButton type="button" variant="outline" @click="showModal = false">Cancelar</BaseButton>
          <BaseButton type="submit" :loading="saving">{{ editing ? 'Guardar cambios' : 'Crear colección' }}</BaseButton>
        </div>
      </form>
    </BaseModal>

    <BaseModal v-model="showDeleteConfirm" size="sm" title="Eliminar colección">
      <div class="flex items-start gap-3">
        <span class="flex size-10 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-500">
          <AlertTriangle class="size-5" />
        </span>
        <p class="text-sm text-slate-600">
          ¿Seguro que quieres eliminar <span class="font-medium text-slate-900">{{ toDelete?.nombre }}</span>?
          Los productos no se eliminan, solo dejan de estar agrupados aquí.
        </p>
      </div>
      <div class="mt-5 flex justify-end gap-2">
        <BaseButton variant="outline" @click="showDeleteConfirm = false">Cancelar</BaseButton>
        <BaseButton variant="danger" @click="deleteConfirmed">Eliminar</BaseButton>
      </div>
    </BaseModal>
  </DashboardLayout>
</template>
