export const ISSUES = ["clear", "ambiguous", "unresolvable"] as const;
export const EVIDENCE = ["thin", "mixed", "solid"] as const;

export type Issue = (typeof ISSUES)[number];
export type Evidence = (typeof EVIDENCE)[number];
export type Side = "a" | "b" | "watch";

export type Choice<T extends string> = {
  choice: T;
  probabilities: Record<T, number>;
  confidence: number;
};

export type Market = {
  id: string;
  slug: string;
  question: string;
  outcomes: [string, string];
  price: number;
  volume24hr: number;
  endDate: string | null;
  source: "polymarket" | "sample";
};

export type Reading = {
  source: "jev" | "rehearsal";
  model: string | null;
  issue: Choice<Issue>;
  yes: number;
  evidence: Choice<Evidence>;
  worth: number;
  inputTokens: number | null;
};

export type Decision = {
  side: Side;
  edge: number;
  entry: number;
  reason: string;
};

export type Paper = {
  id: string;
  marketId: string;
  slug: string;
  question: string;
  outcome: string;
  side: "a" | "b";
  entry: number;
  stake: number;
  openedAt: string;
};

export const GATES = {
  issueConfidence: 0.55,
  minEdge: 0.08,
  minWorth: 0.55,
} as const;

export const STAKE = 100;

export const ISSUE_LABEL: Record<Issue, string> = {
  clear: "Nette",
  ambiguous: "Floue",
  unresolvable: "Irrésoluble",
};

export const EVIDENCE_LABEL: Record<Evidence, string> = {
  thin: "Mince",
  mixed: "Mitigé",
  solid: "Solide",
};
