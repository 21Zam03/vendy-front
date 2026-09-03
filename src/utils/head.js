function upsertMeta(attr, key, content) {
  let tag = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attr, key)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

// Actualiza <title> y las etiquetas OG/Twitter en el <head>. Sirve para la pestaña
// del navegador y para bots que sí ejecutan JS, pero NO para WhatsApp/Facebook
// (usan el HTML ya renderizado que sirve TiendaPreviewController en el backend).
export function setPageMeta({ title, description }) {
  const safeTitle = title || 'Vendy'
  const desc = description || ''

  document.title = safeTitle
  upsertMeta('name', 'description', desc)
  upsertMeta('property', 'og:title', safeTitle)
  upsertMeta('property', 'og:description', desc)
  upsertMeta('property', 'og:site_name', 'Vendy')
  upsertMeta('name', 'twitter:title', safeTitle)
  upsertMeta('name', 'twitter:description', desc)
}
