import { createHmac, timingSafeEqual } from "crypto";

export const COOKIE = "till_desk";
const THIRTY_TWO_DAYS = 60 * 60 * 24 * 32;

export function signingSecret(): string | null {
  return process.env.TILL_COOKIE_SECRET || process.env.STRIPE_SECRET_KEY || null;
}

export function ownerOpen(): boolean {
  return process.env.TILL_OPEN === "1";
}

export function signDesk(now = Date.now()): string {
  const secret = signingSecret();
  if (!secret) throw new Error("Set TILL_COOKIE_SECRET or STRIPE_SECRET_KEY before selling Desk.");
  const exp = now + THIRTY_TWO_DAYS * 1000;
  const body = Buffer.from(JSON.stringify({ plan: "desk", exp })).toString("base64url");
  const sig = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function deskCookieValid(token: string | undefined, now = Date.now()): boolean {
  if (ownerOpen()) return true;
  if (!token) return false;
  const secret = signingSecret();
  if (!secret) return false;
  const [body, sig] = token.split(".");
  if (!body || !sig) return false;
  const expected = createHmac("sha256", secret).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as {
      plan?: string;
      exp?: number;
    };
    return parsed.plan === "desk" && typeof parsed.exp === "number" && parsed.exp > now;
  } catch {
    return false;
  }
}

export function verifyStripeSignature(
  payload: string,
  header: string | null,
  secret: string,
  now = Math.floor(Date.now() / 1000),
): boolean {
  if (!header) return false;
  const parts = Object.fromEntries(
    header.split(",").map((piece) => {
      const [key, value] = piece.split("=");
      return [key, value];
    }),
  );
  const timestamp = Number(parts.t);
  const signature = parts.v1;
  if (!timestamp || !signature) return false;
  if (Math.abs(now - timestamp) > 300) return false;
  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`)
    .digest("hex");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
