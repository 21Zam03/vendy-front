import { apiFetch } from './http'

export function listCategorias() {
  return apiFetch('/api/v1/categorias')
}

export function createCategoria(data) {
  return apiFetch('/api/v1/categorias', { method: 'POST', body: data })
}

export function updateCategoria(id, data) {
  return apiFetch(`/api/v1/categorias/${id}`, { method: 'PUT', body: data })
}

export function deleteCategoria(id) {
  return apiFetch(`/api/v1/categorias/${id}`, { method: 'DELETE' })
}
