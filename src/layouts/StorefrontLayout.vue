<script setup>
import { computed } from 'vue'
import { backgroundOptions, fontOptions } from '@/data/mock'
import { radiusValue, accentCssVars } from '@/utils/theme'

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
const cssVars = computed(() => ({
  '--vendy-radius': radius.value,
  ...accentCssVars(props.appearance.accentColor, props.appearance.accentColorHex),
}))
</script>

<template>
  <div class="flex min-h-screen flex-col" :class="[backgroundClass, fontClass]" :style="cssVars">
    <!-- Foto de fondo con opacidad baja: es decorativa, no debe competir con el contenido. -->
    <img
      v-if="appearance.background === 'imagen' && appearance.backgroundImageUrl"
      :src="appearance.backgroundImageUrl"
      class="pointer-events-none fixed inset-0 -z-10 h-full w-full object-cover opacity-10"
      alt=""
    />

    <main class="flex-1">
      <slot />
    </main>

    <footer class="border-t border-slate-200/80 py-6 text-center text-xs text-slate-400">
      Página creada con <span class="font-medium text-brand-600">Vendy</span>
    </footer>
  </div>
</template>
