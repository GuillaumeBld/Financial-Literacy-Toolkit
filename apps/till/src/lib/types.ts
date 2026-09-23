export const BOOKS = ["income", "expense", "transfer", "ignore"] as const;
export const LETTERS = [
  "gentle_nudge",
  "due_today",
  "past_due_firm",
  "final_notice",
  "write_off",
  "none",
] as const;

export type Book = (typeof BOOKS)[number];
export type LetterId = (typeof LETTERS)[number];
export type Kind = "invoice" | "receipt" | "note";
export type Action = "chase" | "file" | "review" | "drop";
export type Source = "manual" | "receipt-ocr" | "midday" | "sample";

export type Choice<T extends string> = {
  choice: T;
  probabilities: Record<T, number>;
  confidence: number;
};

export type Score = {
  score: number;
  confidence: number;
};

export type Item = {
  id: string;
  kind: Kind;
  counterparty: string;
  amount: number;
  issuedOn: string;
  dueOn: string | null;
  text: string;
  source: Source;
  asOf: string;
};

export type RawReading = {
  source: "jev" | "rehearsal";
  model: string | null;
  book: Choice<Book>;
  letter: Choice<LetterId>;
  willCollect: number;
  worthChase: number;
  deductible: number;
  urgency: Score;
  relationship: Score;
  inputTokens: number | null;
};

export type Interpreted = {
  item: Item;
  raw: RawReading;
  action: Action;
  letter: LetterId;
  expectedCash: number;
  upside: number;
  kept: number;
  taxRate: number;
  explanation: string;
};

export const URGENCY = [
  "Nothing happens if you wait a week",
  "Worth handling this week",
  "Money or a relationship moves in a day or two",
  "Late, refused, or about to be lost",
] as const;

export const RELATIONSHIP = [
  "Ordinary commercial tone",
  "Cooling off or delaying",
  "Strained, excuses stacking up",
  "Hostile, refused, or threatening",
] as const;

export const SAMPLE_TODAY = "2026-09-23";

export const GATES = {
  bookConfidence: 0.55,
  letterConfidence: 0.55,
  chaseWorth: 0.5,
  chaseCollect: 0.35,
  deductLow: 0.35,
  deductHigh: 0.72,
} as const;
