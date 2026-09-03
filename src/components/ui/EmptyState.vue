<script setup>
import { Inbox } from '@lucide/vue'

defineProps({
  icon: { type: [Object, Function], default: () => Inbox },
  title: { type: String, required: true },
  description: { type: String, default: '' },
})
</script>

<template>
  <div class="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 px-6 py-14 text-center">
    <div class="mb-4 flex size-12 items-center justify-center rounded-full bg-slate-100">
      <component :is="icon" class="size-6 text-slate-400" />
    </div>
    <p class="text-sm font-medium text-slate-900">{{ title }}</p>
    <p v-if="description" class="mt-1 max-w-xs text-sm text-slate-500">{{ description }}</p>
    <div v-if="$slots.action" class="mt-4">
      <slot name="action" />
    </div>
  </div>
</template>
