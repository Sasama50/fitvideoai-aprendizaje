'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import GenerarGuionButton from '@/components/GenerarGuionButton'
import GenerarVideoButton from '@/components/GenerarVideoButton'
import FormularioPlan from '@/components/FormularioPlan'
import BotonesAudio from '@/components/BotonesAudio'
import BotonEnviarPlan from '@/components/BotonEnviarPlan'
import type { PlanNutricion, PlanEntrenamiento } from '@/lib/supabase-types'

type Cliente = {
  id: number
  created_at: string
  nombre: string | null
  objetivo: string | null
  restricciones: string | null
  tipo_plan: string | null
  guion: string | null
  video_id: string | null
  video_url: string | null
  audio_status: string | null
  audio_url: string | null
  link_cliente: string | null
}

const etiquetasPlan: Record<string, string> = {
  'perdida-peso': 'Pérdida de peso',
  'ganancia-muscular': 'Ganancia muscular',
  mantenimiento: 'Mantenimiento',
}

function formatearFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [clienteEditando, setClienteEditando] = useState<number | null>(null)
  const [exitoId, setExitoId] = useState<number | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('clientes')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => setClientes(data ?? []))
  }, [])

  const handleGuardar = async (
    clienteId: number,
    data: {
      plan_nutricion: PlanNutricion
      plan_entrenamiento: PlanEntrenamiento
      nota_profesional: string
    }
  ) => {
    const supabase = createClient()
    await supabase
      .from('clientes')
      .update({
        plan_nutricion: data.plan_nutricion,
        plan_entrenamiento: data.plan_entrenamiento,
        nota_profesional: data.nota_profesional,
      })
      .eq('id', clienteId)

    setClienteEditando(null)
    setExitoId(clienteId)
    setTimeout(() => setExitoId(null), 2000)
  }

  return (
    <main
      className="min-h-screen flex flex-col items-center px-4 py-12"
      style={{ backgroundColor: '#1a1a2e' }}
    >
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-10 relative">
          <h1 className="text-4xl font-bold text-white mb-3">FitPlan AI</h1>
          <p className="text-gray-400 text-sm">
            Genera tu plan nutricional personalizado con inteligencia artificial
          </p>
          <Link
            href="/"
            className="absolute top-0 left-0 text-xs text-gray-400 hover:text-white transition"
          >
            ← Añadir cliente
          </Link>
        </div>

        <h2 className="text-xl font-semibold text-white mb-6">Clientes registrados</h2>

        {clientes.length === 0 ? (
          <div
            className="rounded-2xl p-8 shadow-2xl text-center"
            style={{ backgroundColor: '#16213e' }}
          >
            <p className="text-gray-400 text-sm">Todavía no hay clientes registrados</p>
          </div>
        ) : (
          <div className="space-y-4">
            {clientes.map((cliente) => (
              <div key={cliente.id}>
                {/* Tarjeta */}
                <div
                  className="rounded-2xl p-6 shadow-2xl"
                  style={{ backgroundColor: '#16213e' }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-white truncate">
                        {cliente.nombre}
                      </h3>
                      <p className="text-gray-300 text-sm mt-1 line-clamp-2">
                        {cliente.objetivo}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className="text-xs font-medium px-3 py-1 rounded-full"
                        style={{ backgroundColor: '#0f3460', color: '#a5b4fc' }}
                      >
                        {etiquetasPlan[cliente.tipo_plan ?? ''] ?? cliente.tipo_plan}
                      </span>
                      <Link
                        href={`/clientes/${cliente.id}/plan`}
                        className="text-xs text-gray-400 hover:text-white transition"
                        title="Ver plan"
                      >
                        Ver plan
                      </Link>
                      <button
                        onClick={() =>
                          setClienteEditando(
                            clienteEditando === cliente.id ? null : cliente.id
                          )
                        }
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition"
                        title="Editar plan"
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2a2 2 0 01.586-1.414z"
                          />
                        </svg>
                        Editar plan
                      </button>
                    </div>
                  </div>

                  <p className="text-gray-500 text-xs mt-4">
                    {formatearFecha(cliente.created_at)}
                  </p>

                  {/* Mensaje de éxito */}
                  {exitoId === cliente.id && (
                    <p className="mt-3 text-sm font-medium text-green-400">
                      Plan guardado ✓
                    </p>
                  )}

                  <GenerarGuionButton
                    clienteId={cliente.id}
                    guionInicial={cliente.guion ?? null}
                  />
                  {cliente.guion && (
                    <GenerarVideoButton
                      clienteId={cliente.id}
                      guion={cliente.guion}
                      videoIdInicial={cliente.video_id ?? null}
                      videoUrlInicial={cliente.video_url ?? null}
                    />
                  )}
                  <BotonesAudio
                    clienteId={cliente.id}
                    audioStatus={cliente.audio_status}
                    audioUrl={cliente.audio_url}
                    linkCliente={cliente.link_cliente}
                  />
                  <div className="mt-3">
                    <BotonEnviarPlan
                      clienteId={String(cliente.id)}
                      nombreCliente={cliente.nombre ?? 'cliente'}
                    />
                  </div>
                </div>

                {/* Panel FormularioPlan expandible */}
                {clienteEditando === cliente.id && (
                  <div
                    className="rounded-2xl p-6 shadow-2xl mt-2 border border-gray-700"
                    style={{ backgroundColor: '#16213e' }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-semibold text-white">
                        Plan semanal — {cliente.nombre}
                      </h4>
                      <button
                        onClick={() => setClienteEditando(null)}
                        className="text-gray-500 hover:text-gray-300 text-xs"
                      >
                        Cancelar
                      </button>
                    </div>
                    <FormularioPlan
                      clienteId={cliente.id}
                      onGuardar={(data) => handleGuardar(cliente.id, data)}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
