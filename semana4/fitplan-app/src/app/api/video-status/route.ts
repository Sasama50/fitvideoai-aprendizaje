import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const cliente_id = request.nextUrl.searchParams.get("cliente_id");
    if (!cliente_id) {
      return NextResponse.json({ error: "cliente_id requerido" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    const { data: cliente, error } = await supabase
      .from("clientes")
      .select("video_id, video_status, video_url")
      .eq("id", cliente_id)
      .single();

    if (error || !cliente) throw new Error("Cliente no encontrado");
    if (!cliente.video_id) {
      return NextResponse.json({ video_status: "sin_video" });
    }

    // Si ya está completado en BD, devolvemos directamente sin llamar a HeyGen
    if (cliente.video_status === "completado" && cliente.video_url) {
      return NextResponse.json({
        video_status: "completado",
        video_url: cliente.video_url,
      });
    }

    // Consultamos el estado en HeyGen
    const heygenRes = await fetch(
      `https://api.heygen.com/v1/video_status.get?video_id=${cliente.video_id}`,
      { headers: { "X-Api-Key": process.env.HEYGEN_API_KEY! } }
    );

    const heygenData = await heygenRes.json();
    const { status, video_url } = heygenData.data ?? {};

    if (status === "completed" && video_url) {
      await supabase
        .from("clientes")
        .update({ video_url, video_status: "completado" })
        .eq("id", cliente_id);

      return NextResponse.json({ video_status: "completado", video_url });
    }

    return NextResponse.json({ video_status: status ?? "video_en_proceso" });
  } catch (error) {
    console.error("Error consultando estado del vídeo:", error);
    return NextResponse.json(
      { error: "Error al consultar el estado" },
      { status: 500 }
    );
  }
}
