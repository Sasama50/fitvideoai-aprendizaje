'use client'

import { useState } from 'react'
import type { PlanNutricion, PlanEntrenamiento, Comida, Ejercicio } from '@/lib/supabase-types'

const NOMBRES_METODO: Record<string, string> = {
  mifflin_st_jeor: 'Mifflin-St Jeor',
  harris_benedict: 'Harris-Benedict',
  manual: 'Manual',
}

type Props = {
  clienteId: number
  planNutricionInicial?: PlanNutricion | null
  planEntrenamientoInicial?: PlanEntrenamiento | null
  notaProfesionalInicial?: string | null
  onGuardar: (data: {
    plan_nutricion: PlanNutricion
    plan_entrenamiento: PlanEntrenamiento
    nota_profesional: string
  }) => void
}

const comidaVacia = (nombre: string): Comida & { ingredientesTexto: string } => ({
  nombre,
  ingredientes: [],
  calorias_aprox: undefined,
  ingredientesTexto: '',
})

const ejercicioVacio = (): Ejercicio => ({
  nombre: '',
  series: 3,
  reps: '8-12',
  descanso: '60s',
})

const sesionVacia = (nombre: string): { nombre: string; ejercicios: Ejercicio[] } => ({
  nombre,
  ejercicios: [ejercicioVacio()],
})

type ComidaForm = Comida & { ingredientesTexto: string }
type SesionForm = { nombre: string; ejercicios: Ejercicio[] }

export default function FormularioPlan({
  planNutricionInicial,
  planEntrenamientoInicial,
  notaProfesionalInicial,
  onGuardar,
}: Props) {
  const [nutricionAbierta, setNutricionAbierta] = useState(true)
  const [entrenamientoAbierto, setEntrenamientoAbierto] = useState(false)

  const [caloriasObjetivo, setCaloriasObjetivo] = useState<number | ''>(
    planNutricionInicial?.calorias_objetivo ?? ''
  )
  const [notaProfesional, setNotaProfesional] = useState(notaProfesionalInicial ?? '')
  const [comidas, setComidas] = useState<ComidaForm[]>(() =>
    planNutricionInicial?.comidas?.length
      ? planNutricionInicial.comidas.map((c) => ({
          ...c,
          ingredientesTexto: c.ingredientes.join('\n'),
        }))
      : [comidaVacia('Desayuno'), comidaVacia('Comida'), comidaVacia('Cena')]
  )

  const [sesiones, setSesiones] = useState<SesionForm[]>(() =>
    planEntrenamientoInicial?.sesiones?.length
      ? planEntrenamientoInicial.sesiones
      : [sesionVacia('Lunes'), sesionVacia('Miércoles'), sesionVacia('Viernes')]
  )

  // --- Comidas ---
  const actualizarComida = (i: number, campo: string, valor: string | number) => {
    setComidas(prev =>
      prev.map((c, idx) => (idx === i ? { ...c, [campo]: valor } : c))
    )
  }

  const añadirComida = () => {
    setComidas(prev => [...prev, comidaVacia('')])
  }

  const eliminarComida = (i: number) => {
    setComidas(prev => prev.filter((_, idx) => idx !== i))
  }

  // --- Sesiones ---
  const actualizarSesion = (i: number, nombre: string) => {
    setSesiones(prev =>
      prev.map((s, idx) => (idx === i ? { ...s, nombre } : s))
    )
  }

  const añadirSesion = () => {
    setSesiones(prev => [...prev, sesionVacia('')])
  }

  const eliminarSesion = (i: number) => {
    setSesiones(prev => prev.filter((_, idx) => idx !== i))
  }

  // --- Ejercicios ---
  const actualizarEjercicio = (
    si: number,
    ei: number,
    campo: string,
    valor: string | number
  ) => {
    setSesiones(prev =>
      prev.map((s, idx) =>
        idx !== si
          ? s
          : {
              ...s,
              ejercicios: s.ejercicios.map((e, eidx) =>
                eidx === ei ? { ...e, [campo]: valor } : e
              ),
            }
      )
    )
  }

  const añadirEjercicio = (si: number) => {
    setSesiones(prev =>
      prev.map((s, idx) =>
        idx === si ? { ...s, ejercicios: [...s.ejercicios, ejercicioVacio()] } : s
      )
    )
  }

  const eliminarEjercicio = (si: number, ei: number) => {
    setSesiones(prev =>
      prev.map((s, idx) =>
        idx !== si
          ? s
          : { ...s, ejercicios: s.ejercicios.filter((_, eidx) => eidx !== ei) }
      )
    )
  }

  // --- Submit ---
  const handleGuardar = () => {
    const plan_nutricion: PlanNutricion = {
      calorias_objetivo: caloriasObjetivo !== '' ? Number(caloriasObjetivo) : undefined,
      comidas: comidas.map(({ ingredientesTexto, ...rest }) => ({
        ...rest,
        ingredientes: ingredientesTexto
          .split('\n')
          .map(l => l.trim())
          .filter(Boolean),
      })),
    }

    const plan_entrenamiento: PlanEntrenamiento = {
      sesiones: sesiones.map(s => ({
        nombre: s.nombre,
        ejercicios: s.ejercicios,
      })),
    }

    onGuardar({ plan_nutricion, plan_entrenamiento, nota_profesional: notaProfesional })
  }

  return (
    <div className="space-y-4">
      {/* Sección Nutrición */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setNutricionAbierta(a => !a)}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 text-left font-semibold text-gray-800 hover:bg-gray-100 transition-colors"
        >
          <span>Nutrición</span>
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${nutricionAbierta ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {nutricionAbierta && (
          <div className="bg-gray-50 px-4 pb-4 pt-2 space-y-4">
            {/* TDEE y razonamiento del cálculo calórico (informativo, no editable) */}
            {planNutricionInicial?.tdee != null && (
              <div className="rounded-md bg-blue-50 border border-blue-100 px-3 py-2 text-sm text-blue-900">
                TDEE estimado: {planNutricionInicial.tdee.toLocaleString('es-ES')} kcal
                {planNutricionInicial.metodo_calculo && (
                  <> ({NOMBRES_METODO[planNutricionInicial.metodo_calculo] ?? planNutricionInicial.metodo_calculo})</>
                )}
                {' '}→ Objetivo del plan: {(planNutricionInicial.calorias_objetivo ?? planNutricionInicial.tdee).toLocaleString('es-ES')} kcal
                {planNutricionInicial.razonamiento && <> — {planNutricionInicial.razonamiento}</>}
              </div>
            )}

            {/* Calorías objetivo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Calorías objetivo
              </label>
              <input
                type="number"
                value={caloriasObjetivo}
                onChange={e => setCaloriasObjetivo(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="ej: 2000"
                className="w-40 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
              />
            </div>

            {/* Nota para el cliente */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nota para el cliente
              </label>
              <textarea
                rows={3}
                value={notaProfesional}
                onChange={e => setNotaProfesional(e.target.value)}
                placeholder="Escribe aquí tus indicaciones..."
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-900 placeholder-gray-400"
              />
            </div>

            {/* Comidas */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Comidas</p>

              {comidas.map((comida, i) => (
                <div key={i} className="border border-gray-200 rounded-md bg-white p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={comida.nombre}
                      onChange={e => actualizarComida(i, 'nombre', e.target.value)}
                      placeholder="Nombre (ej: Desayuno)"
                      className="flex-1 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
                    />
                    <input
                      type="number"
                      value={comida.calorias_aprox ?? ''}
                      onChange={e =>
                        actualizarComida(
                          i,
                          'calorias_aprox',
                          e.target.value === '' ? '' : Number(e.target.value)
                        )
                      }
                      placeholder="kcal"
                      className="w-24 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
                    />
                    <button
                      type="button"
                      onClick={() => eliminarComida(i)}
                      className="text-red-400 hover:text-red-600 text-sm font-medium shrink-0"
                    >
                      Eliminar
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    value={comida.ingredientesTexto}
                    onChange={e => actualizarComida(i, 'ingredientesTexto', e.target.value)}
                    placeholder={'Ingredientes (uno por línea)\nej: 2 huevos\n1 tostada integral'}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-900 placeholder-gray-400"
                  />
                </div>
              ))}

              <button
                type="button"
                onClick={añadirComida}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                + Añadir comida
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sección Entrenamiento */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setEntrenamientoAbierto(a => !a)}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 text-left font-semibold text-gray-800 hover:bg-gray-100 transition-colors"
        >
          <span>Entrenamiento</span>
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${entrenamientoAbierto ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {entrenamientoAbierto && (
          <div className="bg-gray-50 px-4 pb-4 pt-2 space-y-4">
            {sesiones.map((sesion, si) => (
              <div key={si} className="border border-gray-200 rounded-md bg-white p-3 space-y-3">
                {/* Nombre de sesión */}
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={sesion.nombre}
                    onChange={e => actualizarSesion(si, e.target.value)}
                    placeholder="Nombre de la sesión (ej: Lunes — Pecho y Tríceps)"
                    className="flex-1 border border-gray-300 rounded-md px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => eliminarSesion(si)}
                    className="text-red-400 hover:text-red-600 text-sm font-medium shrink-0"
                  >
                    Eliminar sesión
                  </button>
                </div>

                {/* Ejercicios */}
                <div className="space-y-2 pl-2">
                  {sesion.ejercicios.map((ej, ei) => (
                    <div key={ei} className="flex items-center gap-2 flex-wrap">
                      <input
                        type="text"
                        value={ej.nombre}
                        onChange={e => actualizarEjercicio(si, ei, 'nombre', e.target.value)}
                        placeholder="Ejercicio"
                        className="flex-1 min-w-32 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
                      />
                      <input
                        type="number"
                        value={ej.series}
                        onChange={e => actualizarEjercicio(si, ei, 'series', Number(e.target.value))}
                        placeholder="Series"
                        className="w-20 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
                        title="Series"
                      />
                      <input
                        type="text"
                        value={ej.reps}
                        onChange={e => actualizarEjercicio(si, ei, 'reps', e.target.value)}
                        placeholder="Reps"
                        className="w-20 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
                        title="Repeticiones"
                      />
                      <input
                        type="text"
                        value={ej.descanso ?? ''}
                        onChange={e => actualizarEjercicio(si, ei, 'descanso', e.target.value)}
                        placeholder="Descanso"
                        className="w-24 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
                        title="Descanso"
                      />
                      <button
                        type="button"
                        onClick={() => eliminarEjercicio(si, ei)}
                        className="text-red-400 hover:text-red-600 text-sm"
                        title="Eliminar ejercicio"
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => añadirEjercicio(si)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    + Añadir ejercicio
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={añadirSesion}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              + Añadir sesión
            </button>
          </div>
        )}
      </div>

      {/* Botón guardar */}
      <button
        type="button"
        onClick={handleGuardar}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
      >
        Guardar plan
      </button>
    </div>
  )
}
