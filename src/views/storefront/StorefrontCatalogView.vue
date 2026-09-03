<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft, Search, LayoutGrid } from '@lucide/vue'
import StorefrontLayout from '@/layouts/StorefrontLayout.vue'
import ProductGridCard from '@/components/storefront/ProductGridCard.vue'
import ProductEditorialCard from '@/components/storefront/ProductEditorialCard.vue'
import ProductListRow from '@/components/storefront/ProductListRow.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { getPerfilPublico, getCatalogoPublico, getSeccionesPublico } from '@/api/tienda'
import { accentClasses } from '@/utils/theme'
import { setPageMeta } from '@/utils/head'
import { groupBySections } from '@/utils/sections'

const route = useRoute()
const business = ref(null)
const categorias = ref([])
const productos = ref([])
const secciones = ref([])
const loading = ref(true)
const notFound = ref(false)

async function load() {
  loading.value = true
  notFound.value = false
  try {
    const [perfil, catalogo, secc] = await Promise.all([
      getPerfilPublico(route.params.slug),
      getCatalogoPublico(route.params.slug),
      getSeccionesPublico(route.params.slug).catch(() => []),
    ])
    business.value = perfil
    categorias.value = catalogo.categorias
    productos.value = catalogo.productos
    secciones.value = secc
    setPageMeta({ title: `Catálogo · ${perfil.name}`, description: perfil.description })
  } catch {
    notFound.value = true
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(() => route.params.slug, load)

const accent = computed(() => (business.value ? accentClasses(business.value.appearance.accentColor) : null))
const layout = computed(() => business.value?.appearance.catalogLayout ?? 'grid')
const isPro = computed(() => layout.value === 'pro')
const cardComponent = computed(
  () => ({ grid: ProductGridCard, pro: ProductEditorialCard, list: ProductListRow })[layout.value] ?? ProductGridCard,
)

const search = ref('')
const categoryFilter = ref('all')

const categoryOptions = computed(() => [{ id: 'all', nombre: 'Todas' }, ...categorias.value])

const filtered = computed(() =>
  productos.value
    .filter((p) => categoryFilter.value === 'all' || p.categoriaId === categoryFilter.value)
    .filter((p) => p.nombre.toLowerCase().includes(search.value.toLowerCase())),
)

const groups = computed(() => groupBySections(filtered.value, secciones.value))
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

        <h1 class="mt-6 text-center text-sm font-semibold uppercase tracking-[0.2em] text-slate-900">
          {{ business.name }}
        </h1>

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
            <p class="truncate text-sm font-semibold text-slate-900">{{ business.name }}</p>
            <p class="truncate text-xs text-slate-400">Catálogo</p>
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
      </div>
    </template>
  </StorefrontLayout>
</template>
