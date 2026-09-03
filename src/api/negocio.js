import { apiFetch } from './http'

// El backend guarda el negocio "plano" (sin anidar redes/apariencia), pero el resto
// del frontend ya trabaja con la forma anidada { social: {...}, appearance: {...} }.
// Estas dos funciones son el único punto de conversión entre ambas formas.
export function toNestedBusiness(flat) {
  return {
    id: flat.id ?? null,
    name: flat.nombre ?? '',
    slug: flat.slug ?? '',
    description: flat.descripcion ?? '',
    whatsapp: flat.whatsapp ?? '',
    location: flat.ubicacion ?? '',
    logoInitials: flat.logoInitials ?? '',
    logoUrl: flat.logoUrl ?? '',
    social: {
      instagram: flat.instagram ?? '',
      tiktok: flat.tiktok ?? '',
      facebook: flat.facebook ?? '',
    },
    appearance: {
      accentColor: flat.accentColor ?? 'brand',
      background: flat.background ?? 'white',
      font: flat.font ?? 'sans',
      radius: flat.radius ?? 'soft',
      cover: flat.cover ?? 'gradient',
      catalogLayout: flat.catalogLayout ?? 'grid',
    },
    paymentMethods: (flat.metodosPago ?? []).map((m) => ({ key: m.tipo, value: m.detalle ?? '' })),
    // Solo viene poblado en la respuesta pública de la tienda (NegocioPublicoResponse);
    // en el panel de admin los enlaces se gestionan aparte, vía /api/v1/enlaces.
    links: flat.enlaces ?? [],
  }
}

export function toFlatBusiness(nested) {
  return {
    nombre: nested.name,
    slug: nested.slug,
    descripcion: nested.description,
    whatsapp: nested.whatsapp,
    ubicacion: nested.location,
    logoInitials: nested.logoInitials,
    logoUrl: nested.logoUrl || null,
    instagram: nested.social.instagram,
    tiktok: nested.social.tiktok,
    facebook: nested.social.facebook,
    accentColor: nested.appearance.accentColor,
    background: nested.appearance.background,
    font: nested.appearance.font,
    radius: nested.appearance.radius,
    cover: nested.appearance.cover,
    catalogLayout: nested.appearance.catalogLayout,
    metodosPago: nested.paymentMethods.map((m) => ({ tipo: m.key, detalle: m.value || null })),
  }
}

export function getNegocioRequest() {
  return apiFetch('/api/v1/negocio')
}

export function saveNegocioRequest(nested) {
  return apiFetch('/api/v1/negocio', { method: 'PUT', body: toFlatBusiness(nested) })
}

// Sube la foto tal cual (el backend no la comprime) y devuelve { url } para incluirla
// en el siguiente guardado del negocio.
export function uploadNegocioLogo(file) {
  const formData = new FormData()
  formData.append('file', file)
  return apiFetch('/api/v1/negocio/logo', { method: 'POST', body: formData })
}
