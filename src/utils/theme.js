import { radiusOptions } from '@/data/mock'

const ACCENTS = {
  brand: { solid: 'bg-brand-600 hover:bg-brand-700', gradient: 'bg-gradient-to-br from-brand-500 to-brand-700', text: 'text-brand-600', soft: 'bg-brand-50 text-brand-700' },
  whatsapp: { solid: 'bg-whatsapp-500 hover:bg-whatsapp-600', gradient: 'bg-gradient-to-br from-whatsapp-400 to-whatsapp-600', text: 'text-whatsapp-600', soft: 'bg-whatsapp-50 text-whatsapp-700' },
  rose: { solid: 'bg-rose-500 hover:bg-rose-600', gradient: 'bg-gradient-to-br from-rose-400 to-rose-600', text: 'text-rose-600', soft: 'bg-rose-50 text-rose-700' },
  amber: { solid: 'bg-amber-500 hover:bg-amber-600', gradient: 'bg-gradient-to-br from-amber-400 to-amber-600', text: 'text-amber-600', soft: 'bg-amber-50 text-amber-700' },
  sky: { solid: 'bg-sky-500 hover:bg-sky-600', gradient: 'bg-gradient-to-br from-sky-400 to-sky-600', text: 'text-sky-600', soft: 'bg-sky-50 text-sky-700' },
  slate: { solid: 'bg-slate-900 hover:bg-slate-800', gradient: 'bg-gradient-to-br from-slate-700 to-slate-950', text: 'text-slate-900', soft: 'bg-slate-100 text-slate-700' },
}

export function accentClasses(key) {
  return ACCENTS[key] || ACCENTS.brand
}

export function coverClasses(accentKey, cover) {
  const accent = accentClasses(accentKey)
  return cover === 'solid' ? accent.solid : accent.gradient
}

export function radiusValue(key) {
  return radiusOptions.find((r) => r.key === key)?.value || radiusOptions[1].value
}
