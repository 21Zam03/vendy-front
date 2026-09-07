<script setup>
import { Camera, ChevronUp, ChevronDown, Loader2 } from '@lucide/vue'

defineProps({
  canMoveUp: { type: Boolean, default: false },
  canMoveDown: { type: Boolean, default: false },
  uploading: { type: Boolean, default: false },
  showMove: { type: Boolean, default: true },
})

const emit = defineEmits(['move', 'upload'])

function onFile(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (file) emit('upload', file)
}
</script>

<template>
  <div
    class="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-slate-900/0 opacity-0 transition-all group-hover:bg-slate-900/60 group-hover:opacity-100"
    @click.stop.prevent
  >
    <label class="flex size-8 cursor-pointer items-center justify-center rounded-full bg-white/90 text-slate-700 hover:bg-white">
      <Camera class="size-4" />
      <input type="file" accept="image/*" class="hidden" @change="onFile" />
    </label>
    <template v-if="showMove">
      <button
        type="button"
        class="flex size-8 items-center justify-center rounded-full bg-white/90 text-slate-700 hover:bg-white disabled:opacity-30"
        :disabled="!canMoveUp"
        @click="emit('move', -1)"
      >
        <ChevronUp class="size-4" />
      </button>
      <button
        type="button"
        class="flex size-8 items-center justify-center rounded-full bg-white/90 text-slate-700 hover:bg-white disabled:opacity-30"
        :disabled="!canMoveDown"
        @click="emit('move', 1)"
      >
        <ChevronDown class="size-4" />
      </button>
    </template>
  </div>
  <div v-if="uploading" class="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/60">
    <Loader2 class="size-5 animate-spin text-white" />
  </div>
</template>
