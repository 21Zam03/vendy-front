import { apiFetch } from './http'

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
