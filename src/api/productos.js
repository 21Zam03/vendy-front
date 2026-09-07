import { apiFetch } from './http'

export function listProductos() {
  return apiFetch('/api/v1/productos')
}

export function createProducto(data) {
  return apiFetch('/api/v1/productos', { method: 'POST', body: data })
}

export function updateProducto(id, data) {
  return apiFetch(`/api/v1/productos/${id}`, { method: 'PUT', body: data })
}

export function deleteProducto(id) {
  return apiFetch(`/api/v1/productos/${id}`, { method: 'DELETE' })
}

// Reordena los productos dentro de una sección (seccionId null = sin sección).
export function reorderProductos(seccionId, idsEnOrden) {
  return apiFetch('/api/v1/productos/orden', { method: 'PUT', body: { seccionId, idsEnOrden } })
}

// Sube la imagen tal cual (el backend no la comprime) y devuelve { url } para incluirla
// en el payload de createProducto/updateProducto.
export function uploadProductoImagen(file) {
  const formData = new FormData()
  formData.append('file', file)
  return apiFetch('/api/v1/productos/imagen', { method: 'POST', body: formData })
}
