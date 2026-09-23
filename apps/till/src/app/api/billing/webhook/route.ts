import { NextResponse } from "next/server";
import { verifyStripeSignature } from "@/lib/billing";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Définissez STRIPE_WEBHOOK_SECRET pour accepter les événements Stripe." },
      { status: 501 },
    );
  }
  const payload = await request.text();
  const valid = verifyStripeSignature(
    payload,
    request.headers.get("stripe-signature"),
    secret,
  );
  if (!valid) {
    return NextResponse.json({ error: "Signature Stripe invalide." }, { status: 400 });
  }
  let eventType = "unknown";
  try {
    const event = JSON.parse(payload) as { type?: string };
    eventType = event.type ?? "unknown";
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }
  return NextResponse.json({ received: true, type: eventType });
}
