import { clamp } from "./format";
import { EVIDENCE, ISSUES, type Choice, type Market, type Reading } from "./types";

type Unknown = Record<string, unknown>;

export function questionsFor(market: Market): Record<string, unknown> {
  const [first, second] = market.outcomes;
  return {
    issue: {
      type: "choice",
      instructions: "Cette question de marché peut-elle se résoudre sans débat sur le libellé ?",
      criteria: {
        clear: "Deux résultats, une date ou une condition nette, une source de résolution",
        ambiguous: "Le libellé admet deux lectures, ou la date manque",
        unresolvable: "Personne ne pourra dire qui a gagné",
      },
    },
    yes: {
      type: "noul",
      instructions: `« ${first} » plutôt que « ${second} » se réalise-t-il ? Ignorer le prix de la foule et juger le fait ajouté.`,
    },
    evidence: {
      type: "choice",
      instructions: "Le fait ajouté, plus l'énoncé du marché, suffisent-ils à s'écarter du prix ?",
      criteria: {
        thin: "Aucun fait nouveau, ou une rumeur",
        mixed: "Un indice, pas une preuve",
        solid: "Un fait daté, vérifiable, qui tire d'un côté",
      },
    },
    worth: {
      type: "noul",
      instructions:
        "L'écart entre ce jugement et le prix de la foule vaut-il un papier de 100 € aujourd'hui, sans levier ?",
    },
  };
}

export function stateFor(market: Market, fact: string): Record<string, unknown> {
  return {
    question: market.question,
    outcomes: market.outcomes,
    crowd_price_first_outcome: market.price,
    end_date: market.endDate,
    added_fact: fact,
    source: market.source,
  };
}

export function parseReading(payload: unknown): Reading {
  const body = asRecord(payload);
  if (!body) throw new Error("Jev a renvoyé un corps vide.");
  const answers = asRecord(body.answers);
  if (!answers) throw new Error("Jev n'a renvoyé aucune réponse.");
  const usage = asRecord(body.usage);
  return {
    source: "jev",
    model: typeof body.model === "string" ? body.model : "jev-latest",
    issue: parseChoice(answers.issue, ISSUES),
    yes: parseNoul(answers.yes),
    evidence: parseChoice(answers.evidence, EVIDENCE),
    worth: parseNoul(answers.worth),
    inputTokens: usage && typeof usage.input_tokens === "number" ? usage.input_tokens : null,
  };
}

export async function readWithJev(market: Market, fact: string, apiKey: string): Promise<Reading> {
  const response = await fetch("https://api.typesafe.ai/v1/systemone", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "jev-latest",
      state: stateFor(market, fact),
      questions: questionsFor(market),
    }),
  });
  if (!response.ok) throw new Error(`Jev a répondu ${response.status}.`);
  return parseReading((await response.json()) as unknown);
}

function parseChoice<T extends string>(value: unknown, keys: readonly T[]): Choice<T> {
  const record = asRecord(value);
  const choice = record?.choice;
  const probabilities = asRecord(record?.probabilities);
  const confidence = record?.confidence;
  if (typeof choice !== "string" || !keys.includes(choice as T) || !probabilities) {
    throw new Error("Le choix Jev ne correspond à aucune option connue.");
  }
  const out = {} as Record<T, number>;
  for (const key of keys) {
    const n = probabilities[key];
    out[key] = typeof n === "number" && Number.isFinite(n) ? clamp(n, 0, 1) : 0;
  }
  return {
    choice: choice as T,
    probabilities: out,
    confidence: typeof confidence === "number" && Number.isFinite(confidence) ? clamp(confidence, 0, 1) : 0,
  };
}

function parseNoul(value: unknown) {
  const n = asRecord(value)?.noul;
  if (typeof n !== "number" || !Number.isFinite(n)) throw new Error("Le noul Jev est absent.");
  return clamp(n, 0, 1);
}

function asRecord(value: unknown): Unknown | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Unknown;
}
