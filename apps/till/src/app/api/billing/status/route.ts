import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE, deskCookieValid, ownerOpen } from "@/lib/billing";

export const runtime = "nodejs";

export function GET() {
  const token = cookies().get(COOKIE)?.value;
  const desk = deskCookieValid(token);
  return NextResponse.json({
    plan: desk ? "desk" : "solo",
    jev: Boolean(process.env.TYPESAFE_API_KEY),
    open: ownerOpen(),
  });
}
