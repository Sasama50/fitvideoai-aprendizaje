import type { SupabaseClient } from "@supabase/supabase-js";

export const ORDEN_FRANJAS = [
  "desayuno",
  "almuerzo",
  "comida_principal",
  "snack",
  "cena",
] as const;

export type TipoComida = (typeof ORDEN_FRANJAS)[number];

const REPARTO_CALORICO: Record<TipoComida, number> = {
  desayuno: 0.2,
  almuerzo: 0.25,
  comida_principal: 0.3,
  snack: 0.1,
  cena: 0.15,
};

type ComidaCatalogo = {
  tipo_comida: TipoComida;
  nombre: string;
  ingredientes: string[];
  calorias: number;
  proteinas_g: number | null;
  carbohidratos_g: number | null;
  grasas_g: number | null;
  tags_dieta: string[];
};

export type AlternativaComida = {
  nombre: string;
  ingredientes: string[];
  calorias: number;
};

export type ComidaSeleccionada = {
  tipo_comida: TipoComida;
  nombre: string;
  ingredientes: string[];
  calorias: number;
  proteinas_g: number | null;
  carbohidratos_g: number | null;
  grasas_g: number | null;
  ajuste_calorico_amplio?: boolean;
  alternativas: AlternativaComida[];
};

export type PlanComidas = {
  calorias_objetivo: number;
  suma_calorias_real: number;
  diferencia_kcal: number;
  comidas: ComidaSeleccionada[];
};

export async function seleccionarComidas(
  supabase: SupabaseClient,
  objetivoCalorico: number,
  restriccionesDieta: string[]
): Promise<PlanComidas> {
  const comidas: ComidaSeleccionada[] = [];

  for (const tipoComida of ORDEN_FRANJAS) {
    const objetivoFranja = objetivoCalorico * REPARTO_CALORICO[tipoComida];

    let query = supabase
      .from("comidas")
      .select(
        "tipo_comida, nombre, ingredientes, calorias, proteinas_g, carbohidratos_g, grasas_g, tags_dieta"
      )
      .eq("tipo_comida", tipoComida)
      .eq("activo", true);

    if (restriccionesDieta.length > 0) {
      query = query.contains("tags_dieta", restriccionesDieta);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(`Error consultando comidas (${tipoComida}): ${error.message}`);
    }

    const candidatas = (data ?? []) as ComidaCatalogo[];

    if (candidatas.length === 0) {
      throw new Error(
        `No hay comidas compatibles en el catálogo para "${tipoComida}" con las restricciones dietéticas indicadas.`
      );
    }

    let elegida = candidatas[0];
    let mejorDiferencia = Math.abs(elegida.calorias - objetivoFranja);
    for (const candidata of candidatas) {
      const diferencia = Math.abs(candidata.calorias - objetivoFranja);
      if (diferencia < mejorDiferencia) {
        mejorDiferencia = diferencia;
        elegida = candidata;
      }
    }

    const resto = candidatas.filter((c) => c !== elegida);
    const dentroDeMargen = (margen: number) =>
      resto.filter(
        (c) => Math.abs(c.calorias - elegida.calorias) <= elegida.calorias * margen
      );

    let alternativasCandidatas = dentroDeMargen(0.1);
    if (alternativasCandidatas.length === 0) {
      alternativasCandidatas = dentroDeMargen(0.2);
    }
    alternativasCandidatas.sort(
      (a, b) =>
        Math.abs(a.calorias - elegida.calorias) - Math.abs(b.calorias - elegida.calorias)
    );

    const alternativas: AlternativaComida[] = alternativasCandidatas.slice(0, 2).map((c) => ({
      nombre: c.nombre,
      ingredientes: c.ingredientes,
      calorias: c.calorias,
    }));

    const ajusteCaloricoAmplio = mejorDiferencia > objetivoFranja * 0.2;

    comidas.push({
      tipo_comida: elegida.tipo_comida,
      nombre: elegida.nombre,
      ingredientes: elegida.ingredientes,
      calorias: elegida.calorias,
      proteinas_g: elegida.proteinas_g,
      carbohidratos_g: elegida.carbohidratos_g,
      grasas_g: elegida.grasas_g,
      ...(ajusteCaloricoAmplio ? { ajuste_calorico_amplio: true } : {}),
      alternativas,
    });
  }

  const sumaCaloriasReal = comidas.reduce((acc, c) => acc + c.calorias, 0);

  return {
    calorias_objetivo: objetivoCalorico,
    suma_calorias_real: sumaCaloriasReal,
    diferencia_kcal: sumaCaloriasReal - objetivoCalorico,
    comidas,
  };
}
