import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { cliente_id, guion } = await request.json();

    const heygenRes = await fetch("https://api.heygen.com/v2/video/generate", {
      method: "POST",
      headers: {
        "X-Api-Key": process.env.HEYGEN_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        video_inputs: [
          {
            character: {
              type: "avatar",
              avatar_id: process.env.HEYGEN_AVATAR_ID!,
              avatar_style: "normal",
            },
            voice: {
              type: "text",
              input_text: guion,
              voice_id: process.env.HEYGEN_VOICE_ID!,
            },
            background: {
              type: "color",
              value: "#1a1a2e",
            },
          },
        ],
        dimension: { width: 1280, height: 720 },
      }),
    });

    const heygenData = await heygenRes.json();

    if (!heygenRes.ok || heygenData.error) {
      throw new Error(heygenData.error?.message ?? "Error en HeyGen");
    }

    const video_id: string = heygenData.data.video_id;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    const { error } = await supabase
      .from("clientes")
      .update({ video_id, video_status: "video_en_proceso" })
      .eq("id", cliente_id);

    if (error) throw new Error(error.message);

    return NextResponse.json({ video_id });
  } catch (error) {
    console.error("Error generando vídeo:", error);
    return NextResponse.json(
      { error: "Error al generar el vídeo" },
      { status: 500 }
    );
  }
}
