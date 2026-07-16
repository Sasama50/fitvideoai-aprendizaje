import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import AudioPlayer from '@/components/AudioPlayer'
import BotonDescarga from '@/components/BotonDescarga'
import { youtubeSearchUrl } from '@/lib/youtube'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

interface Props {
  params: { link_token: string }
}

interface Comida {
  nombre: string
  ingredientes: string[]
  calorias?: number
}

interface Ejercicio {
  nombre: string
  series: number
  reps: string
  descanso: string
}

interface Sesion {
  nombre: string
  ejercicios: Ejercicio[]
}

interface PlanNutricion {
  calorias_objetivo?: number
  comidas: Comida[]
  lista_compra?: string[]
}

interface PlanEntrenamiento {
  sesiones: Sesion[]
}

export default async function PlanCliente({ params }: Props) {
  const { link_token } = params

  const { data: cliente, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('link_cliente', link_token)
    .single()

  if (error || !cliente) {
    notFound()
  }

  supabase
    .from('clientes')
    .update({
      link_visto_count: (cliente.link_visto_count || 0) + 1,
      link_visto_at: new Date().toISOString(),
    })
    .eq('link_cliente', link_token)
    .then()

  const colorPrincipal = '#E8463A'
  const planNutricion = cliente.plan_nutricion as PlanNutricion | null
  const planEntrenamiento = cliente.plan_entrenamiento as PlanEntrenamiento | null

  return (
    <div className="min-h-screen bg-gray-50">
      <div style={{ backgroundColor: colorPrincipal }} className="text-white">
        <div className="max-w-2xl mx-auto px-5 py-6">
          <p className="text-xs font-semibold opacity-70 uppercase tracking-wider mb-1">
            FitVideoAI
          </p>
          <h1 className="text-2xl font-bold">Tu plan de la semana</h1>
          <p className="opacity-80 text-sm mt-1">
            Hola {cliente.nombre} 👋 — Semana {cliente.semana_numero || 1}
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-5">

        {cliente.audio_url && (
          <section className="bg-white rounded-2xl shadow-sm p-5">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-3">
              🎧 Mensaje de tu profesional
            </p>
            <AudioPlayer audioUrl={cliente.audio_url} linkToken={link_token} />
          </section>
        )}

        {planNutricion && (
          <section className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="text-base font-bold text-gray-900 mb-1">🥗 Nutrición</h2>
            {planNutricion.calorias_objetivo && (
              <p className="text-sm text-gray-500 mb-4">
                Objetivo: {planNutricion.calorias_objetivo} kcal/día
              </p>
            )}

            <div className="space-y-3">
              {planNutricion.comidas?.map((comida, i) => (
                <div
                  key={i}
                  className="border-l-4 pl-4 py-1"
                  style={{ borderColor: colorPrincipal }}
                >
                  <p className="font-semibold text-gray-800 text-sm">{comida.nombre}</p>
                  {comida.calorias && (
                    <p className="text-xs text-gray-400">{comida.calorias} kcal</p>
                  )}
                  {comida.ingredientes?.length > 0 && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {comida.ingredientes.join(' · ')}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {planNutricion.lista_compra && planNutricion.lista_compra.length > 0 && (
              <BotonDescarga
                listaCompra={planNutricion.lista_compra}
                linkToken={link_token}
                color={colorPrincipal}
              />
            )}
          </section>
        )}

        {planEntrenamiento && (
          <section className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="text-base font-bold text-gray-900 mb-4">🏋️ Entrenamiento</h2>

            <div className="space-y-5">
              {planEntrenamiento.sesiones?.map((sesion, i) => (
                <div key={i}>
                  <h3 className="font-semibold text-sm text-gray-700 mb-2 bg-gray-50 px-3 py-1.5 rounded-lg">
                    {sesion.nombre}
                  </h3>
                  <div className="divide-y divide-gray-100">
                    {sesion.ejercicios?.map((ejercicio, j) => (
                      <div
                        key={j}
                        className="flex items-center justify-between py-2.5"
                      >
                        <div>
                          <p className="text-sm text-gray-800 font-medium">
                            {ejercicio.nombre}
                          </p>
                          <p className="text-xs text-gray-500">
                            {ejercicio.series}×{ejercicio.reps}
                            {ejercicio.descanso && ` · ${ejercicio.descanso} descanso`}
                          </p>
                        </div>
                        <a
                          href={youtubeSearchUrl(ejercicio.nombre)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold px-2 py-1 rounded-lg shrink-0"
                          style={{ color: colorPrincipal, backgroundColor: '#fff0ee' }}
                        >
                          Ver cómo se hace ▶
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {cliente.nota_profesional && (
          <section className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2">
              📝 Nota de tu profesional
            </p>
            <p className="text-sm text-amber-900 leading-relaxed">
              {cliente.nota_profesional}
            </p>
          </section>
        )}

        <p className="text-center text-xs text-gray-300 pb-8">
          Plan generado con FitVideoAI
        </p>
      </div>
    </div>
  )
}
