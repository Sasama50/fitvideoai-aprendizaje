import Anthropic from "@anthropic-ai/sdk";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import type { Cliente } from "@/lib/supabase-types";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(request: Request) {
  try {
    const { clienteId } = await request.json();

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

    const { data, error: fetchError } = await supabase
      .from("clientes")
      .select(
        "nombre, objetivo, restricciones, plan_nutricion, plan_entrenamiento, nota_profesional, plan_estado, profesional_id"
      )
      .eq("id", clienteId)
      .eq("profesional_id", profesional.id)
      .single();

    if (fetchError || !data) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }

    const cliente = data as Pick<
      Cliente,
      | "nombre"
      | "objetivo"
      | "restricciones"
      | "plan_nutricion"
      | "plan_entrenamiento"
      | "nota_profesional"
      | "plan_estado"
    > & { profesional_id: string };

    if (cliente.plan_estado !== "aprobado") {
      return NextResponse.json(
        {
          error:
            "El plan debe estar aprobado antes de generar el guión. Revisa y aprueba el plan primero.",
        },
        { status: 409 }
      );
    }

    const nombreProfesional = profesional.nombre || "tu profesional";

    const prompt = `
Eres el asistente de voz de ${nombreProfesional}, nutricionista/entrenador personal.
Genera un guión de 70-90 palabras para un mensaje de audio semanal personalizado.

Datos del cliente: ${cliente.nombre}
Objetivo de la semana: ${cliente.objetivo}
Plan de comidas aprobado: ${
      cliente.plan_nutricion
        ? JSON.stringify(cliente.plan_nutricion.comidas)
        : "sin plan de comidas"
    }
Plan de entrenamiento aprobado: ${
      cliente.plan_entrenamiento
        ? JSON.stringify(cliente.plan_entrenamiento.sesiones)
        : "sin plan de entrenamiento"
    }
Nota del profesional: ${cliente.nota_profesional || "ninguna"}

El guión debe:
- Empezar por "Hola ${cliente.nombre}"
- Mencionar 2-3 puntos concretos del plan ya aprobado (no todos)
- Sonar natural, como si el profesional lo estuviera grabando
- Acabar con una frase de ánimo y una invitación a escribir si tienen dudas
- NO mencionar que es generado por IA
- NO ser genérico — usar los datos reales del plan aprobado
`.trim();

    const message = await anthropic.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    });

    const guion =
      message.content[0].type === "text" ? message.content[0].text.trim() : "";

    const { error: updateError } = await supabase
      .from("clientes")
      .update({ guion, video_status: "guion_generado" })
      .eq("id", clienteId)
      .eq("profesional_id", profesional.id);

    if (updateError) throw new Error(updateError.message);

    return NextResponse.json({ guion });
  } catch (error) {
    console.error("Error generando guión:", error);
    return NextResponse.json(
      { error: "Error al generar el guión" },
      { status: 500 }
    );
  }
}
