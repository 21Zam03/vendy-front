<script setup>
import { ref, watch } from 'vue'
import { Check, Pencil, X } from '@lucide/vue'

// Título opcional de una sección de Home: el negocio elige si la sección tiene título o
// no (nunca hay un texto por defecto inventado a partir de categorías/productos). En
// modo edición se puede escribir/editar/borrar con el lápiz; en público solo se muestra
// el <h2> si el negocio efectivamente escribió algo.
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
  <div v-if="editable" class="mb-8 flex items-center justify-center gap-2 px-6">
    <template v-if="editing">
      <input
        v-model="draft"
        type="text"
        maxlength="80"
        placeholder="Título de la sección (opcional)"
        class="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-1.5 text-center text-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100"
        @keyup.enter="confirm"
        @keyup.esc="cancel"
      />
      <button type="button" class="flex size-7 shrink-0 items-center justify-center rounded-lg text-emerald-600 hover:bg-emerald-50" @click="confirm">
        <Check class="size-4" />
      </button>
      <button type="button" class="flex size-7 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100" @click="cancel">
        <X class="size-4" />
      </button>
    </template>
    <template v-else>
      <h2 v-if="modelValue" class="text-lg font-semibold uppercase tracking-wide text-slate-900 sm:text-xl">{{ modelValue }}</h2>
      <p v-else class="text-xs text-slate-400">Sin título</p>
      <button type="button" class="flex size-7 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100" @click="startEdit">
        <Pencil class="size-3.5" />
      </button>
    </template>
  </div>
  <h2 v-else-if="modelValue" class="mb-8 px-6 text-center text-lg font-semibold uppercase tracking-wide text-slate-900 sm:text-xl">
    {{ modelValue }}
  </h2>
</template>
