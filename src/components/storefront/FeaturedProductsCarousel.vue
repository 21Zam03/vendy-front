<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { formatCurrency } from '@/utils/format'
import ProductGridCard from './ProductGridCard.vue'

const props = defineProps({
  products: { type: Array, required: true },
  slug: { type: String, required: true },
})

// Con 3 o menos, se muestran todos en fila fija. Con más, se vuelve un carrusel tipo
// "coverflow": el producto activo se ve grande y nítido al centro, los demás se ven
// más chicos y atenuados a los costados, y avanza solo.
const isSlider = computed(() => props.products.length > 3)

const router = useRouter()
const activeIndex = ref(0)
let intervalId = null
let resumeTimer = null

// Distancia "más corta" al índice activo, considerando el ciclo (para que el salto
// del último al primero se sienta como avanzar uno, no como retroceder toda la fila).
function wrappedDistance(index) {
  const n = props.products.length
  let d = index - activeIndex.value
  if (d > n / 2) d -= n
  if (d < -n / 2) d += n
  return d
}

function styleFor(index) {
  const d = wrappedDistance(index)
  const abs = Math.min(Math.abs(d), 3)
  const scale = 1 - abs * 0.17
  const opacity = abs === 0 ? 1 : abs === 1 ? 0.55 : abs === 2 ? 0.22 : 0
  return {
    transform: `translate(-50%, -50%) translateX(${d * 112}%) scale(${scale})`,
    opacity,
    zIndex: 10 - abs,
    pointerEvents: abs > 2 ? 'none' : 'auto',
  }
}

function goTo(index) {
  activeIndex.value = ((index % props.products.length) + props.products.length) % props.products.length
  pauseThenResume()
}

function openActive() {
  const product = props.products[activeIndex.value]
  router.push({ name: 'storefront-product', params: { slug: props.slug, id: product.id } })
}

function advance() {
  goTo(activeIndex.value + 1)
}

function start() {
  stop()
  if (!isSlider.value) return
  intervalId = setInterval(advance, 3200)
}

function stop() {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
}

// Cuando la persona interactúa a mano, se pausa el autoplay un rato para no pelear
// con su gesto, y luego retoma solo.
function pauseThenResume() {
  stop()
  clearTimeout(resumeTimer)
  resumeTimer = setTimeout(start, 4200)
}

// Swipe táctil: arrastrar hacia la izquierda avanza, hacia la derecha retrocede.
let touchStartX = 0
function onTouchStart(event) {
  touchStartX = event.touches[0].clientX
  stop()
}
function onTouchEnd(event) {
  const delta = event.changedTouches[0].clientX - touchStartX
  if (delta > 40) goTo(activeIndex.value - 1)
  else if (delta < -40) goTo(activeIndex.value + 1)
  else pauseThenResume()
}

onMounted(start)
onBeforeUnmount(() => {
  stop()
  clearTimeout(resumeTimer)
})
</script>

<template>
  <div class="mx-auto w-full max-w-2xl px-4 sm:px-6">
    <p class="mb-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">Destacados</p>

    <div v-if="!isSlider" class="grid grid-cols-3 gap-3">
      <ProductGridCard v-for="p in products" :key="p.id" :product="p" :slug="slug" />
    </div>

    <template v-else>
      <div
        class="relative h-56 select-none sm:h-64"
        @touchstart="onTouchStart"
        @touchend="onTouchEnd"
      >
        <div
          v-for="(p, index) in products"
          :key="p.id"
          class="absolute left-1/2 top-1/2 w-32 transition-[transform,opacity] duration-500 ease-out sm:w-40"
          :style="styleFor(index)"
        >
          <button
            v-if="index !== activeIndex"
            type="button"
            class="block w-full cursor-pointer"
            @click="goTo(index)"
          >
            <div
              class="flex aspect-square items-center justify-center overflow-hidden rounded-[var(--vendy-radius,1rem)] bg-gradient-to-br text-4xl shadow-sm sm:text-5xl"
              :class="p.imagenUrl ? 'bg-slate-100' : p.color"
            >
              <img v-if="p.imagenUrl" :src="p.imagenUrl" class="h-full w-full object-cover" alt="" />
              <template v-else>{{ p.emoji }}</template>
            </div>
          </button>

          <button v-else type="button" class="block w-full cursor-pointer" @click="openActive">
            <div
              class="relative flex aspect-square items-center justify-center overflow-hidden rounded-[var(--vendy-radius,1rem)] bg-gradient-to-br text-6xl shadow-lg sm:text-7xl"
              :class="p.imagenUrl ? 'bg-slate-100' : p.color"
            >
              <img v-if="p.imagenUrl" :src="p.imagenUrl" class="h-full w-full object-cover" alt="" />
              <template v-else>{{ p.emoji }}</template>
              <span
                v-if="p.precioComparacion"
                class="absolute left-2 top-2 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-semibold text-white"
              >
                -{{ Math.round((1 - p.precio / p.precioComparacion) * 100) }}%
              </span>
            </div>
            <div class="mt-2 text-center">
              <p class="line-clamp-1 text-sm font-medium text-slate-900">{{ p.nombre }}</p>
              <p class="text-sm font-semibold text-slate-900">{{ formatCurrency(p.precio) }}</p>
            </div>
          </button>
        </div>
      </div>

      <div class="mt-2 flex items-center justify-center gap-1.5">
        <button
          v-for="(p, i) in products"
          :key="p.id"
          class="h-1.5 rounded-full transition-all"
          :class="i === activeIndex ? 'w-4 bg-slate-700' : 'w-1.5 bg-slate-300'"
          :aria-label="`Ir al producto ${i + 1}`"
          @click="goTo(i)"
        />
      </div>
    </template>
  </div>
</template>
