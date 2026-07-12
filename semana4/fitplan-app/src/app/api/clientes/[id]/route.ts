import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const {
      nombre,
      objetivo,
      restricciones,
      tipo_plan,
      preferencias_alimentarias,
      nivel_experiencia,
      equipamiento_disponible,
      historial_lesiones,
      edad,
      peso_kg,
      altura_cm,
      sexo_biologico,
      nivel_actividad,
      metodo_calculo,
      objetivo_calorico_manual,
    } = await req.json();

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

    const { data: cliente, error: updateError } = await supabase
      .from("clientes")
      .update({
        nombre,
        objetivo,
        restricciones,
        tipo_plan,
        preferencias_alimentarias,
        nivel_experiencia,
        equipamiento_disponible,
        historial_lesiones,
        edad,
        peso_kg,
        altura_cm,
        sexo_biologico,
        nivel_actividad,
        metodo_calculo,
        objetivo_calorico_manual,
      })
      .eq("id", id)
      .eq("profesional_id", profesional.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    if (!cliente) {
      return NextResponse.json({ error: "cliente_no_encontrado" }, { status: 404 });
    }

    return NextResponse.json({ cliente });
  } catch (err) {
    console.error("Error en PATCH /api/clientes/[id]:", err);
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
