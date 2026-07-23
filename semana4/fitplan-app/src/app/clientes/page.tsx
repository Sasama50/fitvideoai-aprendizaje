'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import GenerarGuionButton from '@/components/GenerarGuionButton'
import GenerarVideoButton from '@/components/GenerarVideoButton'
import FormularioPlan from '@/components/FormularioPlan'
import GenerarPlanIAButton from '@/components/GenerarPlanIAButton'
import BotonesAudio from '@/components/BotonesAudio'
import BotonEnviarPlan from '@/components/BotonEnviarPlan'
import BotonRecordatorio from '@/components/BotonRecordatorio'
import TarjetaCliente, { necesitaRecordatorio } from '@/components/TarjetaCliente'
import type { PlanNutricion, PlanEntrenamiento, PlanEstado } from '@/lib/supabase-types'
import { planNutricionTieneContenido, planEntrenamientoTieneContenido } from '@/lib/plan-vacio'

type Cliente = {
  id: number
  created_at: string
  nombre: string | null
  email: string | null
  objetivo: string | null
  restricciones: string | null
  tipo_plan: string | null
  plan_estado: PlanEstado | null
  plan_nutricion: PlanNutricion | null
  plan_entrenamiento: PlanEntrenamiento | null
  nota_profesional: string | null
  guion: string | null
  video_id: string | null
  video_url: string | null
  video_status: string | null
  audio_status: string | null
  audio_url: string | null
  link_cliente: string | null
  link_visto_at: string | null
  link_visto_count: number
  activo: boolean
}

const etiquetasPlan: Record<string, string> = {
  'perdida-peso': 'Pérdida de peso',
  'ganancia-muscular': 'Ganancia muscular',
  mantenimiento: 'Mantenimiento',
}

const etiquetasEstado: Record<PlanEstado, string> = {
  sin_generar: 'sin generar',
  borrador: 'borrador (pendiente de aprobar)',
  aprobado: 'aprobado',
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
  const [errorAprobar, setErrorAprobar] = useState<{ id: number; mensaje: string } | null>(null)
  const [planVersion, setPlanVersion] = useState<Record<number, number>>({})
  const [vista, setVista] = useState<'activos' | 'archivados'>('activos')
  const [heygenAddon, setHeygenAddon] = useState(false)
  const [heygenAvatarStatus, setHeygenAvatarStatus] = useState<string | null>(null)

  const actualizarCliente = (clienteId: number, cambios: Partial<Cliente>) => {
    setClientes((prev) =>
      prev.map((c) => (c.id === clienteId ? { ...c, ...cambios } : c))
    )
  }

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('clientes')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => setClientes(data ?? []))

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from('profesionales')
        .select('heygen_addon, heygen_avatar_status')
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data: profesional }) => {
          setHeygenAddon(profesional?.heygen_addon ?? false)
          setHeygenAvatarStatus(profesional?.heygen_avatar_status ?? null)
        })
    })
  }, [])

  const handleGuardar = async (
    clienteId: number,
    data: {
      plan_nutricion: PlanNutricion
      plan_entrenamiento: PlanEntrenamiento
      nota_profesional: string
    }
  ) => {
    const clienteActual = clientes.find((c) => c.id === clienteId)
    const estabaAprobado = clienteActual?.plan_estado === 'aprobado'

    // Guardar mientras el plan está aprobado invalida el guión/audio/vídeo ya
    // generados (pertenecen a la versión anterior) y devuelve el plan a
    // "borrador": el profesional puede corregir errores reales aunque el plan
    // ya se haya enviado, pero debe regenerar guión + audio antes de reenviar.
    const cambios: Record<string, unknown> = {
      plan_nutricion: data.plan_nutricion,
      plan_entrenamiento: data.plan_entrenamiento,
      nota_profesional: data.nota_profesional,
      plan_estado: 'borrador',
    }

    if (estabaAprobado) {
      cambios.guion = null
      cambios.video_id = null
      cambios.video_url = null
      cambios.video_status = null
      cambios.audio_status = null
      cambios.audio_url = null
    }

    const supabase = createClient()
    await supabase.from('clientes').update(cambios).eq('id', clienteId)

    actualizarCliente(clienteId, cambios as Partial<Cliente>)
    setClienteEditando(null)
    setExitoId(clienteId)
    setTimeout(() => setExitoId(null), 2000)
  }

  const handleAprobar = async (clienteId: number) => {
    setErrorAprobar(null)

    const cliente = clientes.find((c) => c.id === clienteId)
    const nutricionOk = planNutricionTieneContenido(cliente?.plan_nutricion)
    const entrenamientoOk = planEntrenamientoTieneContenido(cliente?.plan_entrenamiento)

    if (!nutricionOk || !entrenamientoOk) {
      const faltantes = [
        !nutricionOk && 'nutrición',
        !entrenamientoOk && 'entrenamiento',
      ].filter(Boolean)
      setErrorAprobar({
        id: clienteId,
        mensaje: `No puedes aprobar un plan vacío — falta contenido real de ${faltantes.join(' y ')}. Genera el plan con IA o rellena al menos una comida/ejercicio antes de aprobar.`,
      })
      return
    }

    const supabase = createClient()
    await supabase
      .from('clientes')
      .update({ plan_estado: 'aprobado' })
      .eq('id', clienteId)

    actualizarCliente(clienteId, { plan_estado: 'aprobado' })
  }

  const cambiarActivo = async (clienteId: number, activo: boolean) => {
    const res = await fetch(`/api/clientes/${clienteId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo }),
    })
    if (res.ok) {
      actualizarCliente(clienteId, { activo })
    }
  }

  const handleArchivar = (clienteId: number, nombre: string | null) => {
    const confirmado = window.confirm(
      `¿Archivar a ${nombre ?? 'este cliente'}? Su historial y plan se conservan intactos y podrás reactivarlo cuando quieras.`
    )
    if (!confirmado) return
    cambiarActivo(clienteId, false)
  }

  const handleReactivar = (clienteId: number) => {
    cambiarActivo(clienteId, true)
  }

  const clientesVisibles = clientes.filter((c) =>
    vista === 'activos' ? c.activo : !c.activo
  )

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

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Clientes registrados</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setVista('activos')}
              className="text-xs font-medium px-3 py-1 rounded-full transition"
              style={
                vista === 'activos'
                  ? { backgroundColor: '#6366f1', color: '#fff' }
                  : { backgroundColor: '#0f3460', color: '#9ca3af' }
              }
            >
              Activos
            </button>
            <button
              onClick={() => setVista('archivados')}
              className="text-xs font-medium px-3 py-1 rounded-full transition"
              style={
                vista === 'archivados'
                  ? { backgroundColor: '#6366f1', color: '#fff' }
                  : { backgroundColor: '#0f3460', color: '#9ca3af' }
              }
            >
              Archivados
            </button>
          </div>
        </div>

        {clientesVisibles.length === 0 ? (
          <div
            className="rounded-2xl p-8 shadow-2xl text-center"
            style={{ backgroundColor: '#16213e' }}
          >
            <p className="text-gray-400 text-sm">
              {vista === 'archivados'
                ? 'No hay clientes archivados'
                : 'Todavía no hay clientes registrados'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {clientesVisibles.map((cliente) => (
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
                      <Link
                        href={`/clientes/${cliente.id}/editar`}
                        className="text-xs text-gray-400 hover:text-white transition"
                        title="Editar perfil del cliente"
                      >
                        Editar perfil
                      </Link>
                      <button
                        onClick={() =>
                          cliente.activo
                            ? handleArchivar(cliente.id, cliente.nombre)
                            : handleReactivar(cliente.id)
                        }
                        className="text-xs text-gray-400 hover:text-white transition"
                        title={cliente.activo ? 'Archivar cliente' : 'Reactivar cliente'}
                      >
                        {cliente.activo ? 'Archivar' : 'Reactivar'}
                      </button>
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

                  <div className="flex items-center gap-2 mt-4 flex-wrap">
                    <p className="text-gray-500 text-xs">
                      {formatearFecha(cliente.created_at)}
                    </p>
                    <TarjetaCliente cliente={cliente} />
                    <span
                      className="text-xs font-medium px-3 py-1 rounded-full"
                      style={{ backgroundColor: '#0f3460', color: '#facc15' }}
                    >
                      Plan: {etiquetasEstado[cliente.plan_estado ?? 'sin_generar']}
                    </span>
                    {!cliente.activo && (
                      <span
                        className="text-xs font-medium px-3 py-1 rounded-full"
                        style={{ backgroundColor: '#3a1414', color: '#e74c3c' }}
                      >
                        Archivado
                      </span>
                    )}
                    {(cliente.plan_estado ?? 'sin_generar') === 'borrador' && (
                      <button
                        onClick={() => handleAprobar(cliente.id)}
                        className="text-xs font-semibold px-3 py-1 rounded-full transition"
                        style={{ backgroundColor: '#16a34a', color: '#fff' }}
                      >
                        ✓ Aprobar plan
                      </button>
                    )}
                  </div>

                  {/* Mensaje de éxito */}
                  {exitoId === cliente.id && (
                    <p className="mt-3 text-sm font-medium text-green-400">
                      Plan guardado ✓
                    </p>
                  )}

                  {/* Error al intentar aprobar un plan vacío */}
                  {errorAprobar?.id === cliente.id && (
                    <p className="mt-3 text-sm font-medium text-red-400">
                      {errorAprobar.mensaje}
                    </p>
                  )}

                  <GenerarGuionButton
                    key={`guion-${cliente.id}-${cliente.guion ? 'y' : 'n'}`}
                    clienteId={cliente.id}
                    guionInicial={cliente.guion ?? null}
                    bloqueado={(cliente.plan_estado ?? 'sin_generar') !== 'aprobado'}
                    motivoBloqueo="Aprueba el plan antes de generar el guión."
                    onGuionGenerado={(guion) => actualizarCliente(cliente.id, { guion })}
                  />
                  <GenerarVideoButton
                    key={`video-${cliente.id}-${cliente.video_status ?? 'n'}`}
                    clienteId={cliente.id}
                    videoIdInicial={cliente.video_id ?? null}
                    videoUrlInicial={cliente.video_url ?? null}
                    videoStatusInicial={cliente.video_status ?? null}
                    bloqueado={!heygenAddon || heygenAvatarStatus !== 'ready'}
                    motivoBloqueo={
                      !heygenAddon
                        ? 'Añade el add-on de vídeo HeyGen (+€35/mes Pro, +€59/mes Studio) para generar el vídeo de bienvenida.'
                        : heygenAvatarStatus === 'processing'
                        ? 'Tu avatar todavía se está generando — vuelve a intentarlo en un rato.'
                        : 'Completa el Paso 3 del onboarding para entrenar tu avatar antes de generar vídeos.'
                    }
                  />
                  <BotonesAudio
                    key={`audio-${cliente.id}-${cliente.audio_status ?? 'n'}`}
                    clienteId={cliente.id}
                    audioStatus={cliente.audio_status}
                    audioUrl={cliente.audio_url}
                    linkCliente={cliente.link_cliente}
                    bloqueado={(cliente.plan_estado ?? 'sin_generar') !== 'aprobado' || !cliente.guion}
                    motivoBloqueo={
                      (cliente.plan_estado ?? 'sin_generar') !== 'aprobado'
                        ? 'Aprueba el plan antes de generar el audio.'
                        : 'Genera el guión primero.'
                    }
                    onAudioGenerado={(audioUrl, linkToken) =>
                      actualizarCliente(cliente.id, {
                        audio_url: audioUrl,
                        audio_status: 'completado',
                        link_cliente: linkToken,
                      })
                    }
                  />
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <BotonEnviarPlan
                      clienteId={String(cliente.id)}
                      nombreCliente={cliente.nombre ?? 'cliente'}
                      email={cliente.email}
                      yaEnviadoAntes={!!cliente.link_cliente}
                      bloqueado={
                        !cliente.activo ||
                        (cliente.plan_estado ?? 'sin_generar') !== 'aprobado' ||
                        !cliente.guion ||
                        cliente.audio_status !== 'completado'
                      }
                      motivoBloqueo={
                        !cliente.activo
                          ? 'Cliente archivado — reactívalo para generar o enviar planes.'
                          : 'Aprueba el plan y regenera el guión y el audio antes de enviar.'
                      }
                    />
                    {necesitaRecordatorio(cliente) && (
                      <BotonRecordatorio clienteId={String(cliente.id)} email={cliente.email} />
                    )}
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

                    <GenerarPlanIAButton
                      clienteId={cliente.id}
                      planEstado={cliente.plan_estado ?? 'sin_generar'}
                      bloqueado={!cliente.activo}
                      motivoBloqueo="Cliente archivado — reactívalo para generar o enviar planes."
                      onGenerado={(data) => {
                        actualizarCliente(cliente.id, data)
                        setPlanVersion((prev) => ({
                          ...prev,
                          [cliente.id]: (prev[cliente.id] ?? 0) + 1,
                        }))
                      }}
                    />

                    <FormularioPlan
                      key={`${cliente.id}-${planVersion[cliente.id] ?? 0}`}
                      clienteId={cliente.id}
                      planNutricionInicial={cliente.plan_nutricion}
                      planEntrenamientoInicial={cliente.plan_entrenamiento}
                      notaProfesionalInicial={cliente.nota_profesional}
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
