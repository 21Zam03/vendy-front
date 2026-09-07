<script setup>
import { Camera, ChevronLeft, ChevronRight, ImagePlus, Loader2, Trash2 } from '@lucide/vue'
import BaseModal from '@/components/ui/BaseModal.vue'

// Reordenar el carrusel de portada de Home: una fila por diapositiva, con flechas para
// cambiar su posición y el ícono de cámara para subir/elegir su foto — todo en un solo
// lugar, en vez de ir moviendo cada diapositiva desde el carrusel mismo.
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  slots: { type: Array, required: true },
  banners: { type: Object, default: () => ({}) },
  uploadingSlots: { type: Object, default: () => new Set() },
})

const emit = defineEmits(['update:modelValue', 'move', 'pick', 'remove'])

function moveLeft(index) {
  if (index === 0) return
  emit('move', { slotA: props.slots[index], slotB: props.slots[index - 1] })
}
function moveRight(index) {
  if (index === props.slots.length - 1) return
  emit('move', { slotA: props.slots[index], slotB: props.slots[index + 1] })
}
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    title="Reordenar carrusel"
    description="Usa las flechas para cambiar el orden de las fotos, o el ícono de cámara para subir/cambiar una."
    size="md"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="flex flex-col gap-2">
      <div v-for="(slot, i) in slots" :key="slot" class="flex items-center gap-3 rounded-xl border border-slate-200 p-2">
        <div class="relative flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
          <img v-if="banners[slot]" :src="banners[slot]" class="h-full w-full object-cover" alt="" />
          <ImagePlus v-else class="size-5 text-slate-300" />
          <div v-if="uploadingSlots.has(slot)" class="absolute inset-0 flex items-center justify-center bg-slate-900/60">
            <Loader2 class="size-4 animate-spin text-white" />
          </div>
        </div>
        <p class="flex-1 text-sm text-slate-500">Diapositiva {{ i + 1 }}</p>
        <button
          type="button"
          class="flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-30"
          :disabled="i === 0"
          @click="moveLeft(i)"
        >
          <ChevronLeft class="size-4" />
        </button>
        <button
          type="button"
          class="flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-30"
          :disabled="i === slots.length - 1"
          @click="moveRight(i)"
        >
          <ChevronRight class="size-4" />
        </button>
        <button
          type="button"
          class="flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
          title="Subir o elegir foto"
          @click="emit('pick', slot)"
        >
          <Camera class="size-4" />
        </button>
        <button
          type="button"
          class="flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500 disabled:opacity-30"
          :disabled="!banners[slot]"
          title="Quitar esta foto"
          @click="emit('remove', slot)"
        >
          <Trash2 class="size-4" />
        </button>
      </div>
    </div>
  </BaseModal>
</template>
