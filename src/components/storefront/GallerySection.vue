<script setup>
// Galería simple reusando fotos de productos ya cargados (no hay álbum de fotos
// independiente todavía) — pensada para Belleza/Barbería, donde ayuda mostrar
// ambiente/trabajos realizados aunque no haya "productos" tradicionales.
defineProps({
  products: { type: Array, required: true }, // ya filtrados: solo con imagenUrl
  slug: { type: String, required: true },
})
</script>

<template>
  <div v-if="products.length" class="mx-auto mt-8 w-full max-w-sm px-4 sm:px-6">
    <p class="mb-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">Galería</p>
    <div class="grid grid-cols-3 gap-2">
      <router-link
        v-for="p in products"
        :key="p.id"
        :to="{ name: 'storefront-product', params: { slug, id: p.id } }"
        class="aspect-square overflow-hidden rounded-[var(--vendy-radius,0.75rem)] bg-slate-100"
      >
        <img :src="p.imagenUrl" class="h-full w-full object-cover transition-transform hover:scale-105" alt="" />
      </router-link>
    </div>
  </div>
</template>
