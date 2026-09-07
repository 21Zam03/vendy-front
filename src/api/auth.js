import { apiFetch, BASE_URL } from './http'

// Navegación de página completa (no un fetch): el backend redirige a Google y, al volver,
// Google redirige al backend, que setea la cookie de sesión y termina redirigiendo al
// frontend. Por eso este link se usa directo en un <a href>, nunca con apiFetch.
export function googleLoginUrl() {
  return `${BASE_URL}/oauth2/authorization/google`
}

export function loginRequest(nombreUsuario, contrasena) {
  return apiFetch('/api/v1/auth/login', {
    method: 'POST',
    body: { nombreUsuario, contrasena },
  })
}

export function logoutRequest() {
  return apiFetch('/api/v1/auth/logout', { method: 'POST' })
}

export function meRequest() {
  return apiFetch('/api/v1/auth/me')
}
