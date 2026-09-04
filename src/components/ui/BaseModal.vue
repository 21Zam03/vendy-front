<script setup>
import { X } from '@lucide/vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  size: { type: String, default: 'md' }, // sm | md | lg
})

const emit = defineEmits(['update:modelValue'])

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
}

function close() {
  emit('update:modelValue', false)
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="animate-fade-in"
      leave-active-class="transition-opacity duration-100"
      leave-to-class="opacity-0"
    >
      <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" @click="close" />
        <Transition
          appear
          enter-active-class="animate-scale-in"
          leave-active-class="transition-all duration-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            class="relative flex max-h-[calc(100vh-2rem)] w-full flex-col rounded-2xl bg-white shadow-[var(--shadow-popover)]"
            :class="sizes[size]"
          >
            <button
              class="absolute right-4 top-4 z-10 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              @click="close"
            >
              <X class="size-4" />
            </button>
            <div class="overflow-y-auto p-6">
              <div v-if="title" class="mb-1 pr-8 text-lg font-semibold text-slate-900">
                {{ title }}
              </div>
              <p v-if="description" class="mb-4 text-sm text-slate-500">{{ description }}</p>
              <slot />
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
