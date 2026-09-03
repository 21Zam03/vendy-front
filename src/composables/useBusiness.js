import { reactive } from 'vue'
import { getNegocioRequest, saveNegocioRequest, toNestedBusiness } from '@/api/negocio'
import { ApiError } from '@/api/http'

function emptyBusiness() {
  return {
    id: null,
    name: '',
    slug: '',
    description: '',
    whatsapp: '',
    location: '',
    logoInitials: '',
    logoUrl: '',
    social: { instagram: '', tiktok: '', facebook: '' },
    appearance: { accentColor: 'brand', background: 'white', font: 'sans', radius: 'soft', cover: 'gradient', coverImageUrl: '', catalogLayout: 'grid' },
    paymentMethods: [],
    links: [],
  }
}

const state = reactive({
  business: emptyBusiness(),
  loading: true,
  // false hasta que el negocio exista en el backend (usuario nuevo sin negocio creado aún)
  exists: false,
})

async function load() {
  state.loading = true
  try {
    const data = await getNegocioRequest()
    Object.assign(state.business, toNestedBusiness(data))
    state.exists = true
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      Object.assign(state.business, emptyBusiness())
      state.exists = false
    } else {
      throw err
    }
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

async function save() {
  const saved = await saveNegocioRequest(state.business)
  Object.assign(state.business, toNestedBusiness(saved))
  state.exists = true
  return state.business
}

function reload() {
  initPromise = load()
  return initPromise
}

export function useBusiness() {
  return {
    state,
    business: state.business,
    ensureInitialized,
    save,
    reload,
  }
}
