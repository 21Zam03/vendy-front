<script setup>
import { computed } from 'vue'
import { themePatternItems } from '@/utils/theme'

const props = defineProps({
  cover: { type: String, default: '' },
})

const items = computed(() => themePatternItems(props.cover))
</script>

<template>
  <div v-if="items.length" class="pointer-events-none absolute inset-0 overflow-hidden">
    <span
      v-for="(item, i) in items"
      :key="i"
      class="absolute select-none leading-none opacity-25"
      :style="item.style"
    >{{ item.emoji }}</span>
  </div>
</template>
