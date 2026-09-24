import { NextResponse } from "next/server";
import { SAMPLES, marketsFromGamma } from "@/lib/markets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const response = await fetch(
      "https://gamma-api.polymarket.com/markets?closed=false&active=true&limit=40&order=volume24hr&ascending=false",
      {
        headers: { Accept: "application/json", "User-Agent": "lisiere/0.1" },
        cache: "no-store",
      },
    );
    if (!response.ok) throw new Error(String(response.status));
    const markets = marketsFromGamma((await response.json()) as unknown);
    if (markets.length === 0) throw new Error("empty");
    return NextResponse.json({ source: "polymarket", markets });
  } catch {
    return NextResponse.json({ source: "sample", markets: SAMPLES });
  }
}
