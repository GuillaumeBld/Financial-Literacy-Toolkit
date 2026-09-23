import { clamp } from "./format";
import {
  BOOKS,
  LETTERS,
  RELATIONSHIP,
  URGENCY,
  type Book,
  type Choice,
  type Item,
  type LetterId,
  type RawReading,
  type Score,
} from "./types";

type Unknown = Record<string, unknown>;

export function questionsFor(): Record<string, unknown> {
  return {
    book: {
      type: "choice",
      instructions: "Which book should this item be filed under?",
      criteria: {
        income: "Money a client owes or is paying for work",
        expense: "A cost of doing the work",
        transfer: "Moving your own money between your own accounts",
        ignore: "Personal, a duplicate, or not a business item",
      },
    },
    letter: {
      type: "choice",
      instructions:
        "Which collection letter, if any, fits this item? Choose none unless it is money a client owes.",
      criteria: {
        gentle_nudge: "Open invoice, relationship still fine, a short reminder is enough",
        due_today: "Due within a few days",
        past_due_firm: "Meaningfully late, but the client has not refused",
        final_notice: "Long overdue, one last ask before you stop the work",
        write_off: "They refused, disputed, or said they will not pay",
        none: "Not money owed to you, or nothing should be sent",
      },
    },
    will_collect: {
      type: "noul",
      instructions:
        "If you follow up this week, will the income in this item actually arrive?",
    },
    worth_chase: {
      type: "noul",
      instructions:
        "Is a follow-up today worth the time, given the amount and the odds of payment?",
    },
    deductible: {
      type: "noul",
      instructions:
        "Is this a reasonable ordinary business cost a freelancer would keep, rather than a personal cost? Meals and mixed trips only partly qualify.",
    },
    urgency: {
      type: "score",
      instructions: "How soon does this item need a human decision?",
      criteria: [...URGENCY],
    },
    relationship: {
      type: "score",
      instructions: "How strained is the client relationship in this note?",
      criteria: [...RELATIONSHIP],
    },
  };
}

export function stateFor(item: Item): Record<string, unknown> {
  return {
    kind: item.kind,
    counterparty: item.counterparty,
    amount_usd: item.amount,
    issued_on: item.issuedOn,
    due_on: item.dueOn,
    as_of: item.asOf,
    note: item.text,
    source: item.source,
  };
}

export function parseReading(payload: unknown): RawReading {
  const body = asRecord(payload);
  if (!body) throw new Error("Jev returned an empty body.");
  const answers = asRecord(body.answers);
  if (!answers) throw new Error("Jev returned no answers.");
  const model = typeof body.model === "string" ? body.model : "jev-latest";
  const usage = asRecord(body.usage);
  const inputTokens =
    usage && typeof usage.input_tokens === "number" ? usage.input_tokens : null;

  return {
    source: "jev",
    model,
    book: parseChoice(answers.book, BOOKS),
    letter: parseChoice(answers.letter, LETTERS),
    willCollect: parseNoul(answers.will_collect),
    worthChase: parseNoul(answers.worth_chase),
    deductible: parseNoul(answers.deductible),
    urgency: parseScore(answers.urgency),
    relationship: parseScore(answers.relationship),
    inputTokens,
  };
}

function parseChoice<T extends string>(
  value: unknown,
  keys: readonly T[],
): Choice<T> {
  const record = asRecord(value);
  const choice = record?.choice;
  const probabilities = asRecord(record?.probabilities);
  const confidence = record?.confidence;
  if (typeof choice !== "string" || !keys.includes(choice as T) || !probabilities) {
    throw new Error("Jev choice was missing a known option.");
  }
  const out = {} as Record<T, number>;
  for (const key of keys) {
    const n = probabilities[key];
    out[key] = typeof n === "number" && Number.isFinite(n) ? clamp(n, 0, 1) : 0;
  }
  return {
    choice: choice as T,
    probabilities: out,
    confidence:
      typeof confidence === "number" && Number.isFinite(confidence)
        ? clamp(confidence, 0, 1)
        : 0,
  };
}

function parseNoul(value: unknown): number {
  const record = asRecord(value);
  const n = record?.noul;
  if (typeof n !== "number" || !Number.isFinite(n)) {
    throw new Error("Jev noul was missing.");
  }
  return clamp(n, 0, 1);
}

function parseScore(value: unknown): Score {
  const record = asRecord(value);
  const score = record?.score;
  const confidence = record?.confidence;
  if (typeof score !== "number" || !Number.isFinite(score)) {
    throw new Error("Jev score was missing.");
  }
  return {
    score,
    confidence:
      typeof confidence === "number" && Number.isFinite(confidence)
        ? clamp(confidence, 0, 1)
        : 0,
  };
}

function asRecord(value: unknown): Unknown | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Unknown;
}

export async function readWithJev(item: Item, apiKey: string): Promise<RawReading> {
  const response = await fetch("https://api.typesafe.ai/v1/systemone", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "jev-latest",
      state: stateFor(item),
      questions: questionsFor(),
    }),
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Jev responded ${response.status}.`);
  }
  return parseReading(JSON.parse(text) as unknown);
}
