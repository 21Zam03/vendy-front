<script setup>
defineProps({
  showWordmark: { type: Boolean, default: true },
  size: { type: Number, default: 32 },
})
</script>

<template>
  <div class="flex items-center gap-2">
    <img src="/favicon.svg" :width="size" :height="size" alt="Vendy" class="shrink-0" />
    <span v-if="showWordmark" class="text-lg font-semibold tracking-tight text-slate-900">
      Vendy
    </span>
  </div>
</template>
