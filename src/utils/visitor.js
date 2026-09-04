// Identificador anónimo persistido en el navegador del visitante (no un usuario logueado):
// permite al backend deduplicar visitas repetidas del mismo dispositivo en un mismo día.
const STORAGE_KEY = 'vendy_visitor_id'

export function getVisitorId() {
  try {
    let id = localStorage.getItem(STORAGE_KEY)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(STORAGE_KEY, id)
    }
    return id
  } catch {
    return null
  }
}
