import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

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
      .select("id, heygen_addon, heygen_avatar_id, heygen_avatar_status")
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
      .select("id, guion")
      .eq("id", cliente_id)
      .eq("profesional_id", profesional.id)
      .single();

    if (clienteError || !cliente) {
      return NextResponse.json({ error: "cliente_no_encontrado" }, { status: 404 });
    }

    if (!cliente.guion) {
      return NextResponse.json(
        { error: "Genera el guión primero antes de crear el vídeo" },
        { status: 400 }
      );
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
        script: cliente.guion,
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
