// Agrupa una lista de productos (ya filtrados) según las secciones definidas por el
// negocio, respetando el orden de las secciones. Los productos sin sección van al
// final, en un grupo "Otros productos" (solo si existe al menos una sección definida).
//
// includeEmpty=true mantiene las secciones sin productos en el resultado (en vez de
// ocultarlas) — lo usa el editor visual del catálogo, para que el negocio pueda ver y
// reconocer una sección recién creada aunque todavía no le haya asignado nada.
export function groupBySections(products, sections, { includeEmpty = false } = {}) {
  const groups = sections.map((s) => ({ id: s.id, nombre: s.nombre, productos: [] }))
  const groupById = new Map(groups.map((g) => [g.id, g]))
  const sinSeccion = []

  for (const p of products) {
    const grupo = p.seccionId != null ? groupById.get(p.seccionId) : null
    if (grupo) grupo.productos.push(p)
    else sinSeccion.push(p)
  }

  const result = includeEmpty ? groups : groups.filter((g) => g.productos.length)
  if (sinSeccion.length) {
    result.push({ id: null, nombre: sections.length ? 'Otros productos' : null, productos: sinSeccion })
  }
  return result
}
