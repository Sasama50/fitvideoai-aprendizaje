import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Cliente, PlanNutricion, PlanEntrenamiento } from '@/lib/supabase-types'
import { youtubeSearchUrl } from '@/lib/youtube'
import { agruparPorTipoComida } from '@/lib/seleccion-comidas'

type Props = {
  params: Promise<{ id: string }>
}

export default async function PlanPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: cliente } = await supabase
    .from('clientes')
    .select('*')
    .eq('id', Number(id))
    .single()

  if (!cliente) notFound()

  const c = cliente as Cliente
  const nutricion = c.plan_nutricion as PlanNutricion | null
  const entrenamiento = c.plan_entrenamiento as PlanEntrenamiento | null

  const sinPlan = !nutricion && !entrenamiento && !c.nota_profesional

  return (
    <main
      className="min-h-screen flex flex-col items-center px-4 py-12"
      style={{ backgroundColor: '#1a1a2e' }}
    >
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-8 relative">
          <Link
            href="/clientes"
            className="text-xs text-gray-400 hover:text-white transition"
          >
            ← Volver a clientes
          </Link>
          <h1 className="text-3xl font-bold text-white mt-4">{c.nombre}</h1>
          {c.tipo_plan && (
            <span
              className="inline-block mt-2 text-xs font-medium px-3 py-1 rounded-full"
              style={{ backgroundColor: '#0f3460', color: '#a5b4fc' }}
            >
              {c.tipo_plan}
            </span>
          )}
        </div>

        {sinPlan ? (
          <div
            className="rounded-2xl p-8 text-center shadow-2xl"
            style={{ backgroundColor: '#16213e' }}
          >
            <p className="text-gray-400 text-sm">
              Todavía no hay ningún plan guardado para este cliente.
            </p>
            <Link
              href="/clientes"
              className="inline-block mt-4 text-sm text-indigo-400 hover:text-indigo-300 transition"
            >
              Ir al dashboard para crear el plan →
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Nota del profesional */}
            {c.nota_profesional && (
              <Section titulo="Nota del profesional">
                <p className="text-gray-300 text-sm whitespace-pre-line">
                  {c.nota_profesional}
                </p>
              </Section>
            )}

            {/* Nutrición */}
            {nutricion && (
              <Section titulo="Plan de nutrición">
                {nutricion.calorias_objetivo && (
                  <p className="text-sm text-indigo-300 font-medium mb-4">
                    Calorías objetivo: {nutricion.calorias_objetivo} kcal/día
                  </p>
                )}

                <div className="space-y-5">
                  {agruparPorTipoComida(nutricion.comidas).map((grupo) => (
                    <div key={grupo.tipo ?? 'otras'}>
                      <p className="text-xs font-semibold uppercase tracking-wider text-indigo-300 mb-2">
                        {grupo.etiqueta}
                      </p>
                      <div className="space-y-3">
                        {grupo.items.map((comida, i) => (
                          <div
                            key={i}
                            className="rounded-xl p-4"
                            style={{ backgroundColor: '#0f3460' }}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-white font-semibold text-sm">
                                {comida.nombre}
                              </h4>
                              {(comida.calorias ?? comida.calorias_aprox) && (
                                <span className="text-xs text-indigo-300">
                                  {comida.calorias ?? comida.calorias_aprox} kcal
                                </span>
                              )}
                            </div>
                            {comida.ingredientes.length > 0 && (
                              <ul className="space-y-1">
                                {comida.ingredientes.map((ing, j) => (
                                  <li key={j} className="text-gray-300 text-sm flex items-start gap-2">
                                    <span className="text-indigo-400 mt-0.5 shrink-0">•</span>
                                    {ing}
                                  </li>
                                ))}
                              </ul>
                            )}
                            {comida.preparacion && (
                              <p className="text-gray-400 text-xs mt-2 leading-relaxed">
                                {comida.preparacion}
                              </p>
                            )}
                            {comida.alternativas && comida.alternativas.length > 0 && (
                              <p className="text-xs text-gray-400 mt-2">
                                <span className="font-medium text-gray-300">Alternativas:</span>{' '}
                                {comida.alternativas
                                  .map((alt) => `${alt.nombre} (${alt.calorias} kcal)`)
                                  .join(' · ')}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {nutricion.lista_compra && nutricion.lista_compra.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-white font-semibold text-sm mb-2">
                      Lista de la compra
                    </h4>
                    <ul className="grid grid-cols-2 gap-1">
                      {nutricion.lista_compra.map((item, i) => (
                        <li key={i} className="text-gray-300 text-sm flex items-center gap-2">
                          <span className="text-indigo-400">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Section>
            )}

            {/* Entrenamiento */}
            {entrenamiento && (
              <Section titulo="Plan de entrenamiento">
                <div className="space-y-4">
                  {entrenamiento.sesiones.map((sesion, si) => (
                    <div
                      key={si}
                      className="rounded-xl p-4"
                      style={{ backgroundColor: '#0f3460' }}
                    >
                      <h4 className="text-white font-semibold text-sm mb-3">
                        {sesion.nombre}
                      </h4>
                      <div className="space-y-2">
                        {sesion.ejercicios.map((ej, ei) => (
                          <div
                            key={ei}
                            className="flex items-start justify-between gap-4 py-2 border-t border-white/10 first:border-t-0 first:pt-0"
                          >
                            <div className="flex-1 min-w-0">
                              <a
                                href={youtubeSearchUrl(ej.nombre)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-300 hover:text-indigo-200 text-sm font-medium underline underline-offset-2"
                              >
                                {ej.nombre}
                              </a>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-400 shrink-0">
                              <span>{ej.series} series</span>
                              <span>× {ej.reps}</span>
                              {ej.descanso && (
                                <span className="text-gray-500">{ej.descanso}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </div>
        )}
      </div>
    </main>
  )
}

function Section({
  titulo,
  children,
}: {
  titulo: string
  children: React.ReactNode
}) {
  return (
    <div
      className="rounded-2xl p-6 shadow-2xl"
      style={{ backgroundColor: '#16213e' }}
    >
      <h2 className="text-lg font-semibold text-white mb-4">{titulo}</h2>
      {children}
    </div>
  )
}
