// Definición de los 3 planes de membresía. Puramente informativa/de comparación en el
// frontend — el plan real de cada negocio lo asigna a mano el equipo de Vendy en la base
// de datos (ver Negocio.plan / Plan.java), y son las reglas del backend (NegocioService,
// ProductoService, CatalogoService, DashboardService) las que de verdad lo hacen cumplir.
// "nivel" espeja Plan.java para poder comparar "requiere al menos X" en el frontend.
export const plans = [
  {
    key: 'gratis',
    nivel: 0,
    label: 'Vendy Gratis',
    tagline: 'Para empezar a vender online.',
    price: 'S/ 0',
    priceNote: 'siempre',
    features: [
      'Acceso al módulo de catálogo',
      'Hasta 50 productos',
      'Catálogo general (sin plantillas decorativas)',
    ],
    notIncluded: ['Módulo de Colecciones', 'Módulo de Estadísticas'],
  },
  {
    key: 'go',
    nivel: 1,
    label: 'Vendy Go',
    tagline: 'Para negocios que ya venden en serio.',
    price: 'S/ 15',
    priceNote: '/ mes',
    features: [
      'Todo lo del plan Gratis',
      'Productos ilimitados',
      'Acceso a todos los módulos (Colecciones, Estadísticas)',
      'Elige entre varias plantillas de catálogo (Moda, Comida, Belleza, Accesorios, Calzado, Barbería)',
    ],
    notIncluded: [],
  },
  {
    key: 'premium',
    nivel: 2,
    label: 'Vendy Premium',
    tagline: 'Para una marca 100% a tu medida.',
    price: 'A medida',
    priceNote: 'cotización según el proyecto',
    features: [
      'Todo lo del plan Go',
      'Catálogo personalizado — diseño a medida para tu marca',
      'Integración de pasarelas de pago para que tus clientes paguen directo',
    ],
    notIncluded: [],
  },
]

export function getPlan(key) {
  return plans.find((p) => p.key === key) ?? plans[0]
}

export function planAlcanza(planKey, minimoKey) {
  return getPlan(planKey).nivel >= getPlan(minimoKey).nivel
}
