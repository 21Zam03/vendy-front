<script setup>
import { ref, watch } from 'vue'

// Versión Vue (sin dependencias nuevas) del efecto "Dock" tipo macOS: los íconos
// se agrandan según qué tan cerca esté el cursor, con un tooltip flotante encima.
// El agrandado usa `transform: scale()` sobre una caja de tamaño fijo (no width/height),
// así el layout de la fila nunca cambia y el contenido de abajo no se mueve al pasar el mouse.
const props = defineProps({
  items: { type: Array, required: true }, // { label, icon, href }
  baseSize: { type: Number, default: 36 },
  magnification: { type: Number, default: 52 },
  distance: { type: Number, default: 70 },
})

const itemRefs = ref([])
const scales = ref(props.items.map(() => 1))
const hoveredIndex = ref(null)

watch(
  () => props.items.length,
  (length) => {
    scales.value = Array.from({ length }, () => 1)
    itemRefs.value = []
  },
)

function setItemRef(el, index) {
  if (el) itemRefs.value[index] = el
}

function handleMouseMove(event) {
  itemRefs.value.forEach((el, i) => {
    if (!el) return
    const rect = el.getBoundingClientRect()
    const center = rect.left + rect.width / 2
    const dist = Math.abs(event.clientX - center)
    const factor = Math.max(0, 1 - dist / props.distance)
    const size = props.baseSize + (props.magnification - props.baseSize) * factor
    scales.value[i] = size / props.baseSize
  })
}

function resetScales() {
  scales.value = props.items.map(() => 1)
  hoveredIndex.value = null
}
</script>

<template>
  <div class="flex items-end gap-2.5" @mousemove="handleMouseMove" @mouseleave="resetScales">
    <a
      v-for="(item, i) in items"
      :key="item.label"
      :ref="(el) => setItemRef(el, i)"
      :href="item.href"
      target="_blank"
      rel="noopener"
      class="relative flex shrink-0 items-end justify-center"
      :style="{ width: `${baseSize}px`, height: `${baseSize}px` }"
      @mouseenter="hoveredIndex = i"
      @mouseleave="hoveredIndex = null"
    >
      <span
        class="flex items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-[transform,background-color,color] duration-150 ease-out hover:bg-slate-200 hover:text-slate-700"
        :style="{
          width: `${baseSize}px`,
          height: `${baseSize}px`,
          transform: `scale(${scales[i]})`,
          transformOrigin: 'bottom center',
        }"
      >
        <component :is="item.icon" class="size-4" />
      </span>

      <Transition
        enter-active-class="transition duration-150 ease-out"
        enter-from-class="opacity-0 translate-y-1 scale-95"
        leave-active-class="transition duration-100 ease-in"
        leave-to-class="opacity-0"
      >
        <span
          v-if="hoveredIndex === i"
          class="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[11px] font-medium text-white shadow-lg"
        >
          {{ item.label }}
        </span>
      </Transition>
    </a>
  </div>
</template>
