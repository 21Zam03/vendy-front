<script setup>
import { ChevronRight, ChevronUp, ChevronDown, Camera, Loader2 } from '@lucide/vue'
import { formatCurrency } from '@/utils/format'

defineProps({
  product: { type: Object, required: true },
  slug: { type: String, required: true },
  editable: { type: Boolean, default: false },
  uploading: { type: Boolean, default: false },
  canMoveUp: { type: Boolean, default: false },
  canMoveDown: { type: Boolean, default: false },
})

const emit = defineEmits(['move', 'upload'])

function onFile(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (file) emit('upload', file)
}
</script>

<template>
  <component
    :is="editable ? 'div' : 'router-link'"
    :to="editable ? undefined : { name: 'storefront-product', params: { slug, id: product.id } }"
    class="flex items-center gap-3 border-b border-slate-100 py-3 transition-colors hover:bg-slate-50"
  >
    <div class="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br text-2xl" :class="product.imagenUrl ? 'bg-slate-100' : product.color">
      <img v-if="product.imagenUrl" :src="product.imagenUrl" class="h-full w-full object-cover" alt="" />
      <template v-else>{{ product.emoji }}</template>

      <label
        v-if="editable"
        class="absolute inset-0 z-10 flex cursor-pointer items-center justify-center bg-slate-900/0 text-white opacity-0 transition-all hover:bg-slate-900/60 hover:opacity-100"
        @click.stop
      >
        <Camera class="size-4" />
        <input type="file" accept="image/*" class="hidden" @change="onFile" />
      </label>
      <div v-if="uploading" class="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/60">
        <Loader2 class="size-4 animate-spin text-white" />
      </div>
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

    <div v-if="editable" class="flex shrink-0 items-center gap-0.5" @click.stop.prevent>
      <button
        type="button"
        class="flex size-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-30"
        :disabled="!canMoveUp"
        @click="emit('move', -1)"
      >
        <ChevronUp class="size-4" />
      </button>
      <button
        type="button"
        class="flex size-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-30"
        :disabled="!canMoveDown"
        @click="emit('move', 1)"
      >
        <ChevronDown class="size-4" />
      </button>
    </div>
    <ChevronRight v-else class="size-4 shrink-0 text-slate-300" />
  </component>
</template>
