import { apiFetch } from './http'

export function listSecciones() {
  return apiFetch('/api/v1/secciones')
}

export function createSeccion(data) {
  return apiFetch('/api/v1/secciones', { method: 'POST', body: data })
}

export function updateSeccion(id, data) {
  return apiFetch(`/api/v1/secciones/${id}`, { method: 'PUT', body: data })
}

export function deleteSeccion(id) {
  return apiFetch(`/api/v1/secciones/${id}`, { method: 'DELETE' })
}

export function reorderSecciones(idsEnOrden) {
  return apiFetch('/api/v1/secciones/orden', { method: 'PUT', body: idsEnOrden })
}
