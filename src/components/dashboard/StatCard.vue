<script setup>
import { computed } from 'vue'
import { ArrowUpRight, ArrowDownRight } from '@lucide/vue'

const props = defineProps({
  label: { type: String, required: true },
  value: { type: String, required: true },
  change: { type: Number, default: null },
  icon: { type: [Object, Function], required: true },
  iconClass: { type: String, default: 'bg-brand-50 text-brand-600' },
})

const isPositive = computed(() => (props.change ?? 0) >= 0)
</script>

<template>
  <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-[var(--shadow-card)] transition-shadow hover:shadow-md">
    <div class="flex items-center justify-between">
      <span class="flex size-10 items-center justify-center rounded-lg" :class="iconClass">
        <component :is="icon" class="size-5" />
      </span>
      <span
        v-if="change !== null"
        class="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium"
        :class="isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'"
      >
        <component :is="isPositive ? ArrowUpRight : ArrowDownRight" class="size-3" />
        {{ Math.abs(change * 100).toFixed(1) }}%
      </span>
    </div>
    <p class="mt-4 text-2xl font-semibold tracking-tight text-slate-900">{{ value }}</p>
    <p class="mt-1 text-sm text-slate-500">{{ label }}</p>
  </div>
</template>
