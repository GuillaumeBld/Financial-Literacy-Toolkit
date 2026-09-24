import { NextResponse } from "next/server";
import { readWithJev } from "@/lib/jev";
import { rehearse } from "@/lib/rehearsal";
import type { Market } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as { market?: Market; fact?: string; live?: boolean };
  const market = body.market;
  if (!market || !market.question || !Array.isArray(market.outcomes) || !Number.isFinite(market.price)) {
    return NextResponse.json({ error: "Il manque le marché." }, { status: 400 });
  }
  const fact = typeof body.fact === "string" ? body.fact.slice(0, 600) : "";
  const apiKey = process.env.TYPESAFE_API_KEY;
  if (!body.live || !apiKey) {
    return NextResponse.json({
      raw: rehearse(market, fact),
      notice: body.live ? "Pas de TYPESAFE_API_KEY sur le serveur. La lecture reste locale." : null,
    });
  }
  try {
    const raw = await readWithJev(market, fact, apiKey);
    return NextResponse.json({ raw, notice: null });
  } catch {
    return NextResponse.json({
      raw: rehearse(market, fact),
      notice: "Jev n'a pas répondu. La lecture locale prend le relais.",
    });
  }
}
