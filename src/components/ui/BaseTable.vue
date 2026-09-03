<script setup>
import Skeleton from '@/components/ui/Skeleton.vue'

defineProps({
  columns: { type: Array, required: true }, // [{ key, label, align, class }]
  rows: { type: Array, required: true },
  rowKey: { type: String, default: 'id' },
  loading: { type: Boolean, default: false },
  skeletonRows: { type: Number, default: 5 },
})
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full min-w-[640px] border-collapse text-left text-sm">
      <thead>
        <tr class="border-b border-slate-200">
          <th
            v-for="col in columns"
            :key="col.key"
            class="whitespace-nowrap px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-400"
            :class="[col.align === 'right' ? 'text-right' : '', col.class]"
          >
            {{ col.label }}
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100">
        <template v-if="loading">
          <tr v-for="i in skeletonRows" :key="i">
            <td v-for="col in columns" :key="col.key" class="px-3 py-3.5">
              <Skeleton class="h-4 w-full max-w-[10rem]" />
            </td>
          </tr>
        </template>
        <template v-else-if="rows.length">
          <tr
            v-for="row in rows"
            :key="row[rowKey]"
            class="group transition-colors hover:bg-slate-50"
          >
            <td
              v-for="col in columns"
              :key="col.key"
              class="whitespace-nowrap px-3 py-3.5 text-slate-700"
              :class="[col.align === 'right' ? 'text-right' : '', col.class]"
            >
              <slot :name="`cell-${col.key}`" :row="row">{{ row[col.key] }}</slot>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
    <div v-if="!loading && !rows.length" class="py-4">
      <slot name="empty" />
    </div>
  </div>
</template>
