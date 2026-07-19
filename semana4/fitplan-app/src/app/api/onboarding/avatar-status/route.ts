import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  try {
    const refrescarConsentimiento =
      req.nextUrl.searchParams.get("refrescar_consentimiento") === "1";

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
      .select("heygen_avatar_id, heygen_avatar_status")
      .eq("user_id", user.id)
      .single();

    if (profesionalError || !profesional) {
      return NextResponse.json({ error: "profesional_no_encontrado" }, { status: 400 });
    }

    if (!profesional.heygen_avatar_id) {
      return NextResponse.json({ heygen_avatar_status: null });
    }

    // Si ya está en un estado final en BD, no hace falta volver a consultar a HeyGen
    if (
      profesional.heygen_avatar_status === "ready" ||
      profesional.heygen_avatar_status === "failed"
    ) {
      return NextResponse.json({ heygen_avatar_status: profesional.heygen_avatar_status });
    }

    const heygenRes = await fetch(
      `https://api.heygen.com/v3/avatars/${profesional.heygen_avatar_id}`,
      { headers: { "X-Api-Key": process.env.HEYGEN_API_KEY! } }
    );
    const heygenData = await heygenRes.json();

    if (!heygenRes.ok) {
      console.error("Error consultando el avatar en HeyGen:", heygenData);
      return NextResponse.json({ heygen_avatar_status: "processing" });
    }

    const grupo = heygenData.data;
    const estadoHeygen: string | null = grupo?.status ?? null;

    let nuevoEstado: "processing" | "ready" | "failed" = "processing";
    if (estadoHeygen === "completed") nuevoEstado = "ready";
    else if (estadoHeygen === "failed") nuevoEstado = "failed";

    if (nuevoEstado !== profesional.heygen_avatar_status) {
      await supabase
        .from("profesionales")
        .update({ heygen_avatar_status: nuevoEstado })
        .eq("user_id", user.id);
    }

    // El enlace de consentimiento no se guarda en BD (HeyGen no lo persiste
    // entre llamadas), así que solo lo volvemos a pedir cuando el wizard lo
    // solicita explícitamente (p. ej. tras recargar la página y perder el enlace).
    let consentUrl: string | null = null;
    if (
      refrescarConsentimiento &&
      nuevoEstado === "processing" &&
      grupo?.consent_status !== "approved"
    ) {
      try {
        const consentRes = await fetch(
          `https://api.heygen.com/v3/avatars/${profesional.heygen_avatar_id}/consent`,
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
        if (consentRes.ok) consentUrl = consentData.data?.url ?? null;
      } catch (err) {
        console.error("Error reabriendo el consentimiento en HeyGen:", err);
      }
    }

    return NextResponse.json({
      heygen_avatar_status: nuevoEstado,
      consent_status: grupo?.consent_status ?? null,
      consent_url: consentUrl,
      error_detalle: grupo?.error?.message ?? null,
    });
  } catch (err) {
    console.error("Error en /api/onboarding/avatar-status:", err);
    return NextResponse.json({ error: "Error al consultar el estado" }, { status: 500 });
  }
}
