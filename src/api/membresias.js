import { apiFetch } from './http'

// El cambio de plan sigue siendo manual (el equipo lo activa en la base de datos) — esto
// solo deja registrado el pedido para que se comuniquen y lo activen.
export function createSolicitudMembresia(planKey) {
  return apiFetch('/api/v1/solicitudes-membresia', {
    method: 'POST',
    body: { plan: planKey.toUpperCase() },
  })
}
