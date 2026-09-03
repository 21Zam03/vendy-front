<script setup>
import { CheckCircle2, AlertCircle, Info, X } from '@lucide/vue'
import { useToast } from '@/composables/useToast'

const { toasts, dismiss } = useToast()

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  default: Info,
}

const iconColors = {
  success: 'text-emerald-500',
  error: 'text-rose-500',
  info: 'text-sky-500',
  default: 'text-brand-500',
}
</script>

<template>
  <Teleport to="body">
    <div class="pointer-events-none fixed top-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      <TransitionGroup
        enter-active-class="animate-toast-in"
        leave-active-class="transition-all duration-150"
        leave-to-class="opacity-0 translate-x-2"
        move-class="transition-transform duration-150"
      >
        <div
          v-for="t in toasts"
          :key="t.id"
          class="pointer-events-auto flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-[var(--shadow-popover)]"
        >
          <component :is="icons[t.variant] || icons.default" class="mt-0.5 size-5 shrink-0" :class="iconColors[t.variant] || iconColors.default" />
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium text-slate-900">{{ t.title }}</p>
            <p v-if="t.description" class="mt-0.5 text-xs text-slate-500">{{ t.description }}</p>
          </div>
          <button class="shrink-0 rounded p-0.5 text-slate-400 hover:text-slate-600" @click="dismiss(t.id)">
            <X class="size-4" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>
