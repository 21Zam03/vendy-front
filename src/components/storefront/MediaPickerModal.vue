<script setup>
import { ImagePlus, Loader2 } from '@lucide/vue'
import BaseModal from '@/components/ui/BaseModal.vue'

// Selector genérico para elegir la foto de un espacio del catálogo (ej. una sección de
// Home de Moda): subir una nueva o elegir una ya guardada en la biblioteca de archivos del
// negocio ("Archivos guardados"). No sabe nada de a qué slot se está asignando la foto —
// eso lo decide quien lo usa, a través de qué evento escucha.
defineProps({
  modelValue: { type: Boolean, default: false },
  archivos: { type: Array, default: () => [] },
  uploading: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'upload', 'select'])

function handleFileInput(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (file) emit('upload', file)
}
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    title="Elegir foto"
    description="Subí una foto nueva o elegí una de tu biblioteca de Archivos guardados."
    size="lg"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <label
      class="mb-4 flex h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 text-center transition-colors hover:border-brand-300 hover:bg-brand-50/40"
    >
      <template v-if="uploading">
        <Loader2 class="size-5 animate-spin text-slate-400" />
        <span class="text-xs text-slate-400">Subiendo…</span>
      </template>
      <template v-else>
        <ImagePlus class="size-5 text-slate-400" />
        <span class="text-xs font-medium text-slate-600">Subir una foto nueva</span>
      </template>
      <input type="file" accept="image/*" class="hidden" :disabled="uploading" @change="handleFileInput" />
    </label>

    <div v-if="archivos.length" class="grid grid-cols-3 gap-3 sm:grid-cols-4">
      <button
        v-for="archivo in archivos"
        :key="archivo.id"
        type="button"
        class="aspect-square overflow-hidden rounded-lg border border-slate-200 transition-shadow hover:shadow-md hover:ring-2 hover:ring-brand-300"
        @click="emit('select', archivo)"
      >
        <img :src="archivo.url" :alt="archivo.nombre || ''" class="h-full w-full object-cover" />
      </button>
    </div>
    <p v-else class="text-center text-xs text-slate-400">Todavía no tienes fotos guardadas — subí una arriba.</p>
  </BaseModal>
</template>
