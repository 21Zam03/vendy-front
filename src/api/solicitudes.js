import { apiFetch } from './http'

// Pedido de cuenta nueva desde el formulario público de registro. Las cuentas todavía se
// crean a mano por el equipo, así que esto solo guarda el contacto para que se comuniquen
// por teléfono y armen la cuenta.
export function createSolicitudRegistro(data) {
  return apiFetch('/api/v1/solicitudes-registro', { method: 'POST', body: data })
}
