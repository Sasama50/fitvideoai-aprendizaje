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
    const plan = session.metadata?.plan === "studio" ? "studio" : "pro";
    const heygenAddon = session.metadata?.heygen_addon === "true";

    console.log("checkout.session.completed:", { sessionId, email, plan, heygenAddon });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    await supabase.from("pagos").insert({
      email,
      session_id: sessionId,
      plan,
      activo: true,
    });

    if (email) {
      const { data: actualizados, error: updateError } = await supabase
        .from("profesionales")
        .update({ plan, heygen_addon: heygenAddon })
        .eq("email", email)
        .select("id");

      if (updateError) {
        console.error("Error al actualizar el plan del profesional:", updateError);
      } else if (!actualizados || actualizados.length === 0) {
        const { data: usersPage, error: listError } = await supabase.auth.admin.listUsers();

        if (listError) {
          console.error("Error al buscar el usuario por email:", listError);
        } else {
          const authUser = usersPage.users.find((u) => u.email === email);

          if (authUser) {
            const { error: upsertError } = await supabase
              .from("profesionales")
              .upsert(
                { user_id: authUser.id, email, plan, heygen_addon: heygenAddon },
                { onConflict: "user_id" }
              );

            if (upsertError) {
              console.error("Error al crear el profesional con el plan pagado:", upsertError);
            }
          } else {
            console.error("No se encontró profesional ni usuario para el email:", email);
          }
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
