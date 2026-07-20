import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const cliente_id = request.nextUrl.searchParams.get("cliente_id");
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
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (profesionalError || !profesional) {
      return NextResponse.json({ error: "profesional_no_encontrado" }, { status: 400 });
    }

    const { data: cliente, error } = await supabase
      .from("clientes")
      .select("video_id, video_status, video_url")
      .eq("id", cliente_id)
      .eq("profesional_id", profesional.id)
      .single();

    if (error || !cliente) throw new Error("Cliente no encontrado");
    if (!cliente.video_id) {
      return NextResponse.json({ video_status: "sin_video" });
    }

    // Si ya está en un estado final en BD, devolvemos directamente sin llamar a HeyGen
    if (cliente.video_status === "completado" && cliente.video_url) {
      return NextResponse.json({
        video_status: "completado",
        video_url: cliente.video_url,
      });
    }
    if (cliente.video_status === "failed") {
      return NextResponse.json({ video_status: "failed" });
    }

    const heygenRes = await fetch(
      `https://api.heygen.com/v3/videos/${cliente.video_id}`,
      { headers: { "X-Api-Key": process.env.HEYGEN_API_KEY! } }
    );

    const heygenData = await heygenRes.json();

    if (!heygenRes.ok) {
      console.error("Error consultando el vídeo en HeyGen:", heygenData);
      return NextResponse.json({ video_status: "video_en_proceso" });
    }

    const { status, video_url, failure_message } = heygenData.data ?? {};

    if (status === "completed" && video_url) {
      await supabase
        .from("clientes")
        .update({ video_url, video_status: "completado" })
        .eq("id", cliente_id)
        .eq("profesional_id", profesional.id);

      return NextResponse.json({ video_status: "completado", video_url });
    }

    if (status === "failed") {
      await supabase
        .from("clientes")
        .update({ video_status: "failed" })
        .eq("id", cliente_id)
        .eq("profesional_id", profesional.id);

      return NextResponse.json({ video_status: "failed", error: failure_message ?? null });
    }

    return NextResponse.json({ video_status: "video_en_proceso" });
  } catch (error) {
    console.error("Error consultando estado del vídeo:", error);
    return NextResponse.json(
      { error: "Error al consultar el estado" },
      { status: 500 }
    );
  }
}
