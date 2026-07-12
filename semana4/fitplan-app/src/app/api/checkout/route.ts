import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const PLANES = {
  pro: { nombre: "Plan Pro FitVideoAI", unitAmount: 6900 },
  studio: { nombre: "Plan Studio FitVideoAI", unitAmount: 12900 },
} as const;

export async function POST(request: Request) {
  const origin = request.headers.get("origin") || "http://localhost:3001";

  let plan: keyof typeof PLANES = "pro";
  try {
    const body = await request.json();
    if (body?.plan === "studio") plan = "studio";
  } catch {
    // sin body -> plan por defecto 'pro'
  }

  const { nombre, unitAmount } = PLANES[plan];

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: unitAmount,
          product_data: {
            name: nombre,
          },
        },
      },
    ],
    metadata: { plan },
    success_url: `${origin}/success`,
    cancel_url: `${origin}`,
  });

  return NextResponse.json({ url: session.url });
}
