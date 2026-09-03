import { apiFetch } from './http'

export function getDashboard() {
  return apiFetch('/api/v1/dashboard')
}
