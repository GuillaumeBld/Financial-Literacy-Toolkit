import assert from "node:assert/strict";
import test from "node:test";
import { decide, markPaper, openPaper, traderCommand } from "../src/lib/decide";
import { parseReading } from "../src/lib/jev";
import { marketFromGamma, marketsFromGamma } from "../src/lib/markets";
import { rehearse } from "../src/lib/rehearsal";
import { SAMPLES } from "../src/lib/markets";
import type { Market } from "../src/lib/types";

const fed = SAMPLES[0];

test("a solid fact for the first outcome opens a paper above the crowd", () => {
  const reading = rehearse(fed, "Un fait solide va dans le sens du premier résultat.");
  const decision = decide(fed, reading);
  assert.equal(decision.side, "a");
  assert.ok(decision.edge > 0.15);
  assert.ok(reading.yes > fed.price);
});

test("a solid fact against the first outcome buys the other side", () => {
  const reading = rehearse(fed, "Un fait solide va contre le premier résultat.");
  const decision = decide(fed, reading);
  assert.equal(decision.side, "b");
  assert.ok(decision.edge < -0.15);
});

test("nothing new stays with the crowd", () => {
  const reading = rehearse(fed, "Rien de neuf.");
  const decision = decide(fed, reading);
  assert.equal(decision.side, "watch");
  assert.ok(Math.abs(decision.edge) < 0.08);
  assert.equal(reading.evidence.choice, "thin");
});

test("a foggy resolution never takes a side", () => {
  const reading = rehearse(fed, "La résolution est ambiguë : deux lectures restent possibles.");
  assert.equal(reading.issue.choice, "ambiguous");
  assert.equal(decide(fed, reading).side, "watch");
});

test("gamma rows become competitive binary markets", () => {
  const row = {
    id: "1",
    slug: "fed-october",
    question: "No change?",
    outcomes: "[\"Yes\",\"No\"]",
    outcomePrices: "[\"0.34\",\"0.66\"]",
    volume24hr: 1200,
    endDate: "2026-10-31T00:00:00Z",
    active: true,
    closed: false,
  };
  const live = marketFromGamma(row);
  assert.equal(live?.price, 0.34);
  assert.equal(live?.outcomes[0], "Yes");
  const blown = marketFromGamma({
    id: "2",
    slug: "done",
    question: "Already decided",
    outcomes: "[\"Yes\",\"No\"]",
    outcomePrices: "[\"0.99\",\"0.01\"]",
    active: true,
    closed: false,
  });
  assert.equal(blown, null);
  assert.equal(marketsFromGamma([row, { id: "x" }]).length, 1);
});

test("a paper marks to the live price and prints the trader command", () => {
  const decision = decide(fed, rehearse(fed, "Un fait solide va dans le sens du premier résultat."));
  const paper = openPaper(fed, decision, "2026-09-24T00:00:00.000Z");
  assert.ok(paper);
  assert.equal(paper!.stake, 100);
  assert.equal(traderCommand(paper!), "pm-trader buy sample-fed-octobre-2026 Oui 100");
  const up = markPaper(paper!, fed.price + 0.1);
  assert.ok(up.pnl > 0);
  const flat = markPaper(paper!, fed.price);
  assert.ok(Math.abs(flat.pnl) < 0.001);
});

test("jev payloads keep every distribution", () => {
  const reading = parseReading({
    model: "jev-latest",
    usage: { input_tokens: 40 },
    answers: {
      issue: { choice: "clear", confidence: 0.9, probabilities: { clear: 0.9, ambiguous: 0.08, unresolvable: 0.02 } },
      yes: { noul: 0.71 },
      evidence: { choice: "solid", confidence: 0.8, probabilities: { thin: 0.05, mixed: 0.15, solid: 0.8 } },
      worth: { noul: 0.77 },
    },
  });
  assert.equal(reading.source, "jev");
  assert.equal(reading.yes, 0.71);
  assert.equal(decide(fed, reading).side, "a");
});

test("a broken jev choice is rejected", () => {
  assert.throws(() => parseReading({ answers: { issue: { choice: "maybe" }, yes: { noul: 0.5 } } }));
});

test("watch decisions do not open a paper", () => {
  const market = { ...fed, price: 0.5 } satisfies Market;
  const reading = rehearse(market, "Rien de neuf.");
  assert.equal(openPaper(market, decide(market, reading), "t"), null);
});
