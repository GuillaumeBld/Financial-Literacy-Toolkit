import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE, deskCookieValid } from "@/lib/billing";
import { readWithJev } from "@/lib/jev";
import { rehearse } from "@/lib/rehearsal";
import type { Item } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as { item?: Item; live?: boolean };
  const item = body.item;
  if (!item || !item.counterparty || !Number.isFinite(item.amount) || item.amount <= 0) {
    return NextResponse.json({ error: "Add a counterparty and an amount." }, { status: 400 });
  }

  const entitled = deskCookieValid(cookies().get(COOKIE)?.value);
  if (body.live && !entitled) {
    return NextResponse.json(
      {
        upgrade: true,
        raw: rehearse(item),
        notice: "Desk is $19 a month. It runs this same item on Jev.",
      },
      { status: 402 },
    );
  }

  const apiKey = process.env.TYPESAFE_API_KEY;
  if (!body.live || !apiKey) {
    return NextResponse.json({
      upgrade: false,
      raw: rehearse(item),
      notice: body.live
        ? "Desk is on, and the server has no TYPESAFE_API_KEY yet, so this reading stayed local."
        : null,
    });
  }

  try {
    const raw = await readWithJev(item, apiKey);
    return NextResponse.json({ upgrade: false, raw, notice: null });
  } catch {
    return NextResponse.json({
      upgrade: false,
      raw: rehearse(item),
      notice: "Jev did not answer. Till kept the local reading.",
    });
  }
}
