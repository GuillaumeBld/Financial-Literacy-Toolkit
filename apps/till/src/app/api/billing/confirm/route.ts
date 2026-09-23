import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE, signDesk } from "@/lib/billing";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 501 });
  }
  const body = (await request.json()) as { sessionId?: string };
  const sessionId = body.sessionId;
  if (!sessionId || !sessionId.startsWith("cs_")) {
    return NextResponse.json({ error: "Missing checkout session." }, { status: 400 });
  }

  const response = await fetch(
    `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
    { headers: { Authorization: `Bearer ${secret}` } },
  );
  const session = (await response.json()) as {
    payment_status?: string;
    status?: string;
    mode?: string;
  };
  const paid =
    response.ok &&
    (session.payment_status === "paid" || session.status === "complete");
  if (!paid) {
    return NextResponse.json({ error: "That checkout is not paid yet." }, { status: 402 });
  }

  cookies().set(COOKIE, signDesk(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 32,
  });
  return NextResponse.json({ plan: "desk" });
}
