<script setup>
import { computed } from 'vue'
import { backgroundOptions, fontOptions } from '@/data/mock'
import { accentClasses, accentCssVars, coverClasses, radiusValue } from '@/utils/theme'

const props = defineProps({
  business: { type: Object, required: true },
})

const accent = computed(() => accentClasses(props.business.appearance.accentColor))
const cover = computed(() => coverClasses(props.business.appearance.accentColor, props.business.appearance.cover))
const radius = computed(() => radiusValue(props.business.appearance.radius))
const cssVars = computed(() => accentCssVars(props.business.appearance.accentColor, props.business.appearance.accentColorHex))
const background = computed(
  () => backgroundOptions.find((b) => b.key === props.business.appearance.background)?.class || 'bg-white',
)
const fontClass = computed(
  () => fontOptions.find((f) => f.key === props.business.appearance.font)?.class || 'font-sans',
)
</script>

<template>
  <div class="mx-auto w-full max-w-[260px] rounded-[2.25rem] border-[10px] border-slate-900 bg-slate-900 shadow-xl" :style="cssVars">
    <div class="relative overflow-hidden rounded-[1.5rem] bg-white">
      <img
        v-if="business.appearance.background === 'imagen' && business.appearance.backgroundImageUrl"
        :src="business.appearance.backgroundImageUrl"
        class="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover opacity-10"
        alt=""
      />

      <div class="absolute left-1/2 top-2 z-10 h-1.5 w-12 -translate-x-1/2 rounded-full bg-slate-900/80" />

      <img
        v-if="business.appearance.cover === 'imagen' && business.appearance.coverImageUrl"
        :src="business.appearance.coverImageUrl"
        class="h-24 w-full object-cover"
        alt=""
      />
      <div v-else class="h-24" :class="cover" />

      <div class="flex flex-col items-center gap-2 px-4 pb-6 pt-0" :class="[background, fontClass]">
        <span
          class="-mt-7 flex size-14 items-center justify-center border-4 border-white bg-slate-900 text-base font-semibold text-white shadow"
          :style="{ borderRadius: radius }"
        >
          {{ business.logoInitials }}
        </span>
        <p class="text-sm font-semibold text-slate-900">{{ business.name || 'Tu negocio' }}</p>
        <p v-if="business.description" class="max-w-[15rem] truncate text-center text-xs text-slate-400">
          {{ business.description }}
        </p>
        <div class="mt-1 flex w-full max-w-[14rem] flex-col gap-1.5">
          <span
            class="flex h-9 items-center justify-center text-xs font-semibold text-white"
            :class="accent.solid"
            :style="{ borderRadius: radius }"
          >
            Ver catálogo
          </span>
          <span
            class="flex h-9 items-center justify-center rounded-[10px] border text-xs text-slate-500"
            :class="background === 'bg-white' ? 'border-slate-200' : 'border-slate-900/10'"
          >
            Producto de ejemplo · S/ 89
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
