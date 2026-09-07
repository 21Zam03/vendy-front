import { apiFetch } from './http'

// Títulos elegidos a mano por el negocio para espacios puntuales de una plantilla de
// catálogo (ej. el título de una sección de Home). Devuelve un objeto { slot: texto };
// un slot sin texto guardado simplemente no aparece — no hay título por defecto.
export function listTextos() {
  return apiFetch('/api/v1/textos')
}

export function saveTexto(slot, texto) {
  return apiFetch(`/api/v1/textos/${slot}`, { method: 'PUT', body: { texto } })
}

export function deleteTexto(slot) {
  return apiFetch(`/api/v1/textos/${slot}`, { method: 'DELETE' })
}
