<script setup>
import { computed } from 'vue'
import { colorFor } from '@/data/mock'
import { initials } from '@/utils/format'

const props = defineProps({
  name: { type: String, required: true },
  size: { type: String, default: 'md' }, // xs | sm | md | lg
  online: { type: Boolean, default: undefined },
})

const sizes = {
  xs: 'size-6 text-[10px]',
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-12 text-base',
}

const dotSizes = {
  xs: 'size-1.5',
  sm: 'size-2',
  md: 'size-2.5',
  lg: 'size-3',
}

const bg = computed(() => colorFor(props.name))
</script>

<template>
  <span class="relative inline-flex shrink-0">
    <span
      class="inline-flex items-center justify-center rounded-full font-semibold text-white"
      :class="[sizes[size], bg]"
    >
      {{ initials(name) }}
    </span>
    <span
      v-if="online !== undefined"
      class="absolute right-0 bottom-0 rounded-full ring-2 ring-white"
      :class="[dotSizes[size], online ? 'bg-emerald-500' : 'bg-slate-300']"
    />
  </span>
</template>
