import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { Cliente } from "@/lib/supabase-types";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(request: Request) {
  try {
    const { clienteId } = await request.json();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    const { data, error: fetchError } = await supabase
      .from("clientes")
      .select(
        "nombre, objetivo, restricciones, plan_nutricion, plan_entrenamiento, nota_profesional"
      )
      .eq("id", clienteId)
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
    >;

    const prompt = `
Eres el asistente de voz de un nutricionista/entrenador personal.
Genera un guión de 70-90 palabras para un mensaje de audio semanal personalizado.

Cliente: ${cliente.nombre}
Objetivo: ${cliente.objetivo}
Restricciones: ${cliente.restricciones || "ninguna"}
${
  cliente.plan_nutricion
    ? `Calorías objetivo: ${cliente.plan_nutricion.calorias_objetivo}
Comidas principales: ${cliente.plan_nutricion.comidas.map((c) => c.nombre).join(", ")}`
    : ""
}
${
  cliente.plan_entrenamiento
    ? `Entrenamientos: ${cliente.plan_entrenamiento.sesiones.map((s) => s.nombre).join(", ")}`
    : ""
}
${cliente.nota_profesional ? `Nota del profesional: ${cliente.nota_profesional}` : ""}

El guión debe:
- Empezar con "Hola ${cliente.nombre},"
- Mencionar 2-3 puntos concretos del plan (no todos)
- Sonar natural, como si el profesional lo grabara
- Terminar con ánimo e invitación a escribir si tiene dudas
- NO mencionar que es generado por IA
- NO ser genérico — usar los datos reales
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
      .eq("id", clienteId);

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
