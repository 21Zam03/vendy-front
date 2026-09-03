<script setup>
defineProps({
  as: { type: String, default: 'div' },
})
</script>

<template>
  <component :is="as" class="animate-pulse rounded-md bg-slate-200/70" />
</template>
