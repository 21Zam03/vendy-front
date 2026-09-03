<script setup>
defineProps({
  padded: { type: Boolean, default: true },
  hoverable: { type: Boolean, default: false },
})
</script>

<template>
  <div
    class="rounded-xl border border-slate-200 bg-white shadow-[var(--shadow-card)]"
    :class="[padded ? 'p-5' : '', hoverable ? 'transition-shadow hover:shadow-md' : '']"
  >
    <div v-if="$slots.header" class="mb-4 flex items-center justify-between">
      <slot name="header" />
    </div>
    <slot />
  </div>
</template>
