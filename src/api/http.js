export const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://10.74.51.227:8081'

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

export async function apiFetch(path, { method = 'GET', body, headers, ...rest } = {}) {
  // FormData (subida de archivos) se manda tal cual, sin JSON.stringify ni forzar
  // Content-Type: el navegador arma el multipart/form-data con el boundary correcto.
  const isFormData = body instanceof FormData

  let response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      credentials: 'include',
      headers: {
        ...(body && !isFormData ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      body: isFormData ? body : body ? JSON.stringify(body) : undefined,
      ...rest,
    })
  } catch {
    throw new ApiError('No se pudo conectar con el servidor', 0, null)
  }

  // "application/problem+json" (RFC 7807) es lo que Spring devuelve por defecto para
  // cualquier error que el backend no maneje explícitamente — sin este chequeo, esas
  // respuestas se leían como "sin cuerpo" y el error real se perdía detrás de un genérico
  // "Ocurrió un error al conectar con el servidor" (sonaba a problema de red, no de datos).
  const contentType = response.headers.get('content-type') || ''
  const data = contentType.includes('json') ? await response.json().catch(() => null) : null

  if (!response.ok) {
    // data?.detail: por si el error vino como application/problem+json (ver arriba) en vez
    // del formato propio {message: ...} — para que no se pierda el detalle igual.
    const message = data?.message || data?.detail || 'Ocurrió un error al procesar la solicitud'
    throw new ApiError(message, response.status, data)
  }

  return data
}
