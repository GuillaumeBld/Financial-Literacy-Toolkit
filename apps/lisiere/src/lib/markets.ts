import { clamp } from "./format";
import type { Market } from "./types";

export const SAMPLES: Market[] = [
  {
    id: "sample-fed",
    slug: "sample-fed-octobre-2026",
    question: "La Fed laisse les taux inchangés après la réunion d'octobre 2026 ?",
    outcomes: ["Oui", "Non"],
    price: 0.34,
    volume24hr: 0,
    endDate: "2026-10-31",
    source: "sample",
  },
  {
    id: "sample-btc",
    slug: "sample-bitcoin-87500",
    question: "Le bitcoin touche 87 500 $ en septembre ?",
    outcomes: ["Oui", "Non"],
    price: 0.4,
    volume24hr: 0,
    endDate: "2026-09-30",
    source: "sample",
  },
  {
    id: "sample-hormuz",
    slug: "sample-ormuz",
    question: "Le détroit d'Ormuz retrouve un trafic normal avant le 31 décembre ?",
    outcomes: ["Oui", "Non"],
    price: 0.2,
    volume24hr: 0,
    endDate: "2026-12-31",
    source: "sample",
  },
  {
    id: "sample-lula",
    slug: "sample-lula-2026",
    question: "Lula remporte la présidentielle brésilienne de 2026 ?",
    outcomes: ["Oui", "Non"],
    price: 0.41,
    volume24hr: 0,
    endDate: "2026-10-31",
    source: "sample",
  },
];

type Unknown = Record<string, unknown>;

export function marketFromGamma(value: unknown): Market | null {
  const row = asRecord(value);
  if (!row) return null;
  if (row.active === false || row.closed === true) return null;
  const id = asString(row.id);
  const slug = asString(row.slug);
  const question = asString(row.question);
  if (!id || !slug || !question) return null;
  const outcomes = asPair(row.outcomes);
  const pricePair = asPair(row.outcomePrices);
  const prices = pricePair ? pricePair.map(Number) : [];
  if (!outcomes || prices.length !== 2 || prices.some((n) => !Number.isFinite(n))) return null;
  const price = clamp(prices[0], 0, 1);
  if (price < 0.12 || price > 0.88) return null;
  const volume = Number(row.volume24hr);
  return {
    id,
    slug,
    question,
    outcomes,
    price,
    volume24hr: Number.isFinite(volume) ? volume : 0,
    endDate: asString(row.endDate),
    source: "polymarket",
  };
}

export function marketsFromGamma(payload: unknown): Market[] {
  if (!Array.isArray(payload)) return [];
  return payload
    .map(marketFromGamma)
    .filter((market): market is Market => market !== null)
    .sort((a, b) => {
      const ay = /^(yes|oui)$/i.test(a.outcomes[0]) ? 0 : 1;
      const by = /^(yes|oui)$/i.test(b.outcomes[0]) ? 0 : 1;
      if (ay !== by) return ay - by;
      return b.volume24hr - a.volume24hr;
    })
    .slice(0, 10);
}

function asPair(value: unknown): [string, string] | null {
  const parsed = typeof value === "string" ? safeJson(value) : value;
  if (!Array.isArray(parsed) || parsed.length !== 2) return null;
  const a = parsed[0];
  const b = parsed[1];
  if (typeof a !== "string" || typeof b !== "string") return null;
  return [a, b];
}

function safeJson(value: string): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function asRecord(value: unknown): Unknown | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Unknown;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}
