import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const sessionId = session.id;
    const email = session.customer_details?.email ?? session.customer_email;
    const userId = session.metadata?.user_id;
    const plan = session.metadata?.plan === "studio" ? "studio" : "pro";
    const heygenAddon = session.metadata?.heygen_addon === "true";

    console.log("checkout.session.completed:", { sessionId, email, userId, plan, heygenAddon });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    let profesionalId: string | null = null;

    if (userId) {
      // Camino robusto: la sesión de checkout se creó con el usuario ya
      // autenticado, así que el vínculo no depende de que el email escrito
      // en Stripe coincida con el de la cuenta.
      const { data: profesional, error: upsertError } = await supabase
        .from("profesionales")
        .upsert(
          { user_id: userId, email, plan, heygen_addon: heygenAddon },
          { onConflict: "user_id" }
        )
        .select("id")
        .single();

      if (upsertError) {
        console.error("Error al activar el plan del profesional (por user_id):", upsertError);
      } else {
        profesionalId = profesional.id;
      }
    } else if (email) {
      // Camino de compatibilidad para sesiones creadas antes de que el
      // checkout exigiera autenticación (sin user_id en metadata).
      const { data: actualizados, error: updateError } = await supabase
        .from("profesionales")
        .update({ plan, heygen_addon: heygenAddon })
        .eq("email", email)
        .select("id");

      if (updateError) {
        console.error("Error al actualizar el plan del profesional:", updateError);
      } else if (actualizados && actualizados.length > 0) {
        profesionalId = actualizados[0].id;
      } else {
        const { data: usersPage, error: listError } = await supabase.auth.admin.listUsers();

        if (listError) {
          console.error("Error al buscar el usuario por email:", listError);
        } else {
          const authUser = usersPage.users.find((u) => u.email === email);

          if (authUser) {
            const { data: profesional, error: createError } = await supabase
              .from("profesionales")
              .upsert(
                { user_id: authUser.id, email, plan, heygen_addon: heygenAddon },
                { onConflict: "user_id" }
              )
              .select("id")
              .single();

            if (createError) {
              console.error("Error al crear el profesional con el plan pagado:", createError);
            } else {
              profesionalId = profesional.id;
            }
          } else {
            console.error("No se encontró profesional ni usuario para el email:", email);
          }
        }
      }
    }

    await supabase.from("pagos").insert({
      email,
      session_id: sessionId,
      plan,
      activo: true,
      profesional_id: profesionalId,
    });
  }

  return NextResponse.json({ received: true });
}
