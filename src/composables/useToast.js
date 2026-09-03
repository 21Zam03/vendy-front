import { reactive } from 'vue'

const toasts = reactive([])
let idCounter = 0

function push(toast) {
  const id = ++idCounter
  toasts.push({
    id,
    variant: 'default',
    duration: 4000,
    ...toast,
  })
  if (toast.duration !== 0) {
    setTimeout(() => dismiss(id), toast.duration ?? 4000)
  }
  return id
}

function dismiss(id) {
  const index = toasts.findIndex((t) => t.id === id)
  if (index !== -1) toasts.splice(index, 1)
}

export function useToast() {
  return {
    toasts,
    dismiss,
    toast: (title, options = {}) => push({ title, ...options }),
    success: (title, options = {}) => push({ title, variant: 'success', ...options }),
    error: (title, options = {}) => push({ title, variant: 'error', ...options }),
    info: (title, options = {}) => push({ title, variant: 'info', ...options }),
  }
}
