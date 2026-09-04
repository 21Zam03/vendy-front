<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft, Search, LayoutGrid, ChevronLeft, ChevronRight } from '@lucide/vue'
import StorefrontLayout from '@/layouts/StorefrontLayout.vue'
import ProductGridCard from '@/components/storefront/ProductGridCard.vue'
import ProductEditorialCard from '@/components/storefront/ProductEditorialCard.vue'
import ProductListRow from '@/components/storefront/ProductListRow.vue'
import CollectionThemeBanner from '@/components/storefront/CollectionThemeBanner.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { getPerfilPublico, getColeccionPublico, getSeccionesPublico } from '@/api/tienda'
import { accentClasses, isThemedCover } from '@/utils/theme'
import { setPageMeta } from '@/utils/head'
import { groupBySections } from '@/utils/sections'

const route = useRoute()
const business = ref(null)
const collection = ref(null)
const secciones = ref([])
const loading = ref(true)
const notFound = ref(false)

async function load() {
  loading.value = true
  notFound.value = false
  try {
    const [perfil, coleccion, secc] = await Promise.all([
      getPerfilPublico(route.params.slug),
      getColeccionPublico(route.params.slug, route.params.collectionSlug),
      getSeccionesPublico(route.params.slug).catch(() => []),
    ])
    business.value = perfil
    collection.value = coleccion
    secciones.value = secc
    setPageMeta({ title: `${coleccion.name} · ${perfil.name}`, description: perfil.description })
  } catch {
    notFound.value = true
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(() => [route.params.slug, route.params.collectionSlug], load)

const accent = computed(() => (collection.value ? accentClasses(collection.value.appearance.accentColor) : null))
const isThemedCollection = computed(() => isThemedCover(collection.value?.appearance.cover))
const layout = computed(() => collection.value?.appearance.catalogLayout ?? 'grid')
const isPro = computed(() => layout.value === 'pro')
const cardComponent = computed(
  () => ({ grid: ProductGridCard, pro: ProductEditorialCard, list: ProductListRow })[layout.value] ?? ProductGridCard,
)

const search = ref('')
const categoryFilter = ref('all')

const categoryOptions = computed(() => [{ id: 'all', nombre: 'Todas' }, ...(collection.value?.categorias ?? [])])

const filtered = computed(() =>
  (collection.value?.productos ?? [])
    .filter((p) => categoryFilter.value === 'all' || p.categoriaId === categoryFilter.value)
    .filter((p) => p.nombre.toLowerCase().includes(search.value.toLowerCase())),
)

// Paginación del catálogo público
const pageSizeOptions = [8, 12, 24]
const pageSize = ref(12)
const currentPage = ref(1)

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize.value)))
const paginated = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filtered.value.slice(start, start + pageSize.value)
})

watch([search, categoryFilter, pageSize], () => {
  currentPage.value = 1
})

watch(totalPages, (pages) => {
  if (currentPage.value > pages) currentPage.value = pages
})

// Paginación solo aplica al layout Clásico (grid); PRO y Lista muestran todo el catálogo.
const groups = computed(() => groupBySections(layout.value === 'grid' ? paginated.value : filtered.value, secciones.value))
</script>

<template>
  <StorefrontLayout :appearance="collection?.appearance">
    <div v-if="loading" class="flex min-h-[60vh] items-center justify-center text-sm text-slate-400">
      Cargando…
    </div>

    <EmptyState
      v-else-if="notFound"
      :icon="LayoutGrid"
      title="No encontramos esta colección"
      description="El enlace puede estar mal escrito o la colección ya no está disponible."
      class="min-h-[60vh]"
    />

    <!-- Template PRO: sin barra fija, tipografía minimalista, fotos grandes -->
    <template v-else-if="isPro">
      <div class="mx-auto max-w-[1600px] px-6 pb-16 pt-8 sm:px-10 sm:pt-12 lg:px-16">
        <router-link
          :to="{ name: 'storefront-profile', params: { slug: route.params.slug } }"
          class="inline-flex items-center gap-1.5 text-xs text-slate-400 transition-colors hover:text-slate-700"
        >
          <ArrowLeft class="size-3.5" />
          Volver
        </router-link>

        <CollectionThemeBanner v-if="isThemedCollection" :collection="collection" class="mt-6 rounded-2xl" />
        <template v-else>
          <h1 class="mt-6 text-center text-sm font-semibold uppercase tracking-[0.2em] text-slate-900">
            {{ collection.name }}
          </h1>
          <p class="mt-1 text-center text-[11px] uppercase tracking-widest text-slate-400">{{ business.name }}</p>
        </template>

        <nav v-if="categoryOptions.length > 1" class="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          <button
            v-for="c in categoryOptions"
            :key="c.id"
            class="text-[11px] font-medium uppercase tracking-wider transition-colors"
            :class="
              categoryFilter === c.id
                ? 'text-slate-900 underline underline-offset-4'
                : 'text-slate-400 hover:text-slate-600'
            "
            @click="categoryFilter = c.id"
          >
            {{ c.nombre }}
          </button>
        </nav>

        <div class="mt-12 h-px w-full bg-slate-100" />

        <div v-if="groups.length" class="mt-10 flex flex-col gap-16">
          <div v-for="g in groups" :key="g.id ?? 'sin-seccion'">
            <h2 v-if="g.nombre" class="mb-6 text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
              {{ g.nombre }}
            </h2>
            <div class="grid grid-cols-2 gap-x-6 gap-y-14 md:grid-cols-3 xl:grid-cols-4">
              <ProductEditorialCard v-for="p in g.productos" :key="p.id" :product="p" :slug="route.params.slug" />
            </div>
          </div>
        </div>
        <EmptyState
          v-else
          :icon="LayoutGrid"
          title="No encontramos productos"
          description="Prueba con otra búsqueda o categoría."
          class="mt-10"
        />
      </div>
    </template>

    <!-- Templates Clásico / Lista: barra superior fija con búsqueda y categorías -->
    <template v-else>
      <CollectionThemeBanner v-if="isThemedCollection" :collection="collection" />

      <div class="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div class="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <router-link
            :to="{ name: 'storefront-profile', params: { slug: route.params.slug } }"
            class="flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
          >
            <ArrowLeft class="size-5" />
          </router-link>
          <span class="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg text-xs font-semibold text-white" :class="accent.solid">
            <img v-if="business.logoUrl" :src="business.logoUrl" class="h-full w-full object-cover" alt="" />
            <template v-else>{{ business.logoInitials }}</template>
          </span>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-semibold text-slate-900">{{ collection.name }}</p>
            <p class="truncate text-xs text-slate-400">{{ business.name }}</p>
          </div>
        </div>
      </div>

      <div class="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div class="relative mb-4">
          <Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            v-model="search"
            type="text"
            placeholder="Buscar productos…"
            class="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>

        <div class="mb-6 flex flex-wrap gap-1.5">
          <button
            v-for="c in categoryOptions"
            :key="c.id"
            class="rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
            :class="categoryFilter === c.id ? `${accent.solid} text-white` : 'bg-slate-100 text-slate-500 hover:bg-slate-200'"
            @click="categoryFilter = c.id"
          >
            {{ c.emoji ? c.emoji + ' ' : '' }}{{ c.nombre }}
          </button>
        </div>

        <div v-if="groups.length" class="flex flex-col gap-10">
          <div v-for="g in groups" :key="g.id ?? 'sin-seccion'">
            <h2 v-if="g.nombre" class="mb-3 text-sm font-semibold text-slate-900">{{ g.nombre }}</h2>
            <div v-if="layout === 'list'" class="flex flex-col">
              <component :is="cardComponent" v-for="p in g.productos" :key="p.id" :product="p" :slug="route.params.slug" />
            </div>
            <div v-else class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              <component :is="cardComponent" v-for="p in g.productos" :key="p.id" :product="p" :slug="route.params.slug" />
            </div>
          </div>
        </div>
        <EmptyState
          v-else
          :icon="LayoutGrid"
          title="No encontramos productos"
          description="Prueba con otra búsqueda o categoría."
        />

        <div v-if="filtered.length && layout === 'grid'" class="mt-8 flex flex-col items-center gap-3 border-t border-slate-100 pt-6">
          <div v-if="totalPages > 1" class="flex items-center gap-3">
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
          <div class="flex items-center gap-2 text-xs text-slate-400">
            <span>Mostrar</span>
            <select
              v-model.number="pageSize"
              class="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-600 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100"
            >
              <option v-for="size in pageSizeOptions" :key="size" :value="size">{{ size }}</option>
            </select>
            <span>por página · {{ filtered.length }} en total</span>
          </div>
        </div>
      </div>
    </template>
  </StorefrontLayout>
</template>
