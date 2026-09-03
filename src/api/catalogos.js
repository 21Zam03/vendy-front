import { apiFetch } from './http'

export function listCatalogos() {
  return apiFetch('/api/v1/catalogos')
}

export function createCatalogo(data) {
  return apiFetch('/api/v1/catalogos', { method: 'POST', body: data })
}

export function updateCatalogo(id, data) {
  return apiFetch(`/api/v1/catalogos/${id}`, { method: 'PUT', body: data })
}

export function deleteCatalogo(id) {
  return apiFetch(`/api/v1/catalogos/${id}`, { method: 'DELETE' })
}
