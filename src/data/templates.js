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
// "tabPresets" crea la pestaña "Inicio" con sus Secciones sugeridas la primera vez que se
// elige la plantilla — la pestaña "General" NUNCA se crea acá: todo
// negocio ya arranca con la suya propia (ver NegocioService.guardar), y el modelo actual
// es fijo, solo 2 pestañas por negocio: "Inicio" y "General" (ver visiblePestanas en
// CatalogTemplateRenderer.vue, que oculta cualquier otra que haya quedado de antes).
//
// Todas las plantillas comparten la misma pestaña "General": un catálogo neutro con todos
// los productos, sin el estilo decorativo del rubro. Moda y Accesorios ya tienen su
// "Inicio" definido (portada tipo tienda real); el resto muestra un aviso de "estructura
// por definir próximamente" en su "Inicio" hasta que se diseñe (ver isHomeTab /
// isPendingHomeTab en CatalogTemplateRenderer.vue).
//
// Agregar una plantilla nueva = un objeto más acá, no un sistema nuevo.
export const templateOptions = [
  {
    key: 'moda',
    emoji: '👗',
    label: 'Moda',
    description: 'Un diseño visual y elegante para tiendas de ropa.',
    previewGradient: 'bg-gradient-to-br from-slate-700 to-slate-900',
    // "Inicio" es la pestaña que arma la portada especial de Moda (carrusel, mosaico de
    // categorías, etc.) — el nombre es fijo por ahora (ver PestanaService.crear), así que
    // no hace falta detectarla por otra cosa que no sea el flag esHome guardado en ella.
    tabPresets: [
      { nombre: 'Inicio', sectionPresets: ['Destacados', 'Novedades', 'Tendencias'] },
    ],
    sectionPresets: ['Destacados', 'Novedades', 'Tendencias'],
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
    tabPresets: [
      { nombre: 'Inicio', sectionPresets: ['Tortas', 'Postres', 'Cupcakes', 'Personalizados'] },
    ],
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
    tabPresets: [
      { nombre: 'Inicio', sectionPresets: ['Destacados', 'Servicios', 'Productos'] },
    ],
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
    // Misma portada que Moda (carrusel, mosaico, estilos, shop the look), sin las
    // secciones 5-7 — ver isHomeTab/isModa en CatalogTemplateRenderer.vue.
    tabPresets: [
      { nombre: 'Inicio', sectionPresets: ['Destacados', 'Catálogo'] },
    ],
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
    tabPresets: [
      { nombre: 'Inicio', sectionPresets: ['Novedades', 'Hombre', 'Mujer'] },
    ],
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
    tabPresets: [
      { nombre: 'Inicio', sectionPresets: ['Cortes', 'Barba', 'Combos', 'Diseño'] },
    ],
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
