<script setup>
import { ref } from 'vue'
import { useClickOutside } from '@/composables/useClickOutside'

defineProps({
  align: { type: String, default: 'right' }, // left | right
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
  <div ref="root" class="relative inline-block">
    <div @click="toggle">
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
