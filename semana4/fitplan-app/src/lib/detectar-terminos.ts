import { GLOSARIO_INGREDIENTES, TERMINOS_GLOSARIO } from './glosario-ingredientes'

function escaparRegExp(texto: string): string {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// TERMINOS_GLOSARIO ya viene ordenado de más largo a más corto: en una
// alternancia de regex, el motor prueba las opciones en ese orden en cada
// posición, así que "caldo de miso" se intenta (y consume) antes que "miso"
// suelto — evita el solape sin necesidad de llevar un registro aparte de
// qué tramos de texto ya se han marcado.
const patronGlosario = new RegExp(
  `\\b(${TERMINOS_GLOSARIO.map(escaparRegExp).join('|')})\\b`,
  'gi'
)

export type SegmentoTexto =
  | { tipo: 'texto'; contenido: string }
  | { tipo: 'termino'; contenido: string; clave: string }

/** Divide un texto en tramos planos y tramos que coinciden con un término del glosario. */
export function segmentarConGlosario(texto: string): SegmentoTexto[] {
  const segmentos: SegmentoTexto[] = []
  let ultimoIndice = 0

  for (const match of Array.from(texto.matchAll(patronGlosario))) {
    const indice = match.index ?? 0
    if (indice > ultimoIndice) {
      segmentos.push({ tipo: 'texto', contenido: texto.slice(ultimoIndice, indice) })
    }
    const clave = match[0].toLowerCase()
    if (GLOSARIO_INGREDIENTES[clave]) {
      segmentos.push({ tipo: 'termino', contenido: match[0], clave })
    } else {
      // no debería pasar (el patrón solo contiene claves del glosario), pero
      // por seguridad no perdemos el texto si alguna vez no coincide
      segmentos.push({ tipo: 'texto', contenido: match[0] })
    }
    ultimoIndice = indice + match[0].length
  }

  if (ultimoIndice < texto.length) {
    segmentos.push({ tipo: 'texto', contenido: texto.slice(ultimoIndice) })
  }

  return segmentos
}

/** Términos únicos del glosario detectados en un texto. */
export function detectarTerminos(texto: string): string[] {
  const encontrados = new Set<string>()
  for (const match of Array.from(texto.matchAll(patronGlosario))) {
    encontrados.add(match[0].toLowerCase())
  }
  return Array.from(encontrados)
}

/** Unión de términos del glosario detectados a lo largo de varios textos. */
export function detectarTerminosEnTextos(
  textos: (string | null | undefined)[]
): string[] {
  const claves = new Set<string>()
  for (const texto of textos) {
    if (!texto) continue
    for (const clave of detectarTerminos(texto)) claves.add(clave)
  }
  return Array.from(claves).sort()
}
