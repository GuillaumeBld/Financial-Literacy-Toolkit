import { clamp } from "./format";
import type { Evidence, Issue, Market, Reading } from "./types";

const FOR_FIRST = /dans le sens du premier|va pour le premier|supports the first/;
const AGAINST_FIRST = /contre le premier|against the first|va contre/;
const FOG = /ambigu|pas clair|deux lectures|floue|unresolv|irrésoluble/;

export function rehearse(market: Market, fact: string): Reading {
  const text = fact.toLowerCase();
  let shift = 0;
  let evidence: Evidence = text.trim().length < 8 ? "thin" : "mixed";
  let issue: Issue = "clear";

  if (/rien de neuf|rien de nouveau|nothing new/.test(text)) evidence = "thin";
  if (FOG.test(text)) {
    issue = "ambiguous";
    evidence = "thin";
  }
  if (FOR_FIRST.test(text)) {
    shift += 0.22;
    evidence = "solid";
  }
  if (AGAINST_FIRST.test(text)) {
    shift -= 0.22;
    evidence = "solid";
  }
  if (/hausse|gagné|gagne|confirmé|confirmed/.test(text)) shift += 0.08;
  if (/baisse|perd|annul/.test(text)) shift -= 0.08;

  const yes = clamp(market.price + shift, 0.04, 0.96);
  const edge = Math.abs(yes - market.price);
  const worth =
    evidence === "thin" || issue !== "clear"
      ? 0.18
      : evidence === "solid" && edge >= 0.12
        ? Math.max(0.8, clamp(edge / 0.28, 0, 1))
        : clamp(edge / 0.28, 0, 1);

  return {
    source: "rehearsal",
    model: null,
    issue: mass(issue, issue === "clear" ? 0.84 : 0.72),
    yes,
    evidence: evidenceMass(evidence),
    worth,
    inputTokens: null,
  };
}

function mass(choice: Issue, confidence: number): Reading["issue"] {
  const probabilities = { clear: 0.08, ambiguous: 0.08, unresolvable: 0.08 };
  probabilities[choice] = confidence;
  const rest = (1 - confidence) / 2;
  (Object.keys(probabilities) as Issue[]).forEach((key) => {
    if (key !== choice) probabilities[key] = rest;
  });
  return { choice, probabilities, confidence };
}

function evidenceMass(choice: Evidence): Reading["evidence"] {
  const table: Record<Evidence, [number, number, number]> = {
    thin: [0.74, 0.18, 0.08],
    mixed: [0.2, 0.62, 0.18],
    solid: [0.08, 0.14, 0.78],
  };
  const [thin, mixed, solid] = table[choice];
  return {
    choice,
    probabilities: { thin, mixed, solid },
    confidence: Math.max(thin, mixed, solid),
  };
}
