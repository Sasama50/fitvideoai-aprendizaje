import type { PlanNutricion, PlanEntrenamiento } from './supabase-types'

/**
 * Distingue un plan real (generado por IA o rellenado a mano) del esqueleto
 * por defecto del formulario manual (comidas sin ingredientes, ejercicios sin
 * nombre) — ese esqueleto no es `null`, así que una comprobación de
 * "existe/no existe" no basta para detectarlo.
 */
export function planNutricionTieneContenido(
  plan: PlanNutricion | null | undefined
): boolean {
  return !!plan?.comidas?.some((c) => c.ingredientes?.length > 0)
}

export function planEntrenamientoTieneContenido(
  plan: PlanEntrenamiento | null | undefined
): boolean {
  return !!plan?.sesiones?.some((s) => s.ejercicios?.some((e) => e.nombre?.trim()))
}
