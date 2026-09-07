import { apiFetch } from './http'

// Biblioteca de fotos del negocio ("Archivos guardados"): se suben una vez acá y después
// se pueden reutilizar en distintos espacios del catálogo (ej. las secciones de Home de
// Moda) sin tener que volver a subir el mismo archivo cada vez.
export function listArchivos() {
  return apiFetch('/api/v1/archivos')
}

export function uploadArchivo(file) {
  const formData = new FormData()
  formData.append('file', file)
  return apiFetch('/api/v1/archivos', { method: 'POST', body: formData })
}

export function deleteArchivo(id) {
  return apiFetch(`/api/v1/archivos/${id}`, { method: 'DELETE' })
}
