import { GATES, STAKE, type Decision, type Market, type Paper, type Reading } from "./types";

export function decide(market: Market, reading: Reading): Decision {
  const edge = reading.yes - market.price;
  if (reading.issue.choice !== "clear" || reading.issue.confidence < GATES.issueConfidence) {
    return { side: "watch", edge, entry: market.price, reason: "La question n'est pas assez nette pour un papier." };
  }
  if (reading.evidence.choice === "thin") {
    return { side: "watch", edge, entry: market.price, reason: "Le fait est trop mince. Jev ne prend pas parti." };
  }
  if (reading.worth < GATES.minWorth) {
    return { side: "watch", edge, entry: market.price, reason: "L'écart ne vaut pas un papier aujourd'hui." };
  }
  if (Math.abs(edge) < GATES.minEdge) {
    return { side: "watch", edge, entry: market.price, reason: "Jev et la foule sont trop proches." };
  }
  if (edge > 0) {
    return {
      side: "a",
      edge,
      entry: market.price,
      reason: `Jev place ${market.outcomes[0]} au-dessus du prix de la foule.`,
    };
  }
  return {
    side: "b",
    edge,
    entry: 1 - market.price,
    reason: `Jev place ${market.outcomes[0]} en dessous du prix de la foule.`,
  };
}

export function openPaper(market: Market, decision: Decision, now: string): Paper | null {
  if (decision.side === "watch") return null;
  return {
    id: `${market.id}:${now}`,
    marketId: market.id,
    slug: market.slug,
    question: market.question,
    outcome: market.outcomes[decision.side === "a" ? 0 : 1],
    side: decision.side,
    entry: decision.entry,
    stake: STAKE,
    openedAt: now,
  };
}

export function markPaper(paper: Paper, priceA: number) {
  const live = paper.side === "a" ? priceA : 1 - priceA;
  const entry = paper.entry > 0 ? paper.entry : live;
  const shares = paper.stake / entry;
  const value = shares * live;
  return { live, value, pnl: value - paper.stake };
}

export function traderCommand(paper: Paper) {
  return `pm-trader buy ${paper.slug} ${paper.outcome} ${paper.stake}`;
}
