import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  const origin = request.headers.get("origin") || "http://localhost:3001";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: 4900,
          product_data: {
            name: "Plan Pro FitVideoAI",
          },
        },
      },
    ],
    success_url: `${origin}/success`,
    cancel_url: `${origin}`,
  });

  return NextResponse.json({ url: session.url });
}
