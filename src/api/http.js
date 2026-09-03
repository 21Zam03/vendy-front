const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://10.74.51.227:8080'

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

  const contentType = response.headers.get('content-type') || ''
  const data = contentType.includes('application/json') ? await response.json().catch(() => null) : null

  if (!response.ok) {
    const message = data?.message || 'Ocurrió un error al conectar con el servidor'
    throw new ApiError(message, response.status, data)
  }

  return data
}
