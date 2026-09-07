<script setup>
import { Clock, MapPin } from '@lucide/vue'

defineProps({
  schedule: { type: String, default: '' },
  location: { type: String, default: '' },
})
</script>

<template>
  <div v-if="schedule || location" class="mx-auto mt-8 flex w-full max-w-sm flex-col gap-2 px-4 sm:px-6">
    <div v-if="schedule" class="flex items-center gap-2.5 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-600">
      <Clock class="size-4 shrink-0 text-slate-400" />
      {{ schedule }}
    </div>
    <div v-if="location" class="flex items-center gap-2.5 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-600">
      <MapPin class="size-4 shrink-0 text-slate-400" />
      {{ location }}
    </div>
  </div>
</template>
