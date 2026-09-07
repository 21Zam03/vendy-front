import { apiFetch } from './http'

export function listPestanas() {
  return apiFetch('/api/v1/pestanas')
}

export function createPestana(data) {
  return apiFetch('/api/v1/pestanas', { method: 'POST', body: data })
}

export function updatePestana(id, data) {
  return apiFetch(`/api/v1/pestanas/${id}`, { method: 'PUT', body: data })
}

export function deletePestana(id) {
  return apiFetch(`/api/v1/pestanas/${id}`, { method: 'DELETE' })
}

export function reorderPestanas(idsEnOrden) {
  return apiFetch('/api/v1/pestanas/orden', { method: 'PUT', body: idsEnOrden })
}
