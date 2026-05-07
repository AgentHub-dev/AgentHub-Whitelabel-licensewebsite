import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRICE_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3200";

  if (!secretKey || !priceId) {
    return NextResponse.json(
      { error: "Stripe ist noch nicht konfiguriert. Bitte kontaktiere uns direkt." },
      { status: 503 }
    );
  }

  const stripe = new Stripe(secretKey, { apiVersion: "2024-04-10" });

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/#preise`,
      allow_promotion_codes: true,
      billing_address_collection: "required",
      locale: "de",
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json({ error: "Checkout fehlgeschlagen." }, { status: 500 });
  }
}
