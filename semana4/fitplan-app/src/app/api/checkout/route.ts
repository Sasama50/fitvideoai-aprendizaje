import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const PLANES = {
  pro: { nombre: "Plan Pro FitVideoAI", base: 6900, conHeygen: 10400 },
  studio: { nombre: "Plan Studio FitVideoAI", base: 12900, conHeygen: 18800 },
} as const;

export async function POST(request: Request) {
  const origin = request.headers.get("origin") || "http://localhost:3001";

  const supabaseAuth = createServerClient();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "no_autenticado" }, { status: 401 });
  }

  let plan: keyof typeof PLANES = "pro";
  let heygenAddon = false;
  try {
    const body = await request.json();
    if (body?.plan === "studio") plan = "studio";
    if (body?.heygen_addon === true) heygenAddon = true;
  } catch {
    // sin body -> plan por defecto 'pro' sin add-on
  }

  const { nombre, base, conHeygen } = PLANES[plan];
  const unitAmount = heygenAddon ? conHeygen : base;
  const nombreProducto = heygenAddon ? `${nombre} + HeyGen` : nombre;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: unitAmount,
          product_data: {
            name: nombreProducto,
          },
        },
      },
    ],
    customer_email: user.email,
    metadata: {
      plan,
      heygen_addon: heygenAddon ? "true" : "false",
      user_id: user.id,
    },
    success_url: `${origin}/success`,
    cancel_url: `${origin}`,
  });

  return NextResponse.json({ url: session.url });
}
