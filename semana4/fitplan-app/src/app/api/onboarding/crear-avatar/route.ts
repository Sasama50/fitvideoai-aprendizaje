import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const { video_url } = await req.json();

    if (typeof video_url !== "string" || !video_url) {
      return NextResponse.json({ error: "video_url es requerido" }, { status: 400 });
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
      .select("id, nombre, email, plan")
      .eq("user_id", user.id)
      .single();

    if (profesionalError || !profesional) {
      return NextResponse.json({ error: "profesional_no_encontrado" }, { status: 400 });
    }

    if (profesional.plan !== "studio") {
      return NextResponse.json(
        { error: "El avatar de vídeo solo está disponible en el plan Studio." },
        { status: 403 }
      );
    }

    // 1. Crear el avatar (digital twin) en HeyGen a partir del vídeo de entrenamiento
    const nombreAvatar = profesional.nombre || profesional.email || user.id;

    const heygenRes = await fetch("https://api.heygen.com/v3/avatars", {
      method: "POST",
      headers: {
        "X-Api-Key": process.env.HEYGEN_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "digital_twin",
        name: nombreAvatar,
        file: { type: "url", url: video_url },
      }),
    });

    const heygenData = await heygenRes.json();

    if (!heygenRes.ok || heygenData.error) {
      console.error("Error de HeyGen creando el avatar:", heygenData);
      return NextResponse.json(
        { error: heygenData.error?.message || "Error al crear el avatar en HeyGen" },
        { status: 502 }
      );
    }

    const avatarGroupId: string | undefined = heygenData.data?.avatar_group?.id;

    if (!avatarGroupId) {
      console.error("Respuesta inesperada de HeyGen al crear el avatar:", heygenData);
      return NextResponse.json(
        { error: "HeyGen no devolvió un identificador de avatar" },
        { status: 502 }
      );
    }

    // 2. Iniciar el flujo de consentimiento (grabación por webcam): un avatar
    // clonado de una persona real no puede entrenarse hasta que HeyGen tenga
    // constancia de que esa persona dio su permiso.
    let consentUrl: string | null = null;
    try {
      const consentRes = await fetch(
        `https://api.heygen.com/v3/avatars/${avatarGroupId}/consent`,
        {
          method: "POST",
          headers: {
            "X-Api-Key": process.env.HEYGEN_API_KEY!,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        }
      );
      const consentData = await consentRes.json();
      if (consentRes.ok) {
        consentUrl = consentData.data?.url ?? null;
      } else {
        console.error("Error de HeyGen iniciando el consentimiento:", consentData);
      }
    } catch (err) {
      console.error("Error inesperado iniciando el consentimiento en HeyGen:", err);
    }

    // 3. Guardar el resultado en el profesional
    const { error: updateError } = await supabase
      .from("profesionales")
      .update({ heygen_avatar_id: avatarGroupId, heygen_avatar_status: "processing" })
      .eq("user_id", user.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      heygen_avatar_id: avatarGroupId,
      heygen_avatar_status: "processing",
      consent_url: consentUrl,
    });
  } catch (err) {
    console.error("Error inesperado en /api/onboarding/crear-avatar:", err);
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
