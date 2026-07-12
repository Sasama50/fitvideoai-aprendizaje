import type { SexoBiologico, NivelActividad, MetodoCalculo } from './tdee'

export type Ejercicio = {
  nombre: string
  series: number
  reps: string
  descanso?: string
  url_youtube?: string
}

export type Sesion = {
  nombre: string
  ejercicios: Ejercicio[]
}

export type Comida = {
  nombre: string
  ingredientes: string[]
  calorias_aprox?: number
}

export type PlanNutricion = {
  calorias_objetivo?: number
  comidas: Comida[]
  lista_compra?: string[]
  tdee?: number
  metodo_calculo?: MetodoCalculo
  razonamiento?: string
}

export type PlanEntrenamiento = {
  sesiones: Sesion[]
}

export type PlanEstado = "sin_generar" | "borrador" | "aprobado"

export type Cliente = {
  id: number
  created_at: string
  nombre: string | null
  objetivo: string | null
  restricciones: string | null
  tipo_plan: string | null
  plan_estado: PlanEstado | null
  preferencias_alimentarias: string | null
  nivel_experiencia: string | null
  equipamiento_disponible: string | null
  historial_lesiones: string | null
  edad: number | null
  peso_kg: number | null
  altura_cm: number | null
  sexo_biologico: SexoBiologico | null
  nivel_actividad: NivelActividad | null
  metodo_calculo: MetodoCalculo | null
  objetivo_calorico_manual: number | null
  guion: string | null
  video_id: string | null
  video_url: string | null
  video_status: string | null
  plan_nutricion: PlanNutricion | null
  plan_entrenamiento: PlanEntrenamiento | null
  nota_profesional: string | null
  semana_numero: number
  audio_url: string | null
  audio_status: string
  link_cliente: string | null
  link_visto_at: string | null
  link_visto_count: number
  link_descarga_at: string | null
}

export type Profesional = {
  id: string
  user_id: string
  nombre: string | null
  email: string | null
  logo_url: string | null
  color_principal: string
  elevenlabs_voice_id: string | null
  heygen_avatar_id: string | null
  plan: string
  created_at: string
}
