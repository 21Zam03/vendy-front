<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: { type: String, default: 'slate' }, // slate | brand | green | amber | red | blue | violet
  size: { type: String, default: 'md' }, // sm | md
  dot: { type: Boolean, default: false },
})

const variants = {
  slate: 'bg-slate-100 text-slate-600',
  brand: 'bg-brand-50 text-brand-700',
  green: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700',
  red: 'bg-rose-50 text-rose-700',
  blue: 'bg-sky-50 text-sky-700',
  violet: 'bg-violet-50 text-violet-700',
}

const dotColors = {
  slate: 'bg-slate-400',
  brand: 'bg-brand-500',
  green: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-rose-500',
  blue: 'bg-sky-500',
  violet: 'bg-violet-500',
}

const sizes = {
  sm: 'h-5 px-1.5 text-[11px] gap-1',
  md: 'h-6 px-2 text-xs gap-1.5',
}

const classes = computed(() => [
  'inline-flex items-center rounded-full font-medium whitespace-nowrap',
  variants[props.variant],
  sizes[props.size],
])
</script>

<template>
  <span :class="classes">
    <span v-if="dot" class="size-1.5 rounded-full" :class="dotColors[variant]" />
    <slot />
  </span>
</template>
