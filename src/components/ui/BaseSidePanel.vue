<script setup>
import { X } from '@lucide/vue'

// Variante de BaseModal en forma de panel flotante (no un modal que oscurece/difumina el
// fondo): aparece como una tarjeta suelta pegada a la derecha, con el resto de la pantalla
// (ej. el perfil público en vivo de BusinessAppearanceView) siempre visible y sin filtros
// detrás — pensado para editar algo mientras se sigue viendo el resultado, no para
// interrumpir con una decisión puntual como BaseModal. Cerrar haciendo clic afuera sigue
// funcionando (capa invisible detrás), solo que no se ve nada oscurecido.
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  size: { type: String, default: 'md' }, // md | lg
})

const emit = defineEmits(['update:modelValue'])

const sizes = {
  md: 'max-w-md',
  lg: 'max-w-xl',
}

function close() {
  emit('update:modelValue', false)
}
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-40" @click="close" />
    <Transition
      appear
      enter-active-class="transition-all duration-250 ease-out"
      enter-from-class="translate-x-4 opacity-0"
      leave-active-class="transition-all duration-150 ease-in"
      leave-to-class="translate-x-4 opacity-0"
    >
      <div
        v-if="modelValue"
        class="fixed inset-y-4 right-4 z-50 flex w-[calc(100%-2rem)] flex-col rounded-2xl bg-white shadow-[var(--shadow-popover)] ring-1 ring-slate-900/5"
        :class="sizes[size]"
        @click.stop
      >
        <div class="flex items-start justify-between gap-4 border-b border-slate-100 p-6">
          <div class="min-w-0">
            <h2 v-if="title" class="text-lg font-semibold text-slate-900">{{ title }}</h2>
            <p v-if="description" class="mt-1 text-sm text-slate-500">{{ description }}</p>
          </div>
          <button
            type="button"
            class="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            @click="close"
          >
            <X class="size-4" />
          </button>
        </div>
        <div class="flex-1 overflow-y-auto p-6">
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
