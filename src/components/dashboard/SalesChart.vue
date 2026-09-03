<script setup>
import { computed, ref } from 'vue'
import { formatCurrency } from '@/utils/format'

const props = defineProps({
  data: { type: Array, required: true }, // [{ label, value }]
})

const width = 640
const height = 240
const padding = { top: 16, right: 12, bottom: 28, left: 12 }

const hoverIndex = ref(null)

const chartMax = computed(() => Math.max(...props.data.map((d) => d.value)))
const chartMin = computed(() => Math.min(0, ...props.data.map((d) => d.value)))

const innerWidth = width - padding.left - padding.right
const innerHeight = height - padding.top - padding.bottom

function xFor(i) {
  if (props.data.length === 1) return padding.left + innerWidth / 2
  return padding.left + (i / (props.data.length - 1)) * innerWidth
}

function yFor(value) {
  const range = chartMax.value - chartMin.value || 1
  const ratio = (value - chartMin.value) / range
  return padding.top + innerHeight - ratio * innerHeight
}

const points = computed(() => props.data.map((d, i) => ({ x: xFor(i), y: yFor(d.value), ...d })))

const linePath = computed(() =>
  points.value.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' '),
)

const areaPath = computed(() => {
  if (!points.value.length) return ''
  const first = points.value[0]
  const last = points.value[points.value.length - 1]
  return `${linePath.value} L ${last.x} ${padding.top + innerHeight} L ${first.x} ${padding.top + innerHeight} Z`
})

const gridLines = [0.25, 0.5, 0.75, 1]
</script>

<template>
  <div class="relative w-full">
    <svg :viewBox="`0 0 ${width} ${height}`" class="w-full" preserveAspectRatio="none" style="height: 240px">
      <defs>
        <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--color-brand-500)" stop-opacity="0.25" />
          <stop offset="100%" stop-color="var(--color-brand-500)" stop-opacity="0" />
        </linearGradient>
      </defs>

      <line
        v-for="g in gridLines"
        :key="g"
        :x1="padding.left"
        :x2="width - padding.right"
        :y1="padding.top + innerHeight * (1 - g)"
        :y2="padding.top + innerHeight * (1 - g)"
        stroke="#e2e8f0"
        stroke-dasharray="4 4"
      />

      <path :d="areaPath" fill="url(#salesGradient)" />
      <path :d="linePath" fill="none" stroke="var(--color-brand-600)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />

      <g v-for="(p, i) in points" :key="p.label">
        <line
          v-if="hoverIndex === i"
          :x1="p.x"
          :x2="p.x"
          :y1="padding.top"
          :y2="padding.top + innerHeight"
          stroke="#cbd5e1"
          stroke-dasharray="3 3"
        />
        <circle :cx="p.x" :cy="p.y" r="4" fill="white" stroke="var(--color-brand-600)" stroke-width="2.5" />
        <text :x="p.x" :y="height - 6" text-anchor="middle" font-size="11" fill="#94a3b8">{{ p.label }}</text>
        <rect
          :x="p.x - innerWidth / (data.length * 2)"
          :y="padding.top"
          :width="innerWidth / data.length"
          :height="innerHeight"
          fill="transparent"
          @mouseenter="hoverIndex = i"
          @mouseleave="hoverIndex = null"
        />
      </g>
    </svg>

    <div
      v-if="hoverIndex !== null"
      class="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-[var(--shadow-popover)]"
      :style="{
        left: `${(points[hoverIndex].x / width) * 100}%`,
        top: `${(points[hoverIndex].y / height) * 100}%`,
        marginTop: '-8px',
      }"
    >
      <p class="font-semibold text-slate-900">{{ formatCurrency(points[hoverIndex].value) }}</p>
      <p class="text-slate-400">{{ points[hoverIndex].label }}</p>
    </div>
  </div>
</template>
