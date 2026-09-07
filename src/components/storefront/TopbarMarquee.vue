<script setup>
import { ref, watch } from 'vue'
import { Check, Pencil, X } from '@lucide/vue'

// Franja negra arriba del navbar con un mensaje en movimiento infinito (tipo ticker) —
// el negocio elige el texto (o ninguno); nunca hay un mensaje por defecto inventado. El
// texto se repite varias veces dentro de dos bloques idénticos que se turnan animando
// -50%, así el loop es perfecto sin importar qué tan largo sea el mensaje o la pantalla.
const props = defineProps({
  modelValue: { type: String, default: '' },
  editable: { type: Boolean, default: false },
})

const emit = defineEmits(['save', 'clear'])

const editing = ref(false)
const draft = ref(props.modelValue)

watch(
  () => props.modelValue,
  (value) => {
    if (!editing.value) draft.value = value
  },
)

function startEdit() {
  draft.value = props.modelValue
  editing.value = true
}
function confirm() {
  const trimmed = draft.value.trim()
  editing.value = false
  if (trimmed === props.modelValue) return
  if (trimmed) emit('save', trimmed)
  else emit('clear')
}
function cancel() {
  draft.value = props.modelValue
  editing.value = false
}
</script>

<template>
  <div v-if="modelValue || editable" class="relative overflow-hidden bg-slate-950">
    <template v-if="editing">
      <div class="flex items-center gap-2 px-4 py-2">
        <input
          v-model="draft"
          type="text"
          maxlength="140"
          placeholder="Mensaje para esta franja (ej. Envíos gratis desde S/100)"
          class="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white placeholder:text-slate-400 focus:border-white focus:outline-none"
          @keyup.enter="confirm"
          @keyup.esc="cancel"
        />
        <button type="button" class="flex size-7 shrink-0 items-center justify-center rounded-lg text-emerald-400 hover:bg-white/10" @click="confirm">
          <Check class="size-4" />
        </button>
        <button type="button" class="flex size-7 shrink-0 items-center justify-center rounded-lg text-slate-300 hover:bg-white/10" @click="cancel">
          <X class="size-4" />
        </button>
      </div>
    </template>

    <template v-else-if="modelValue">
      <div class="marquee-track flex py-2">
        <div class="flex shrink-0 items-center">
          <span v-for="i in 6" :key="`a-${i}`" class="mx-6 shrink-0 whitespace-nowrap text-xs font-semibold uppercase tracking-[0.2em] text-white">
            {{ modelValue }}
          </span>
        </div>
        <div class="flex shrink-0 items-center" aria-hidden="true">
          <span v-for="i in 6" :key="`b-${i}`" class="mx-6 shrink-0 whitespace-nowrap text-xs font-semibold uppercase tracking-[0.2em] text-white">
            {{ modelValue }}
          </span>
        </div>
      </div>
      <button
        v-if="editable"
        type="button"
        class="absolute right-3 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-lg bg-white/10 text-white backdrop-blur hover:bg-white/20"
        @click="startEdit"
      >
        <Pencil class="size-3.5" />
      </button>
    </template>

    <template v-else>
      <button
        type="button"
        class="flex w-full items-center justify-center gap-1.5 px-4 py-1.5 text-xs text-slate-400 transition-colors hover:text-white"
        @click="startEdit"
      >
        <Pencil class="size-3" />
        Agregar mensaje para esta franja
      </button>
    </template>
  </div>
</template>

<style scoped>
.marquee-track {
  width: max-content;
  animation: marquee 22s linear infinite;
}

@keyframes marquee {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}
</style>
