import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(request: Request) {
  try {
    const { cliente_id, nombre, objetivo, restricciones, tipo_plan } =
      await request.json();

    const prompt = `Genera un guión de vídeo personalizado para un cliente de fitness.

El guión debe sonar como el entrenador personal hablando directamente al cliente, en español, con un tono cercano y motivador.
El guión debe tener entre 60 y 90 palabras (para un vídeo de unos 30 segundos).

Datos del cliente:
- Nombre: ${nombre}
- Objetivo: ${objetivo}
- Restricciones o consideraciones: ${restricciones || "Ninguna"}
- Tipo de plan: ${tipo_plan}

Escribe únicamente el guión, sin títulos, sin introducciones ni explicaciones adicionales.`;

    const message = await anthropic.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    });

    const guion =
      message.content[0].type === "text"
        ? message.content[0].text.trim()
        : "";

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    const { error } = await supabase
      .from("clientes")
      .update({ guion, video_status: "guion_generado" })
      .eq("id", cliente_id);

    if (error) throw new Error(error.message);

    return NextResponse.json({ guion });
  } catch (error) {
    console.error("Error generando guión:", error);
    return NextResponse.json(
      { error: "Error al generar el guión" },
      { status: 500 }
    );
  }
}
