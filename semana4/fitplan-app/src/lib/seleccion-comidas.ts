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
  id: number;
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

/**
 * Opción A: ventana de semanas dentro de la que no se debe repetir una
 * comida ya servida en la misma franja al mismo cliente. 4 semanas es el
 * balance elegido entre variedad real y no agotar catálogos pequeños
 * (ej. cena/snack, con solo 7 comidas cada uno).
 */
const VENTANA_SEMANAS_HISTORIAL = 4;

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

/**
 * Hash determinista (no aleatorio) para elegir de forma reproducible entre
 * candidatas igual de buenas. Mismo cliente + misma semana + misma franja
 * siempre da el mismo índice; cambia solo si cambia la semana.
 */
function hashDeterminista(texto: string): number {
  let hash = 0;
  for (let i = 0; i < texto.length; i++) {
    hash = (hash * 31 + texto.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export async function seleccionarComidas(
  supabase: SupabaseClient,
  objetivoCalorico: number,
  restriccionesDieta: string[],
  ingredientesNoDeseados: string[] = [],
  clienteId: string | number,
  semanaNumero: number = 1
): Promise<PlanComidas> {
  const comidas: ComidaSeleccionada[] = [];

  // Si se regenera la misma semana, reemplaza su historial en vez de
  // acumular filas duplicadas (una regeneración no cuenta como una semana
  // nueva a efectos de "qué se ha servido ya").
  const { error: borrarHistorialError } = await supabase
    .from("historial_comidas")
    .delete()
    .eq("cliente_id", clienteId)
    .eq("semana_numero", semanaNumero);

  if (borrarHistorialError) {
    throw new Error(
      `Error limpiando el historial de comidas de esta semana: ${borrarHistorialError.message}`
    );
  }

  for (const tipoComida of ORDEN_FRANJAS) {
    const objetivoFranja = objetivoCalorico * REPARTO_CALORICO[tipoComida];

    let query = supabase
      .from("comidas")
      .select(
        "id, tipo_comida, nombre, ingredientes, calorias, proteinas_g, carbohidratos_g, grasas_g, tags_dieta, preparacion"
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

    let mejorCandidata = candidatas[0];
    let mejorDiferencia = Math.abs(mejorCandidata.calorias - objetivoFranja);
    for (const candidata of candidatas) {
      const diferencia = Math.abs(candidata.calorias - objetivoFranja);
      if (diferencia < mejorDiferencia) {
        mejorDiferencia = diferencia;
        mejorCandidata = candidata;
      }
    }

    // Opción B: en vez de fijar siempre la única mejor opción, rota entre
    // todas las candidatas igual de buenas (dentro del mismo margen calórico
    // que ya se usa para las alternativas). Mantiene intacta la precisión
    // calórica de sesión 74 porque nunca sale del margen aceptable.
    const margenRotacion = 0.1;
    const elegiblesPorMargen = candidatas.filter(
      (c) =>
        Math.abs(c.calorias - mejorCandidata.calorias) <=
        mejorCandidata.calorias * margenRotacion
    );

    // Opción A: excluir del pool lo servido en esta franja a este cliente
    // dentro de la ventana de no-repetición.
    const { data: historialData, error: historialError } = await supabase
      .from("historial_comidas")
      .select("comida_id, semana_numero")
      .eq("cliente_id", clienteId)
      .eq("franja", tipoComida)
      .lt("semana_numero", semanaNumero)
      .gte("semana_numero", semanaNumero - VENTANA_SEMANAS_HISTORIAL);

    if (historialError) {
      throw new Error(
        `Error consultando el historial de comidas (${tipoComida}): ${historialError.message}`
      );
    }

    const historial = (historialData ?? []) as { comida_id: number; semana_numero: number }[];
    const usadosRecientes = new Set(historial.map((h) => h.comida_id));
    const sinRepetir = elegiblesPorMargen.filter((c) => !usadosRecientes.has(c.id));

    let poolRotacion = sinRepetir;
    if (poolRotacion.length === 0) {
      // Fallback (a): catálogo agotado dentro de la ventana (caso conocido
      // de franjas con pocas opciones, ej. cena/snack). No rompe la
      // generación: repite la que se sirvió hace más tiempo dentro de la
      // ventana, no toca el margen calórico ya validado.
      const ultimaVezPorComida = new Map<number, number>();
      for (const h of historial) {
        const actual = ultimaVezPorComida.get(h.comida_id);
        if (actual === undefined || h.semana_numero > actual) {
          ultimaVezPorComida.set(h.comida_id, h.semana_numero);
        }
      }
      const masAntigua = Math.min(
        ...elegiblesPorMargen.map((c) => ultimaVezPorComida.get(c.id) ?? -Infinity)
      );
      poolRotacion = elegiblesPorMargen.filter(
        (c) => (ultimaVezPorComida.get(c.id) ?? -Infinity) === masAntigua
      );
    }

    const elegibles = [...poolRotacion].sort((a, b) => a.nombre.localeCompare(b.nombre));
    const indice =
      hashDeterminista(`${clienteId}-${semanaNumero}-${tipoComida}`) % elegibles.length;
    const elegida = elegibles[indice];
    mejorDiferencia = Math.abs(elegida.calorias - objetivoFranja);

    const { error: guardarHistorialError } = await supabase.from("historial_comidas").insert({
      cliente_id: clienteId,
      semana_numero: semanaNumero,
      franja: tipoComida,
      comida_id: elegida.id,
    });

    if (guardarHistorialError) {
      throw new Error(
        `Error guardando el historial de comidas (${tipoComida}): ${guardarHistorialError.message}`
      );
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
