import Anthropic from "@anthropic-ai/sdk";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const ETIQUETAS_TIPO_PLAN: Record<string, string> = {
  "perdida-peso": "Pérdida de peso",
  "ganancia-muscular": "Ganancia muscular",
  "mantenimiento": "Mantenimiento",
};

async function generarMensajeBienvenida(
  nombreProfesional: string,
  cliente: { nombre: string; objetivo: string | null; tipo_plan: string | null }
): Promise<string> {
  const tipoPlanLabel = cliente.tipo_plan
    ? ETIQUETAS_TIPO_PLAN[cliente.tipo_plan] ?? cliente.tipo_plan
    : "sin especificar";

  const prompt = `
Eres el asistente de ${nombreProfesional}, nutricionista/entrenador personal.
Genera un guión corto (40-60 palabras) para un vídeo de bienvenida que se
graba UNA SOLA VEZ para un cliente nuevo y se queda fijo en su página de
plan de forma indefinida — no es un mensaje semanal y no debe caducar.

Cliente: ${cliente.nombre}
Objetivo general: ${cliente.objetivo || "sin especificar"}
Tipo de plan: ${tipoPlanLabel}

El guión debe:
- Empezar por "Hola ${cliente.nombre}"
- Dar la bienvenida a FitVideoAI de forma cercana y personal
- Mencionar el objetivo general del cliente, sin datos de una semana concreta
- NO mencionar comidas, calorías, rutinas de entrenamiento ni ninguna semana específica
- Sonar natural, como si ${nombreProfesional} lo estuviera grabando a cámara
- Acabar invitando a escribir ante cualquier duda
- NO mencionar que es generado por IA
`.trim();

  const message = await anthropic.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 256,
    messages: [{ role: "user", content: prompt }],
  });

  return message.content[0].type === "text" ? message.content[0].text.trim() : "";
}

export async function POST(request: Request) {
  try {
    const { cliente_id } = await request.json();

    if (!cliente_id) {
      return NextResponse.json({ error: "cliente_id requerido" }, { status: 400 });
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
      .select("id, nombre, heygen_addon, heygen_avatar_id, heygen_avatar_status")
      .eq("user_id", user.id)
      .single();

    if (profesionalError || !profesional) {
      return NextResponse.json({ error: "profesional_no_encontrado" }, { status: 400 });
    }

    if (!profesional.heygen_addon) {
      return NextResponse.json(
        { error: "El vídeo de bienvenida requiere el add-on de HeyGen." },
        { status: 403 }
      );
    }

    if (!profesional.heygen_avatar_id || profesional.heygen_avatar_status !== "ready") {
      return NextResponse.json(
        {
          error:
            "Tu avatar todavía no está listo. Completa el Paso 3 del onboarding antes de generar vídeos.",
        },
        { status: 403 }
      );
    }

    const { data: cliente, error: clienteError } = await supabase
      .from("clientes")
      .select("id, nombre, objetivo, tipo_plan, mensaje_bienvenida")
      .eq("id", cliente_id)
      .eq("profesional_id", profesional.id)
      .single();

    if (clienteError || !cliente) {
      return NextResponse.json({ error: "cliente_no_encontrado" }, { status: 404 });
    }

    // El vídeo de bienvenida es evergreen: usa su propio guión (generado una
    // sola vez), no el guión semanal, que cambia cada semana con el plan.
    let mensajeBienvenida = cliente.mensaje_bienvenida;

    if (!mensajeBienvenida) {
      mensajeBienvenida = await generarMensajeBienvenida(
        profesional.nombre || "tu profesional",
        cliente
      );

      if (!mensajeBienvenida) {
        return NextResponse.json(
          { error: "No se pudo generar el guión del vídeo de bienvenida" },
          { status: 500 }
        );
      }

      const { error: guardarMensajeError } = await supabase
        .from("clientes")
        .update({ mensaje_bienvenida: mensajeBienvenida })
        .eq("id", cliente_id)
        .eq("profesional_id", profesional.id);

      if (guardarMensajeError) {
        return NextResponse.json(
          { error: guardarMensajeError.message },
          { status: 500 }
        );
      }
    }

    // 1. Resolver el look entrenado (avatar_id que exige POST /v3/videos) a partir
    // del group id guardado en profesionales.heygen_avatar_id
    const looksRes = await fetch(
      `https://api.heygen.com/v3/avatars/looks?group_id=${profesional.heygen_avatar_id}&avatar_type=digital_twin`,
      { headers: { "X-Api-Key": process.env.HEYGEN_API_KEY! } }
    );
    const looksData = await looksRes.json();

    if (!looksRes.ok || looksData.error) {
      console.error("Error de HeyGen listando looks del avatar:", looksData);
      return NextResponse.json(
        { error: looksData.error?.message ?? "Error al consultar el avatar en HeyGen" },
        { status: 502 }
      );
    }

    const lookId: string | undefined = looksData.data?.[0]?.id;

    if (!lookId) {
      return NextResponse.json(
        { error: "No se encontró la variante entrenada del avatar en HeyGen" },
        { status: 502 }
      );
    }

    // 2. Crear el vídeo con el avatar real del profesional. Sin voice_id: HeyGen
    // usa la voz propia entrenada del avatar (clonada del mismo vídeo de origen).
    const heygenRes = await fetch("https://api.heygen.com/v3/videos", {
      method: "POST",
      headers: {
        "X-Api-Key": process.env.HEYGEN_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "avatar",
        avatar_id: lookId,
        script: mensajeBienvenida,
        resolution: "720p",
        background: { type: "color", value: "#1a1a2e" },
      }),
    });

    const heygenData = await heygenRes.json();

    if (!heygenRes.ok || heygenData.error) {
      console.error("Error de HeyGen generando el vídeo:", heygenData);
      return NextResponse.json(
        { error: heygenData.error?.message ?? "Error en HeyGen" },
        { status: 502 }
      );
    }

    const video_id: string = heygenData.data.video_id;

    const { error: updateError } = await supabase
      .from("clientes")
      .update({ video_id, video_status: "video_en_proceso" })
      .eq("id", cliente_id)
      .eq("profesional_id", profesional.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ video_id });
  } catch (error) {
    console.error("Error generando vídeo:", error);
    return NextResponse.json(
      { error: "Error al generar el vídeo" },
      { status: 500 }
    );
  }
}
