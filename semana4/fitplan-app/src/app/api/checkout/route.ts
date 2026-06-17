import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST() {
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
    success_url: "http://localhost:3001/success",
    cancel_url: "http://localhost:3001",
  });

  return NextResponse.json({ url: session.url });
}
