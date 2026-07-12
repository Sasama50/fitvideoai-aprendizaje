import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import type { Comida, Sesion } from "@/lib/supabase-types";
import { calcularTDEE, type MetodoCalculo } from "@/lib/tdee";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const NOMBRES_METODO: Record<MetodoCalculo, string> = {
  mifflin_st_jeor: "Mifflin-St Jeor",
  harris_benedict: "Harris-Benedict",
  manual: "Manual",
};

type PlanGenerado = {
  objetivo_calorico: number;
  razonamiento: string;
  comidas: Comida[];
  entrenamientos: Sesion[];
};

function extraerJson(texto: string): PlanGenerado {
  const limpio = texto
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();

  const parsed = JSON.parse(limpio);

  if (
    typeof parsed.objetivo_calorico !== "number" ||
    typeof parsed.razonamiento !== "string" ||
    !Array.isArray(parsed.comidas) ||
    !Array.isArray(parsed.entrenamientos)
  ) {
    throw new Error("Formato de plan inesperado devuelto por la IA");
  }

  return parsed as PlanGenerado;
}

export async function POST(req: NextRequest) {
  try {
    const { client_id } = await req.json();

    if (!client_id) {
      return NextResponse.json({ error: "client_id requerido" }, { status: 400 });
    }

    const supabaseAuth = createServerClient();
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "no_autenticado" }, { status: 401 });
    }

    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    const { data: profesional, error: profesionalError } = await supabase
      .from("profesionales")
      .select("id, nombre")
      .eq("user_id", user.id)
      .single();

    if (profesionalError || !profesional) {
      return NextResponse.json(
        { error: "profesional_no_encontrado" },
        { status: 400 }
      );
    }

    const { data: cliente, error: clienteError } = await supabase
      .from("clientes")
      .select(
        "id, nombre, objetivo, restricciones, preferencias_alimentarias, nivel_experiencia, equipamiento_disponible, historial_lesiones, profesional_id, edad, peso_kg, altura_cm, sexo_biologico, nivel_actividad, metodo_calculo, objetivo_calorico_manual"
      )
      .eq("id", client_id)
      .eq("profesional_id", profesional.id)
      .single();

    if (clienteError || !cliente) {
      return NextResponse.json({ error: "cliente_no_encontrado" }, { status: 404 });
    }

    const metodo: MetodoCalculo = cliente.metodo_calculo || "mifflin_st_jeor";

    if (metodo === "manual") {
      if (cliente.objetivo_calorico_manual == null) {
        return NextResponse.json(
          {
            error:
              "Este cliente usa el método manual pero no tiene un objetivo calórico guardado. Complétalo en su perfil antes de generar el plan.",
          },
          { status: 400 }
        );
      }
    } else {
      const faltantes: string[] = [];
      if (cliente.peso_kg == null) faltantes.push("peso");
      if (cliente.altura_cm == null) faltantes.push("altura");
      if (cliente.edad == null) faltantes.push("edad");
      if (!cliente.sexo_biologico) faltantes.push("sexo biológico");
      if (!cliente.nivel_actividad) faltantes.push("nivel de actividad");

      if (faltantes.length > 0) {
        return NextResponse.json(
          {
            error: `Completa ${faltantes.join(", ")} en el perfil del cliente antes de generar el plan.`,
          },
          { status: 400 }
        );
      }
    }

    const { tdee } = calcularTDEE({
      metodo,
      pesoKg: cliente.peso_kg,
      alturaCm: cliente.altura_cm,
      edad: cliente.edad,
      sexo: cliente.sexo_biologico,
      nivelActividad: cliente.nivel_actividad,
      objetivoCaloricoManual: cliente.objetivo_calorico_manual,
    });

    const nombreProfesional = profesional.nombre || "tu profesional";

    const prompt = `
Eres el asistente de ${nombreProfesional}, nutricionista/entrenador personal.
Genera el plan semanal para este cliente en JSON estructurado.

Datos del cliente:
- Objetivo: ${cliente.objetivo || "no especificado"}
- TDEE calculado (${NOMBRES_METODO[metodo]}): ${tdee} kcal/día
- Restricciones/alergias: ${cliente.restricciones || "ninguna"}
- Preferencias alimentarias: ${cliente.preferencias_alimentarias || "no especificadas"}
- Nivel de experiencia: ${cliente.nivel_experiencia || "no especificado"}
- Equipamiento disponible: ${cliente.equipamiento_disponible || "no especificado"}
- Historial de lesiones/limitaciones: ${cliente.historial_lesiones || "ninguno"}

A partir del TDEE y el objetivo, decide un ajuste calórico razonable dentro de rangos seguros
(déficit 15-20% para pérdida de grasa, superávit 10-15% para ganancia muscular, ±0% para mantenimiento)
y explica en una frase corta el porqué (ej. "déficit del 20% para pérdida de grasa sostenida").

Genera:
- El objetivo calórico final y la frase de razonamiento
- 4-5 comidas clave de la semana (nombre, ingredientes principales, calorías estimadas, coherentes con el objetivo calórico final)
- 3-4 sesiones de entrenamiento (nombre/día, ejercicios con series×reps y descanso), adaptadas al nivel y equipamiento
  del cliente y evitando cualquier ejercicio contraindicado por su historial de lesiones

Devuelve el resultado como JSON con esta forma:
{
  "objetivo_calorico": number,
  "razonamiento": string,
  "comidas": [{ "nombre": string, "ingredientes": string[], "calorias_aprox": number }],
  "entrenamientos": [{ "nombre": string, "ejercicios": [{ "nombre": string, "series": number, "reps": string, "descanso": string }] }]
}
No devuelvas texto fuera del JSON.
`.trim();

    const message = await anthropic.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const texto =
      message.content[0].type === "text" ? message.content[0].text : "";

    let plan: PlanGenerado;
    try {
      plan = extraerJson(texto);
    } catch {
      return NextResponse.json(
        { error: "La IA devolvió un formato inválido, inténtalo de nuevo" },
        { status: 502 }
      );
    }

    const plan_nutricion = {
      calorias_objetivo: plan.objetivo_calorico,
      comidas: plan.comidas,
      tdee,
      metodo_calculo: metodo,
      razonamiento: plan.razonamiento,
    };
    const plan_entrenamiento = { sesiones: plan.entrenamientos };

    const { error: updateError } = await supabase
      .from("clientes")
      .update({
        plan_nutricion,
        plan_entrenamiento,
        plan_estado: "borrador",
        guion: null,
        video_id: null,
        video_url: null,
        video_status: null,
        audio_status: null,
        audio_url: null,
      })
      .eq("id", client_id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ plan_nutricion, plan_entrenamiento, plan_estado: "borrador" });
  } catch (err) {
    console.error("Error en /api/generar-plan:", err);
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
