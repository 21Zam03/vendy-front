import { reactive, readonly } from 'vue'
import { loginRequest, logoutRequest, meRequest } from '@/api/auth'

function normalizeUser(raw) {
  if (!raw) return null
  const fullName = [raw.nombres, raw.apellidos].filter(Boolean).join(' ')
  return {
    ...raw,
    name: fullName || raw.nombreUsuario || 'Usuario',
    email: raw.correo || '',
    username: raw.nombreUsuario || '',
    roles: raw.roles ? [...raw.roles] : [],
  }
}

const state = reactive({
  isAuthenticated: false,
  initializing: true,
  user: null,
})

async function login(nombreUsuario, contrasena) {
  const result = await loginRequest(nombreUsuario, contrasena)
  state.user = normalizeUser(result?.usuario)
  state.isAuthenticated = true
  return state.user
}

async function logout() {
  try {
    await logoutRequest()
  } finally {
    state.user = null
    state.isAuthenticated = false
  }
}

async function fetchCurrentUser() {
  try {
    const user = await meRequest()
    state.user = normalizeUser(user)
    state.isAuthenticated = true
  } catch {
    state.user = null
    state.isAuthenticated = false
  }
}

// La sesión vive en una cookie httpOnly, así que al cargar la app no sabemos
// si el usuario sigue autenticado hasta preguntarle al backend (/me).
// initPromise memoiza esa consulta para no repetirla en cada navegación.
let initPromise = null
function ensureInitialized() {
  if (!initPromise) {
    initPromise = fetchCurrentUser().finally(() => {
      state.initializing = false
    })
  }
  return initPromise
}

export function useAuth() {
  return {
    state: readonly(state),
    login,
    logout,
    fetchCurrentUser,
    ensureInitialized,
  }
}
