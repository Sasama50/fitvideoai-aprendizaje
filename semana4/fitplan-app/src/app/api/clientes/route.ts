import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const LIMITES_PLAN: Record<string, number> = {
  pro: 20,
  studio: 50,
};

export async function POST(req: NextRequest) {
  try {
    const {
      nombre,
      email,
      objetivo,
      restricciones,
      restricciones_dieta,
      ingredientes_no_deseados,
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
      .select("id, plan")
      .eq("user_id", user.id)
      .single();

    if (profesionalError || !profesional) {
      return NextResponse.json(
        { error: "profesional_no_encontrado" },
        { status: 400 }
      );
    }

    if (!profesional.plan || !(profesional.plan in LIMITES_PLAN)) {
      return NextResponse.json(
        { error: "sin_plan_activo" },
        { status: 403 }
      );
    }

    const limite = LIMITES_PLAN[profesional.plan];

    const { count, error: countError } = await supabase
      .from("clientes")
      .select("id", { count: "exact", head: true })
      .eq("profesional_id", profesional.id);

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    if ((count ?? 0) >= limite) {
      return NextResponse.json(
        {
          error: "limite_alcanzado",
          plan: profesional.plan,
          limite,
        },
        { status: 403 }
      );
    }

    const { data: cliente, error: insertError } = await supabase
      .from("clientes")
      .insert({
        nombre,
        email,
        objetivo,
        restricciones,
        restricciones_dieta,
        ingredientes_no_deseados,
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
        profesional_id: profesional.id,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ cliente });
  } catch (err) {
    console.error("Error en /api/clientes:", err);
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
