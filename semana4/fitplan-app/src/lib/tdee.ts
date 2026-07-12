export type NivelActividad = 'sedentario' | 'ligero' | 'moderado' | 'activo' | 'muy_activo';
export type MetodoCalculo = 'mifflin_st_jeor' | 'harris_benedict' | 'manual';
export type SexoBiologico = 'hombre' | 'mujer';

const FACTORES_ACTIVIDAD: Record<NivelActividad, number> = {
  sedentario: 1.2,
  ligero: 1.375,
  moderado: 1.55,
  activo: 1.725,
  muy_activo: 1.9,
};

export function calcularTDEE(params: {
  metodo: MetodoCalculo;
  pesoKg: number;
  alturaCm: number;
  edad: number;
  sexo: SexoBiologico;
  nivelActividad: NivelActividad;
  objetivoCaloricoManual?: number | null;
}): { tdee: number; tmb: number | null } {
  const { metodo, pesoKg, alturaCm, edad, sexo, nivelActividad, objetivoCaloricoManual } = params;

  if (metodo === 'manual') {
    if (!objetivoCaloricoManual) throw new Error('objetivo_calorico_manual requerido si metodo_calculo = manual');
    return { tdee: objetivoCaloricoManual, tmb: null };
  }

  let tmb: number;
  if (metodo === 'harris_benedict') {
    tmb = sexo === 'hombre'
      ? 88.362 + 13.397 * pesoKg + 4.799 * alturaCm - 5.677 * edad
      : 447.593 + 9.247 * pesoKg + 3.098 * alturaCm - 4.330 * edad;
  } else {
    // mifflin_st_jeor (por defecto)
    tmb = sexo === 'hombre'
      ? 10 * pesoKg + 6.25 * alturaCm - 5 * edad + 5
      : 10 * pesoKg + 6.25 * alturaCm - 5 * edad - 161;
  }

  const tdee = tmb * FACTORES_ACTIVIDAD[nivelActividad];
  return { tdee: Math.round(tdee), tmb: Math.round(tmb) };
}
