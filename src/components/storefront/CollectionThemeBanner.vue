<script setup>
import { computed } from 'vue'
import ThemedCoverPattern from '@/components/ui/ThemedCoverPattern.vue'
import { THEME_COVERS } from '@/utils/theme'

const props = defineProps({
  collection: { type: Object, required: true },
})

const cover = computed(() => props.collection?.appearance?.cover)
const theme = computed(() => THEME_COVERS[cover.value])
</script>

<template>
  <div
    v-if="theme"
    class="relative flex h-40 items-center justify-center overflow-hidden sm:h-52"
    :class="theme.gradient"
  >
    <ThemedCoverPattern :cover="cover" />
    <div class="relative flex flex-col items-center gap-1.5 px-4 text-center">
      <span class="text-4xl drop-shadow">{{ theme.emoji }}</span>
      <h1 class="text-lg font-semibold text-white drop-shadow-sm sm:text-xl">{{ collection.name }}</h1>
    </div>
  </div>
</template>
