// Catálogos de opciones para personalizar la apariencia del negocio.
// Los "key" deben coincidir exactamente con los valores que serializan los enums del backend
// (AccentColor, Background, Font, Radius, Cover en com.zam.vendy.entities.enums).

export const accentColors = [
  { key: 'brand', label: 'Violeta', class: 'bg-brand-600' },
  { key: 'whatsapp', label: 'Verde', class: 'bg-whatsapp-500' },
  { key: 'rose', label: 'Rosa', class: 'bg-rose-500' },
  { key: 'amber', label: 'Ámbar', class: 'bg-amber-500' },
  { key: 'sky', label: 'Celeste', class: 'bg-sky-500' },
  { key: 'slate', label: 'Negro', class: 'bg-slate-900' },
]

export const backgroundOptions = [
  { key: 'white', label: 'Blanco', class: 'bg-white' },
  { key: 'slate', label: 'Gris claro', class: 'bg-slate-100' },
  { key: 'cream', label: 'Crema', class: 'bg-[#faf3e9]' },
  { key: 'mint', label: 'Menta', class: 'bg-[#eaf7f1]' },
  { key: 'lavender', label: 'Lavanda', class: 'bg-[#f2eefb]' },
]

export const fontOptions = [
  { key: 'sans', label: 'Moderna', preview: 'Aa', class: 'font-sans' },
  { key: 'serif', label: 'Elegante', preview: 'Aa', class: 'font-serif' },
  { key: 'rounded', label: 'Amigable', preview: 'Aa', class: 'font-rounded' },
]

export const radiusOptions = [
  { key: 'square', label: 'Cuadrado', value: '4px' },
  { key: 'soft', label: 'Suave', value: '16px' },
  { key: 'round', label: 'Redondeado', value: '28px' },
]

export const coverOptions = [
  { key: 'solid', label: 'Sólido' },
  { key: 'gradient', label: 'Degradado' },
]

export const catalogLayoutOptions = [
  { key: 'grid', label: 'Clásico', description: 'El de siempre: barra superior con búsqueda, categorías y tarjetas en grid.' },
  { key: 'pro', label: 'PRO — Minimalista', description: 'Sin barra superior, fotos grandes y verticales. Estilo tienda de moda (Zara, Mango).' },
  { key: 'list', label: 'Lista compacta', description: 'Filas horizontales. Ideal si tienes muchos productos.' },
]

// "needsDetail" marca si el método admite un dato adicional (número, cuenta, etc.)
// que se muestra junto al nombre en la página pública.
export const paymentMethodOptions = [
  { key: 'yape', label: 'Yape', needsDetail: true, placeholder: 'Número de celular' },
  { key: 'plin', label: 'Plin', needsDetail: true, placeholder: 'Número de celular' },
  { key: 'cuenta_bcp', label: 'Cuenta BCP', needsDetail: true, placeholder: 'Número de cuenta o CCI' },
  { key: 'cuenta_interbank', label: 'Cuenta Interbank', needsDetail: true, placeholder: 'Número de cuenta o CCI' },
  { key: 'cuenta_bbva', label: 'Cuenta BBVA', needsDetail: true, placeholder: 'Número de cuenta o CCI' },
  { key: 'cuenta_scotiabank', label: 'Cuenta Scotiabank', needsDetail: true, placeholder: 'Número de cuenta o CCI' },
  { key: 'paypal', label: 'PayPal', needsDetail: true, placeholder: 'Correo o link de PayPal' },
]

export const avatarPalette = [
  'bg-brand-500',
  'bg-whatsapp-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-sky-500',
  'bg-violet-500',
  'bg-teal-500',
  'bg-orange-500',
]

export function colorFor(id) {
  const hash = String(id)
    .split('')
    .reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return avatarPalette[hash % avatarPalette.length]
}

// Paleta de degradados y emojis sugeridos para productos/categorías (el backend
// solo guarda las strings "emoji" y "color"; no hay subida de imágenes todavía).
export const productColorOptions = [
  'from-brand-200 to-brand-400',
  'from-whatsapp-200 to-whatsapp-400',
  'from-rose-200 to-rose-400',
  'from-amber-200 to-amber-400',
  'from-sky-200 to-sky-400',
  'from-slate-200 to-slate-400',
]
