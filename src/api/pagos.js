import { apiFetch } from './http'

export function listPagos() {
  return apiFetch('/api/v1/pagos')
}
