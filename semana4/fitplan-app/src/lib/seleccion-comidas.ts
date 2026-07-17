import type { SupabaseClient } from "@supabase/supabase-js";

export const ORDEN_FRANJAS = [
  "desayuno",
  "almuerzo",
  "comida_principal",
  "snack",
  "cena",
] as const;

export type TipoComida = (typeof ORDEN_FRANJAS)[number];

export const ETIQUETAS_TIPO_COMIDA: Record<TipoComida, string> = {
  desayuno: "Desayuno",
  almuerzo: "Almuerzo",
  comida_principal: "Comida principal",
  snack: "Snack",
  cena: "Cena",
};

function esTipoComidaConocido(tipo: string | null | undefined): tipo is TipoComida {
  return !!tipo && (ORDEN_FRANJAS as readonly string[]).includes(tipo);
}

const DIACRITICOS = /[̀-ͯ]/g;

function normalizar(texto: string): string {
  return texto.toLowerCase().normalize("NFD").replace(DIACRITICOS, "");
}

function contieneIngredienteExcluido(
  candidata: { nombre: string; ingredientes: string[] },
  terminosExcluidos: string[]
): boolean {
  const nombreNormalizado = normalizar(candidata.nombre);
  const ingredientesNormalizados = candidata.ingredientes.map(normalizar);
  return terminosExcluidos.some((termino) => {
    const t = normalizar(termino);
    if (!t) return false;
    return (
      nombreNormalizado.includes(t) || ingredientesNormalizados.some((ing) => ing.includes(t))
    );
  });
}

/**
 * Agrupa comidas por franja en el orden fijo desayuno → almuerzo → comida_principal
 * → snack → cena. Las comidas sin tipo_comida reconocido (planes manuales o
 * guardados antes de que existiera el campo) caen en un grupo final "Otras comidas".
 */
export function agruparPorTipoComida<T extends { tipo_comida?: string | null }>(
  items: T[]
): { tipo: TipoComida | null; etiqueta: string; items: T[] }[] {
  const grupos = ORDEN_FRANJAS.map((tipo) => ({
    tipo: tipo as TipoComida | null,
    etiqueta: ETIQUETAS_TIPO_COMIDA[tipo],
    items: items.filter((item) => item.tipo_comida === tipo),
  })).filter((grupo) => grupo.items.length > 0);

  const otras = items.filter((item) => !esTipoComidaConocido(item.tipo_comida));
  if (otras.length > 0) {
    grupos.push({ tipo: null, etiqueta: "Otras comidas", items: otras });
  }

  return grupos;
}

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
  preparacion: string;
};

export type AlternativaComida = {
  nombre: string;
  ingredientes: string[];
  calorias: number;
  preparacion: string;
};

export type ComidaSeleccionada = {
  tipo_comida: TipoComida;
  nombre: string;
  ingredientes: string[];
  calorias: number;
  proteinas_g: number | null;
  carbohidratos_g: number | null;
  grasas_g: number | null;
  preparacion: string;
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
  restriccionesDieta: string[],
  ingredientesNoDeseados: string[] = []
): Promise<PlanComidas> {
  const comidas: ComidaSeleccionada[] = [];

  for (const tipoComida of ORDEN_FRANJAS) {
    const objetivoFranja = objetivoCalorico * REPARTO_CALORICO[tipoComida];

    let query = supabase
      .from("comidas")
      .select(
        "tipo_comida, nombre, ingredientes, calorias, proteinas_g, carbohidratos_g, grasas_g, tags_dieta, preparacion"
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

    const candidatasDieta = (data ?? []) as ComidaCatalogo[];

    if (candidatasDieta.length === 0) {
      throw new Error(
        `No hay comidas compatibles en el catálogo para "${tipoComida}" con las restricciones dietéticas indicadas.`
      );
    }

    const candidatas =
      ingredientesNoDeseados.length > 0
        ? candidatasDieta.filter((c) => !contieneIngredienteExcluido(c, ingredientesNoDeseados))
        : candidatasDieta;

    if (candidatas.length === 0) {
      throw new Error(
        `No hay suficientes comidas en el catálogo para "${ETIQUETAS_TIPO_COMIDA[tipoComida]}" tras excluir: ${ingredientesNoDeseados.join(", ")}. Añade más comidas al catálogo o revisa las exclusiones.`
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
      preparacion: c.preparacion,
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
      preparacion: elegida.preparacion,
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
