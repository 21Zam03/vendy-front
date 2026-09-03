import { reactive } from 'vue'
import { getDashboard } from '@/api/dashboard'

const state = reactive({
  data: null,
  loading: true,
  error: null,
})

async function load() {
  state.loading = true
  state.error = null
  try {
    state.data = await getDashboard()
  } catch (err) {
    state.error = err
  } finally {
    state.loading = false
  }
}

let initPromise = null
function ensureInitialized() {
  if (!initPromise) {
    initPromise = load()
  }
  return initPromise
}

function reload() {
  initPromise = load()
  return initPromise
}

export function useDashboard() {
  return { state, ensureInitialized, reload }
}
