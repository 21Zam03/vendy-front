<script setup>
import { ChevronRight } from '@lucide/vue'
import { formatCurrency } from '@/utils/format'

defineProps({
  product: { type: Object, required: true },
  slug: { type: String, required: true },
})
</script>

<template>
  <router-link
    :to="{ name: 'storefront-product', params: { slug, id: product.id } }"
    class="flex items-center gap-3 border-b border-slate-100 py-3 transition-colors hover:bg-slate-50"
  >
    <div class="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br text-2xl" :class="product.imagenUrl ? 'bg-slate-100' : product.color">
      <img v-if="product.imagenUrl" :src="product.imagenUrl" class="h-full w-full object-cover" alt="" />
      <template v-else>{{ product.emoji }}</template>
    </div>

    <div class="min-w-0 flex-1">
      <p class="truncate text-sm font-medium text-slate-900">{{ product.nombre }}</p>
      <div class="mt-0.5 flex items-baseline gap-1.5">
        <span class="text-sm font-semibold text-slate-900">{{ formatCurrency(product.precio) }}</span>
        <span v-if="product.precioComparacion" class="text-xs text-slate-400 line-through">
          {{ formatCurrency(product.precioComparacion) }}
        </span>
      </div>
    </div>

    <ChevronRight class="size-4 shrink-0 text-slate-300" />
  </router-link>
</template>
