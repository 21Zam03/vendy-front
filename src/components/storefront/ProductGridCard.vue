<script setup>
import { formatCurrency } from '@/utils/format'

defineProps({
  product: { type: Object, required: true },
  slug: { type: String, required: true },
})
</script>

<template>
  <router-link
    :to="{ name: 'storefront-product', params: { slug, id: product.id } }"
    class="group flex flex-col overflow-hidden rounded-[var(--vendy-radius,1rem)] border border-slate-200 bg-white transition-shadow hover:shadow-md"
  >
    <div class="relative flex aspect-square items-center justify-center bg-gradient-to-br text-5xl" :class="product.imagenUrl ? 'bg-slate-100' : product.color">
      <img v-if="product.imagenUrl" :src="product.imagenUrl" class="h-full w-full object-cover" alt="" />
      <template v-else>{{ product.emoji }}</template>
      <span
        v-if="product.precioComparacion"
        class="absolute left-2 top-2 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-semibold text-white"
      >
        -{{ Math.round((1 - product.precio / product.precioComparacion) * 100) }}%
      </span>
      <span
        v-if="product.stock === 0"
        class="absolute inset-0 flex items-center justify-center bg-slate-900/50 text-xs font-semibold uppercase tracking-wide text-white"
      >
        Agotado
      </span>
    </div>

    <div class="flex flex-1 flex-col p-3.5">
      <p class="line-clamp-2 text-sm font-medium text-slate-900 group-hover:text-brand-700">{{ product.nombre }}</p>
      <div class="mt-1.5 flex items-baseline gap-1.5">
        <span class="text-sm font-semibold text-slate-900">{{ formatCurrency(product.precio) }}</span>
        <span v-if="product.precioComparacion" class="text-xs text-slate-400 line-through">
          {{ formatCurrency(product.precioComparacion) }}
        </span>
      </div>
      <p
        class="mt-1 text-[11px]"
        :class="product.stock === 0 ? 'text-rose-500' : product.stock <= 5 ? 'text-amber-600' : 'text-emerald-600'"
      >
        {{ product.stock === 0 ? 'Sin stock' : product.stock <= 5 ? `¡Últimas ${product.stock}!` : 'Disponible' }}
      </p>
    </div>
  </router-link>
</template>
