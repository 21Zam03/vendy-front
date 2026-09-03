// Copia texto al portapapeles. La Clipboard API moderna exige un "contexto seguro"
// (https:// o localhost) — si la app se prueba por IP de LAN en http:// (ej.
// http://10.74.51.227:5173), navigator.clipboard directamente no existe. Por eso
// hay un fallback con el método viejo (textarea oculto + execCommand) que sí
// funciona en esos casos.
export async function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // sigue al fallback
    }
  }

  try {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.left = '-9999px'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(textarea)
    return ok
  } catch {
    return false
  }
}

// Intenta abrir el share nativo del sistema (también requiere contexto seguro en
// varios navegadores); si no está disponible o falla, copia el link al portapapeles.
// Devuelve 'shared' | 'copied' | 'cancelled' | 'failed'.
export async function shareOrCopy({ title, text, url }) {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url })
      return 'shared'
    } catch (err) {
      if (err?.name === 'AbortError') return 'cancelled'
      // si falla por otra razón (ej. contexto inseguro), sigue al copiado
    }
  }

  return (await copyToClipboard(url)) ? 'copied' : 'failed'
}
