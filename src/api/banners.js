import { apiFetch } from './http'

// Fotos elegidas a mano por el negocio para espacios puntuales de una plantilla de
// catálogo (ej. una diapositiva del carrusel de Moda). Devuelve un objeto { slot: url }.
export function listBanners() {
  return apiFetch('/api/v1/banners')
}

export function saveBanner(slot, imagenUrl) {
  return apiFetch(`/api/v1/banners/${slot}`, { method: 'PUT', body: { imagenUrl } })
}

export function deleteBanner(slot) {
  return apiFetch(`/api/v1/banners/${slot}`, { method: 'DELETE' })
}
