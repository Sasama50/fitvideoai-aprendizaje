'use client'

import { useState } from 'react'
import { GLOSARIO_INGREDIENTES } from '@/lib/glosario-ingredientes'

type Props = {
  termino: string
  clave: string
}

// Tooltip accesible: no depende solo de `title` nativo (no se ve en móvil).
// Funciona con hover en escritorio y con foco/tap en móvil.
export default function TerminoGlosario({ termino, clave }: Props) {
  const [abierto, setAbierto] = useState(false)
  const definicion = GLOSARIO_INGREDIENTES[clave]

  if (!definicion) return <>{termino}</>

  return (
    <span
      className="relative inline-block"
      tabIndex={0}
      role="button"
      aria-label={`${termino}: ${definicion}`}
      onMouseEnter={() => setAbierto(true)}
      onMouseLeave={() => setAbierto(false)}
      onFocus={() => setAbierto(true)}
      onBlur={() => setAbierto(false)}
      onClick={() => setAbierto((a) => !a)}
      style={{
        borderBottom: '1px dotted currentColor',
        cursor: 'help',
      }}
    >
      {termino}
      {abierto && (
        <span
          role="tooltip"
          className="absolute left-1/2 bottom-full z-20 mb-1.5 w-56 -translate-x-1/2 rounded-lg bg-gray-900 p-2 text-xs leading-relaxed text-white shadow-lg"
        >
          {definicion}
        </span>
      )}
    </span>
  )
}
