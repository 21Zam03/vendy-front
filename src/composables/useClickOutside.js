import { onMounted, onUnmounted } from 'vue'

export function useClickOutside(target, callback) {
  function handler(event) {
    const el = target.value
    if (el && !el.contains(event.target)) callback(event)
  }
  onMounted(() => document.addEventListener('mousedown', handler))
  onUnmounted(() => document.removeEventListener('mousedown', handler))
}
