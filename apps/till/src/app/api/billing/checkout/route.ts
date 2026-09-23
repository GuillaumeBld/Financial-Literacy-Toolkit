import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const price = process.env.STRIPE_PRICE_DESK;
  if (!secret || !price) {
    return NextResponse.json(
      {
        error:
          "Le paiement a besoin de STRIPE_SECRET_KEY et STRIPE_PRICE_DESK sur le serveur. Le bureau fonctionne sans.",
      },
      { status: 501 },
    );
  }

  const origin = new URL(request.url).origin;
  const body = new URLSearchParams({
    mode: "subscription",
    "line_items[0][price]": price,
    "line_items[0][quantity]": "1",
    success_url: `${origin}/desk?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/#pricing`,
    allow_promotion_codes: "true",
  });

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const payload = (await response.json()) as { url?: string; error?: { message?: string } };
  if (!response.ok || !payload.url) {
    return NextResponse.json(
      { error: payload.error?.message || "Stripe n'a pas ouvert de session de paiement." },
      { status: 502 },
    );
  }
  return NextResponse.json({ url: payload.url });
}
