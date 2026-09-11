import { radiusOptions } from '@/data/mock'

const ACCENTS = {
  brand: { solid: 'bg-brand-600 hover:bg-brand-700', gradient: 'bg-gradient-to-br from-brand-500 to-brand-700', text: 'text-brand-600', soft: 'bg-brand-50 text-brand-700', blob: 'bg-brand-400' },
  whatsapp: { solid: 'bg-whatsapp-500 hover:bg-whatsapp-600', gradient: 'bg-gradient-to-br from-whatsapp-400 to-whatsapp-600', text: 'text-whatsapp-600', soft: 'bg-whatsapp-50 text-whatsapp-700', blob: 'bg-whatsapp-400' },
  rose: { solid: 'bg-rose-500 hover:bg-rose-600', gradient: 'bg-gradient-to-br from-rose-400 to-rose-600', text: 'text-rose-600', soft: 'bg-rose-50 text-rose-700', blob: 'bg-rose-400' },
  amber: { solid: 'bg-amber-500 hover:bg-amber-600', gradient: 'bg-gradient-to-br from-amber-400 to-amber-600', text: 'text-amber-600', soft: 'bg-amber-50 text-amber-700', blob: 'bg-amber-400' },
  sky: { solid: 'bg-sky-500 hover:bg-sky-600', gradient: 'bg-gradient-to-br from-sky-400 to-sky-600', text: 'text-sky-600', soft: 'bg-sky-50 text-sky-700', blob: 'bg-sky-400' },
  slate: { solid: 'bg-slate-900 hover:bg-slate-800', gradient: 'bg-gradient-to-br from-slate-700 to-slate-950', text: 'text-slate-900', soft: 'bg-slate-100 text-slate-700', blob: 'bg-slate-400' },
  // El color real vive en --vendy-accent (una variable CSS, inyectada por
  // accentCssVars según accentColorHex) — Tailwind no puede generar una clase para
  // un color elegido en tiempo real, así que estas clases apuntan a la variable.
  custom: {
    solid: 'bg-[var(--vendy-accent)] hover:opacity-90 transition-opacity',
    gradient: 'bg-[var(--vendy-accent)]',
    text: 'text-[var(--vendy-accent)]',
    soft: 'bg-[var(--vendy-accent)]/10 text-[var(--vendy-accent)]',
    blob: 'bg-[var(--vendy-accent)]',
  },
}

export function accentClasses(key) {
  return ACCENTS[key] || ACCENTS.brand
}

// Variables CSS a inyectar (vía :style) en la raíz de la página cuando el negocio usa
// un color de acento personalizado, para que las clases bg-[var(--vendy-accent)] etc.
// de ACCENTS.custom tengan un valor real. Sin esto, no hace falta nada: los colores
// predefinidos ya son clases de Tailwind normales.
export function accentCssVars(accentColor, accentColorHex) {
  return accentColor === 'custom' && accentColorHex ? { '--vendy-accent': accentColorHex } : {}
}

// Cabeceras temáticas de temporada: cada una define su propio degradado (independiente
// del accentColor del negocio) y un set de emojis para el patrón decorativo.
export const THEME_COVERS = {
  navidad: { label: 'Navidad', emoji: '🎄', icons: ['🎄', '❄️', '🎁', '⭐'], gradient: 'bg-gradient-to-br from-red-700 via-emerald-800 to-red-800' },
  halloween: { label: 'Halloween', emoji: '🎃', icons: ['🎃', '👻', '🕸️', '🦇'], gradient: 'bg-gradient-to-br from-orange-600 via-slate-900 to-violet-950' },
  san_valentin: { label: 'San Valentín', emoji: '💕', icons: ['💕', '🌹', '💌', '✨'], gradient: 'bg-gradient-to-br from-rose-400 via-pink-500 to-rose-600' },
  verano: { label: 'Verano', emoji: '☀️', icons: ['☀️', '🍹', '🌴', '🍉'], gradient: 'bg-gradient-to-br from-sky-400 via-amber-300 to-orange-400' },
  black_friday: { label: 'Black Friday', emoji: '🏷️', icons: ['🏷️', '⚡', '🛍️', '🔥'], gradient: 'bg-gradient-to-br from-slate-950 via-slate-800 to-neutral-900' },
  ano_nuevo: { label: 'Año Nuevo', emoji: '🎆', icons: ['🎆', '🥂', '✨', '🎉'], gradient: 'bg-gradient-to-br from-indigo-900 via-violet-800 to-fuchsia-700' },
}

const PATTERN_SLOTS = [
  { top: '10%', left: '8%', size: '1.5rem', rotate: '-10deg' },
  { top: '15%', left: '85%', size: '1.1rem', rotate: '14deg' },
  { top: '70%', left: '10%', size: '1.7rem', rotate: '10deg' },
  { top: '75%', left: '88%', size: '1.3rem', rotate: '-8deg' },
  { top: '40%', left: '50%', size: '1rem', rotate: '18deg' },
  { top: '55%', left: '25%', size: '1.2rem', rotate: '-15deg' },
  { top: '30%', left: '70%', size: '1.4rem', rotate: '6deg' },
  { top: '85%', left: '45%', size: '1.1rem', rotate: '-20deg' },
]

export function isThemedCover(cover) {
  return Object.prototype.hasOwnProperty.call(THEME_COVERS, cover)
}

// Genera las posiciones/emojis del patrón decorativo para una cabecera temática.
export function themePatternItems(cover) {
  const theme = THEME_COVERS[cover]
  if (!theme) return []
  return PATTERN_SLOTS.map((slot, i) => ({
    emoji: theme.icons[i % theme.icons.length],
    style: `top:${slot.top}; left:${slot.left}; font-size:${slot.size}; transform:rotate(${slot.rotate});`,
  }))
}

export function coverClasses(accentKey, cover) {
  if (isThemedCover(cover)) return THEME_COVERS[cover].gradient
  const accent = accentClasses(accentKey)
  return cover === 'solid' ? accent.solid : accent.gradient
}

export function radiusValue(key) {
  return radiusOptions.find((r) => r.key === key)?.value || radiusOptions[1].value
}

// El catálogo público (y las páginas de producto, que se navegan desde ahí) es
// visualmente independiente del perfil público — nunca hereda el fondo, la tipografía,
// los bordes ni el acento que el negocio eligió en Apariencia para SU PERFIL: esos son
// personalización de la página de perfil, no del catálogo, que solo cambia según la
// plantilla elegida (ver templates.js / CatalogTemplateRenderer.vue). "template" y
// "catalogLayout" sí se mantienen — son los únicos que definen la estructura del catálogo.
export function catalogAppearance(appearance) {
  return {
    ...appearance,
    background: 'white',
    backgroundImageUrl: '',
    font: 'sans',
    radius: 'soft',
    accentColor: 'brand',
    accentColorHex: '',
  }
}
