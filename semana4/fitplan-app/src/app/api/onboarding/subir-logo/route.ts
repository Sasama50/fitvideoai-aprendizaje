import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const logo = formData.get("logo");

    if (!(logo instanceof File)) {
      return NextResponse.json({ error: "El archivo del logo es requerido" }, { status: 400 });
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

    const path = `${user.id}-${Date.now()}-${logo.name}`;
    const buffer = await logo.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from("logos")
      .upload(path, new Uint8Array(buffer), {
        contentType: logo.type || "application/octet-stream",
        upsert: true,
      });

    if (uploadError) {
      console.error("Error al subir el logo a Supabase Storage:", uploadError);
      return NextResponse.json(
        { error: `Error al subir el logo: ${uploadError.message}` },
        { status: 500 }
      );
    }

    const { data: urlData } = supabase.storage.from("logos").getPublicUrl(path);

    return NextResponse.json({ success: true, logo_url: urlData.publicUrl });
  } catch (err) {
    console.error("Error inesperado en /api/onboarding/subir-logo:", err);
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
