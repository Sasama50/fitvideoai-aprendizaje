import { segmentarConGlosario } from '@/lib/detectar-terminos'
import TerminoGlosario from './TerminoGlosario'

type Props = {
  texto: string
}

/** Renderiza un texto envolviendo los términos del glosario con su tooltip. */
export default function TextoConGlosario({ texto }: Props) {
  const segmentos = segmentarConGlosario(texto)

  return (
    <>
      {segmentos.map((seg, i) =>
        seg.tipo === 'termino' ? (
          <TerminoGlosario key={i} termino={seg.contenido} clave={seg.clave} />
        ) : (
          <span key={i}>{seg.contenido}</span>
        )
      )}
    </>
  )
}
