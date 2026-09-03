import { apiFetch } from './http'
import { toNestedBusiness } from './negocio'

export async function getPerfilPublico(slug) {
  const data = await apiFetch(`/api/v1/tienda/${encodeURIComponent(slug)}`)
  return toNestedBusiness(data)
}

export function getCatalogoPublico(slug) {
  return apiFetch(`/api/v1/tienda/${encodeURIComponent(slug)}/catalogo`)
}

export function getDestacadosPublico(slug) {
  return apiFetch(`/api/v1/tienda/${encodeURIComponent(slug)}/destacados`)
}

export function getSeccionesPublico(slug) {
  return apiFetch(`/api/v1/tienda/${encodeURIComponent(slug)}/secciones`)
}

export function getColeccionesPublico(slug) {
  return apiFetch(`/api/v1/tienda/${encodeURIComponent(slug)}/colecciones`)
}

export async function getColeccionPublico(slug, coleccionSlug) {
  const data = await apiFetch(`/api/v1/tienda/${encodeURIComponent(slug)}/colecciones/${encodeURIComponent(coleccionSlug)}`)
  return {
    name: data.nombre,
    slug: data.slug,
    appearance: {
      accentColor: data.accentColor ?? 'brand',
      background: data.background ?? 'white',
      font: data.font ?? 'sans',
      radius: data.radius ?? 'soft',
      cover: data.cover ?? 'gradient',
      catalogLayout: data.catalogLayout ?? 'grid',
    },
    categorias: data.categorias,
    productos: data.productos,
  }
}

export function getProductoPublico(slug, productoId) {
  return apiFetch(`/api/v1/tienda/${encodeURIComponent(slug)}/productos/${productoId}`)
}

export function registrarConsultaWhatsapp(slug, productoId) {
  return apiFetch(`/api/v1/tienda/${encodeURIComponent(slug)}/productos/${productoId}/consulta`, {
    method: 'POST',
  })
}

// Links con preview real (Open Graph) para compartir por WhatsApp/redes — a diferencia
// de la URL de la SPA, éstos los sirve el backend ya renderizados en HTML.
export function buildProductoPreviewUrl(slug, productoId) {
  const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
  return `${base}/api/v1/tienda/${encodeURIComponent(slug)}/producto/${productoId}/preview`
}

export function buildNegocioPreviewUrl(slug) {
  const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
  return `${base}/api/v1/tienda/${encodeURIComponent(slug)}/preview`
}
