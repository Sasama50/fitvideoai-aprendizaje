import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";

export async function PATCH(request: Request) {
  try {
    const { clienteId, guion } = await request.json();

    if (!clienteId || typeof guion !== "string") {
      return NextResponse.json(
        { error: "clienteId y guion son requeridos" },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: "profesional_no_encontrado" },
        { status: 400 }
      );
    }

    const { data: cliente, error: fetchError } = await supabase
      .from("clientes")
      .select("id")
      .eq("id", clienteId)
      .eq("profesional_id", profesional.id)
      .single();

    if (fetchError || !cliente) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }

    const { error: updateError } = await supabase
      .from("clientes")
      .update({ guion })
      .eq("id", clienteId)
      .eq("profesional_id", profesional.id);

    if (updateError) throw new Error(updateError.message);

    return NextResponse.json({ guion });
  } catch (error) {
    console.error("Error actualizando guión:", error);
    return NextResponse.json(
      { error: "Error al guardar el guión" },
      { status: 500 }
    );
  }
}
