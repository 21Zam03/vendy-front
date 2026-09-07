// Registro de plantillas de CATÁLOGO por rubro de negocio. Una plantilla solo define
// estructura/organización del catálogo (qué secciones extra tiene y, cuando hace falta
// para que esa estructura funcione, el catalogLayout de base) — nunca color de acento,
// tipografía ni bordes: eso es personalización del negocio y se edita aparte, en
// Apariencia, sin que elegir/cambiar de plantilla la toque.
//
// "previewGradient" es solo decorativo para la card del selector (Estilo de negocio);
// no se aplica al negocio ni afecta su apariencia real.
//
// "sectionPresets" son las Secciones (el mismo recurso real de Mi catálogo → Secciones)
// que se crean automáticamente al elegir la plantilla POR PRIMERA VEZ, agrupadas dentro
// de una Pestaña nueva llamada como la plantilla (ej. "Moda") — solo si el negocio
// todavía no tiene ninguna pestaña propia (nunca se pisa una organización que el negocio
// ya armó). Cada plantilla sugiere una cantidad distinta según cómo suele organizarse ese
// rubro: el negocio puede renombrarlas, agregar más pestañas/secciones, borrarlas o
// reordenar sus productos después, como cualquier otra sección.
//
// "tabPresets" (opcional) reemplaza a "sectionPresets" cuando la plantilla necesita varias
// pestañas de entrada en vez de una sola — cada entrada { nombre, sectionPresets } crea su
// propia Pestaña con sus propias Secciones. Si una plantilla no define tabPresets, se
// crea una única pestaña con el label de la plantilla y sectionPresets adentro.
//
// Agregar una plantilla nueva = un objeto más acá, no un sistema nuevo.
export const templateOptions = [
  {
    key: 'moda',
    emoji: '👗',
    label: 'Moda',
    description: 'Un diseño visual y elegante para tiendas de ropa.',
    previewGradient: 'bg-gradient-to-br from-slate-700 to-slate-900',
    // Moda es la única plantilla que arranca con varias pestañas (como la home de una
    // tienda de ropa real: portada + secciones por público) — el resto arranca con una
    // sola pestaña (ver sectionPresets más abajo, usado cuando no hay tabPresets).
    // "esHome" marca la pestaña que arma la portada especial de Moda (carrusel, mosaico de
    // categorías, etc.) — queda guardado en la pestaña misma, así que el negocio puede
    // renombrarla (ej. "Home" -> "Inicio") sin perder esa estructura.
    tabPresets: [
      { nombre: 'Home', esHome: true, sectionPresets: ['Destacados', 'Novedades', 'Tendencias'] },
      { nombre: 'Varones', sectionPresets: ['Catálogo'] },
      { nombre: 'Mujeres', sectionPresets: ['Catálogo'] },
    ],
    sectionPresets: ['Destacados', 'Catálogo'],
    showCategories: true,
    showSchedule: false,
    showLocation: false,
    showGallery: false,
    defaultAppearance: { catalogLayout: 'pro' },
  },
  {
    key: 'comida',
    emoji: '🍰',
    label: 'Comida / Repostería',
    description: 'Destaca tus productos y promociones.',
    previewGradient: 'bg-gradient-to-br from-amber-400 to-amber-600',
    sectionPresets: ['Tortas', 'Postres', 'Cupcakes', 'Personalizados'],
    showCategories: true,
    showSchedule: true,
    showLocation: true,
    showGallery: false,
    defaultAppearance: { catalogLayout: 'grid' },
  },
  {
    key: 'belleza',
    emoji: '💄',
    label: 'Belleza',
    description: 'Una presentación elegante para productos y servicios.',
    previewGradient: 'bg-gradient-to-br from-rose-400 to-rose-600',
    sectionPresets: ['Destacados', 'Servicios', 'Productos'],
    showCategories: false,
    showSchedule: false,
    showLocation: true,
    showGallery: true,
    defaultAppearance: { catalogLayout: 'pro' },
  },
  {
    key: 'accesorios',
    emoji: '💍',
    label: 'Accesorios',
    description: 'Minimalista y enfocada en tus productos.',
    previewGradient: 'bg-gradient-to-br from-slate-400 to-slate-600',
    sectionPresets: ['Destacados', 'Catálogo'],
    showCategories: true,
    showSchedule: false,
    showLocation: false,
    showGallery: false,
    defaultAppearance: { catalogLayout: 'pro' },
  },
  {
    key: 'calzado',
    emoji: '👟',
    label: 'Calzado',
    description: 'Catálogo visual para mostrar tus modelos.',
    previewGradient: 'bg-gradient-to-br from-sky-400 to-sky-600',
    sectionPresets: ['Novedades', 'Hombre', 'Mujer'],
    showCategories: true,
    showSchedule: false,
    showLocation: false,
    showGallery: false,
    defaultAppearance: { catalogLayout: 'pro' },
  },
  {
    key: 'barberia',
    emoji: '💈',
    label: 'Barbería',
    description: 'Servicios, precios y contacto en primer plano.',
    previewGradient: 'bg-gradient-to-br from-slate-800 to-slate-950',
    sectionPresets: ['Cortes', 'Barba', 'Combos', 'Diseño'],
    showCategories: false,
    showSchedule: true,
    showLocation: true,
    showGallery: true,
    defaultAppearance: { catalogLayout: 'list' },
  },
]

export function getTemplate(key) {
  return templateOptions.find((t) => t.key === key) || null
}
