<script setup>
import { computed, useId } from 'vue'

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  label: { type: String, default: '' },
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  error: { type: String, default: '' },
  hint: { type: String, default: '' },
  required: { type: Boolean, default: false },
  autocomplete: { type: String, default: 'off' },
  disabled: { type: Boolean, default: false },
})

defineEmits(['update:modelValue'])

const id = useId()

const inputClasses = computed(() => [
  'h-11 w-full rounded-lg border bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2',
  props.disabled ? 'cursor-not-allowed bg-slate-50 text-slate-400' : '',
  props.error
    ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100'
    : 'border-slate-200 focus:border-brand-400 focus:ring-brand-100',
])
</script>

<template>
  <div class="w-full">
    <label v-if="label" :for="id" class="mb-1.5 block text-sm font-medium text-slate-700">
      {{ label }}
      <span v-if="required" class="text-rose-500">*</span>
    </label>
    <div class="relative">
      <div v-if="$slots.icon" class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
        <slot name="icon" />
      </div>
      <input
        :id="id"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :disabled="disabled"
        :class="[inputClasses, $slots.icon ? 'pl-10' : '', $slots.suffix ? 'pr-10' : '']"
        @input="$emit('update:modelValue', $event.target.value)"
      />
      <div v-if="$slots.suffix" class="absolute inset-y-0 right-3 flex items-center">
        <slot name="suffix" />
      </div>
    </div>
    <p v-if="error" class="mt-1.5 text-xs text-rose-600">{{ error }}</p>
    <p v-else-if="hint" class="mt-1.5 text-xs text-slate-400">{{ hint }}</p>
  </div>
</template>
