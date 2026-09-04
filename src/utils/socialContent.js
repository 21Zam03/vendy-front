import { formatCurrency } from './format'

// Genera texto listo para copiar y pegar en Instagram/Facebook/Estado de WhatsApp.
// No publica nada automáticamente (no hay integración con redes) — solo ahorra
// el trabajo de redactar el texto.
export function buildProductPost(product, businessName, url) {
  const price = formatCurrency(product.precio)
  const discount = product.precioComparacion
    ? ` (antes ${formatCurrency(product.precioComparacion)})`
    : ''
  const conEmojis = [
    `✨ ${product.nombre} ✨`,
    product.descripcion || '',
    '',
    `💰 ${price}${discount}`,
    '',
    `📲 Pídelo por WhatsApp: ${url}`,
  ]
    .filter(Boolean)
    .join('\n')

  const directo = [
    `${product.nombre} — ${price}${discount}`,
    product.descripcion || '',
    '',
    `Cómpralo aquí: ${url}`,
  ]
    .filter(Boolean)
    .join('\n')

  const promocional = [
    `🛍️ Nuevo en ${businessName}: ${product.nombre}`,
    '',
    product.descripcion || '',
    '',
    `Precio especial: ${price}${discount}`,
    `Escríbenos por WhatsApp y te lo apartamos 👉 ${url}`,
  ]
    .filter(Boolean)
    .join('\n')

  return [
    { key: 'emojis', label: 'Con emojis', text: conEmojis },
    { key: 'directo', label: 'Directo', text: directo },
    { key: 'promocional', label: 'Promocional', text: promocional },
  ]
}

export function buildCatalogPost(businessName, url) {
  const text = [
    `🛒 ¡Conoce el catálogo completo de ${businessName}!`,
    '',
    `Mira todos nuestros productos y pide el tuyo por WhatsApp 👇`,
    url,
  ].join('\n')

  return [{ key: 'catalogo', label: 'Catálogo', text }]
}
