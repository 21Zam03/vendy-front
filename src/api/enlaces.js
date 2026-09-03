import { apiFetch } from './http'

export function listEnlaces() {
  return apiFetch('/api/v1/enlaces')
}

export function createEnlace(data) {
  return apiFetch('/api/v1/enlaces', { method: 'POST', body: data })
}

export function updateEnlace(id, data) {
  return apiFetch(`/api/v1/enlaces/${id}`, { method: 'PUT', body: data })
}

export function deleteEnlace(id) {
  return apiFetch(`/api/v1/enlaces/${id}`, { method: 'DELETE' })
}
