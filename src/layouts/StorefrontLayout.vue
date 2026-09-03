<script setup>
import { computed } from 'vue'
import { backgroundOptions, fontOptions } from '@/data/mock'
import { radiusValue } from '@/utils/theme'

const props = defineProps({
  appearance: {
    type: Object,
    default: () => ({ background: 'white', font: 'sans', radius: 'soft' }),
  },
})

const backgroundClass = computed(
  () => backgroundOptions.find((b) => b.key === props.appearance.background)?.class || 'bg-white',
)
const fontClass = computed(
  () => fontOptions.find((f) => f.key === props.appearance.font)?.class || 'font-sans',
)
const radius = computed(() => radiusValue(props.appearance.radius))
</script>

<template>
  <div
    class="flex min-h-screen flex-col"
    :class="[backgroundClass, fontClass]"
    :style="{ '--vendy-radius': radius }"
  >
    <main class="flex-1">
      <slot />
    </main>

    <footer class="border-t border-slate-200/80 py-6 text-center text-xs text-slate-400">
      Página creada con <span class="font-medium text-brand-600">Vendy</span>
    </footer>
  </div>
</template>
