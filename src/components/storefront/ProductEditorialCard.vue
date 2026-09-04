<script setup>
import { formatCurrency } from '@/utils/format'

defineProps({
  product: { type: Object, required: true },
  slug: { type: String, required: true },
})
</script>

<template>
  <router-link :to="{ name: 'storefront-product', params: { slug, id: product.id } }" class="group flex flex-col">
    <div class="relative flex aspect-[3/4] items-center justify-center overflow-hidden bg-gradient-to-br text-7xl transition-opacity group-hover:opacity-90 sm:text-8xl xl:text-9xl" :class="product.imagenUrl ? 'bg-slate-100' : product.color">
      <img v-if="product.imagenUrl" :src="product.imagenUrl" class="h-full w-full object-cover" alt="" />
      <template v-else>{{ product.emoji }}</template>
    </div>

    <div class="mt-3 flex flex-col gap-0.5">
      <p class="line-clamp-1 text-xs font-medium uppercase tracking-wide text-slate-800">{{ product.nombre }}</p>
      <div class="flex items-baseline gap-2">
        <span class="text-xs text-slate-600">{{ formatCurrency(product.precio) }}</span>
        <span v-if="product.precioComparacion" class="text-xs text-slate-400 line-through">
          {{ formatCurrency(product.precioComparacion) }}
        </span>
      </div>
    </div>
  </router-link>
</template>
