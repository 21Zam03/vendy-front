<script setup>
import { ref } from 'vue'
import { useClickOutside } from '@/composables/useClickOutside'

defineProps({
  align: { type: String, default: 'right' }, // left | right
  // "inline-block" (default) se achica al contenido del trigger — sirve para triggers
  // chicos (íconos). Cuando el trigger necesita ocupar todo el ancho del contenedor (ej.
  // el usuario abajo del sidebar, que trunca un nombre largo), hace falta "block w-full":
  // con inline-block, un hijo con w-full queda circular y termina sin truncar, empujando
  // el ancho real del contenido hacia afuera.
  fullWidth: { type: Boolean, default: false },
})

const open = ref(false)
const root = ref(null)

useClickOutside(root, () => (open.value = false))

function toggle() {
  open.value = !open.value
}

function close() {
  open.value = false
}

defineExpose({ close })
</script>

<template>
  <div ref="root" class="relative" :class="fullWidth ? 'block w-full' : 'inline-block'">
    <div :class="{ 'w-full': fullWidth }" @click="toggle">
      <slot name="trigger" :open="open" />
    </div>
    <Transition
      enter-active-class="animate-scale-in"
      leave-active-class="transition-opacity duration-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="absolute z-40 mt-2 min-w-[12rem] origin-top-right rounded-xl border border-slate-200 bg-white p-1.5 shadow-[var(--shadow-popover)]"
        :class="align === 'right' ? 'right-0' : 'left-0'"
        @click="close"
      >
        <slot name="content" />
      </div>
    </Transition>
  </div>
</template>
