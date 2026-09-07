export function formatCurrency(value, currency = 'PEN') {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  })
    .format(value)
    .replace('PEN', 'S/')
}

export function formatNumber(value) {
  return new Intl.NumberFormat('es-ES').format(value)
}

export function formatCompactNumber(value) {
  return new Intl.NumberFormat('es-ES', { notation: 'compact', maximumFractionDigits: 1 }).format(
    value,
  )
}

// Una fecha "sola" (sin hora, ej. "2026-09-04", como manda un LocalDate del backend) JS
// la interpreta como medianoche UTC — al formatearla en una zona horaria detrás de UTC
// (Perú, UTC-5) cae al día anterior. Forzarla a medianoche LOCAL evita ese salto; a un
// datetime completo (con hora) no le hace falta este truco, ya se interpreta bien.
function parseAsLocalDate(value) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T00:00:00`)
  }
  return value instanceof Date ? value : new Date(value)
}

export function formatDate(value, opts = {}) {
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    ...opts,
  }).format(parseAsLocalDate(value))
}

export function timeAgo(value) {
  const date = value instanceof Date ? value : new Date(value)
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  const intervals = [
    { label: 'a', unit: 31536000 },
    { label: 'm', unit: 2592000 },
    { label: 'd', unit: 86400 },
    { label: 'h', unit: 3600 },
    { label: 'min', unit: 60 },
  ]
  for (const { label, unit } of intervals) {
    const count = Math.floor(seconds / unit)
    if (count >= 1) return `hace ${count}${label}`
  }
  return 'justo ahora'
}

export function formatPhone(phone = '') {
  const digits = String(phone).replace(/\D/g, '')
  if (digits.length !== 11) return `+${digits}`
  return `+${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`
}

export function formatWeekday(value) {
  const date = value instanceof Date ? value : new Date(`${value}T00:00:00`)
  const label = new Intl.DateTimeFormat('es-ES', { weekday: 'short' }).format(date).replace('.', '')
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function slugify(value = '') {
  return value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function initials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}
