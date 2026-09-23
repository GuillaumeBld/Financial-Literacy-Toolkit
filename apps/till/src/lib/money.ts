import { cents, clamp, daysUntil, money, pct } from "./format";
import { LETTER_LABEL } from "./letters";
import {
  GATES,
  type Action,
  type Book,
  type Interpreted,
  type Item,
  type LetterId,
  type RawReading,
} from "./types";

function fallbackLetter(item: Item): LetterId {
  const days = daysUntil(item.dueOn, item.asOf);
  if (days === null) return "gentle_nudge";
  if (days < -30) return "final_notice";
  if (days < 0) return "past_due_firm";
  if (days <= 3) return "due_today";
  return "gentle_nudge";
}

function explain(
  item: Item,
  raw: RawReading,
  action: Action,
  letter: LetterId,
): string {
  const who = item.counterparty;
  const amt = money(item.amount);
  const conf = pct(raw.book.confidence);
  if (action === "chase") {
    return `${who} : ${amt} est une recette. Si vous relancez cette semaine, la chance d'encaisser est ${pct(raw.willCollect)}. La confiance sur le livre est ${conf}, donc « ${LETTER_LABEL[letter]} » peut partir.`;
  }
  if (action === "file") {
    return `${who} : ${amt} est une dépense. La chance que ce soit un coût professionnel à garder est ${pct(raw.deductible)}, au-dessus du seuil, avec ${conf} de confiance.`;
  }
  if (action === "review" && raw.book.choice === "expense") {
    return `${who} : ${amt} est au milieu du filtre de déduction (${pct(raw.deductible)}). Till ne le classe pas tant que vous ne le faites pas.`;
  }
  if (action === "review") {
    return `${who} : ${amt} n'est pas assez clair pour agir. Confiance sur le livre ${conf}, chance d'encaisser ${pct(raw.willCollect)}.`;
  }
  if (letter === "write_off" || raw.letter.choice === "write_off") {
    return `${who} : ${amt} ressemble à une recette que vous n'encaisserez pas (${pct(raw.willCollect)}). Till la laisse de côté plutôt que d'écrire une relance de plus.`;
  }
  return `${who} : ${amt} est ${bookLabel(raw.book.choice).toLowerCase()}. Till le sort de la relance et du classement.`;
}

export function interpret(
  item: Item,
  raw: RawReading,
  taxRate: number,
): Interpreted {
  const tax = clamp(taxRate, 0, 0.6);
  let action: Action;

  if (raw.book.confidence < GATES.bookConfidence) {
    action = "review";
  } else if (raw.book.choice === "ignore" || raw.book.choice === "transfer") {
    action = "drop";
  } else if (raw.book.choice === "income") {
    if (
      raw.letter.choice === "write_off" &&
      raw.letter.confidence >= GATES.letterConfidence
    ) {
      action = "drop";
    } else if (
      raw.worthChase >= GATES.chaseWorth &&
      raw.willCollect >= GATES.chaseCollect
    ) {
      action = "chase";
    } else if (raw.willCollect < 0.25) {
      action = "drop";
    } else {
      action = "review";
    }
  } else if (raw.deductible >= GATES.deductLow && raw.deductible < GATES.deductHigh) {
    action = "review";
  } else if (raw.deductible >= GATES.deductHigh) {
    action = "file";
  } else {
    action = "drop";
  }

  const letter: LetterId =
    raw.book.choice === "income" && action !== "drop"
      ? raw.letter.choice === "none"
        ? fallbackLetter(item)
        : raw.letter.choice
      : raw.letter.choice === "write_off"
        ? "write_off"
        : "none";

  const collectible = cents(item.amount * clamp(raw.willCollect, 0, 1));
  const expectedCash = action === "chase" ? collectible : 0;
  const upside =
    action === "review" && raw.book.choice === "income" ? collectible : 0;
  const kept =
    raw.book.choice === "expense" && (action === "file" || action === "review")
      ? cents(item.amount * clamp(raw.deductible, 0, 1) * tax)
      : 0;

  return {
    item,
    raw,
    action,
    letter,
    expectedCash,
    upside,
    kept,
    taxRate: tax,
    explanation: explain(item, raw, action, letter),
  };
}

export function byAction(rows: Interpreted[], action: Action): Interpreted[] {
  const value = (row: Interpreted) =>
    action === "file"
      ? row.kept
      : action === "chase"
        ? row.expectedCash
        : action === "review"
          ? row.upside + row.kept
          : row.item.amount;
  return rows
    .filter((row) => row.action === action)
    .sort((a, b) => value(b) - value(a) || b.item.amount - a.item.amount);
}

export function weekTotals(rows: Interpreted[]): {
  chase: number;
  filed: number;
  review: number;
} {
  return {
    chase: cents(rows.reduce((sum, row) => sum + row.expectedCash, 0)),
    filed: cents(
      rows.reduce(
        (sum, row) => sum + (row.action === "file" ? row.kept : 0),
        0,
      ),
    ),
    review: cents(
      rows.reduce(
        (sum, row) =>
          sum + (row.action === "review" ? row.kept + row.upside : 0),
        0,
      ),
    ),
  };
}

export function toCsv(rows: Interpreted[]): string {
  const header = [
    "contrepartie",
    "montant",
    "action",
    "livre",
    "chance_encaissement",
    "deductible",
    "confiance",
    "encaisse_attendu",
    "conserve_a_votre_taux",
    "lettre",
  ];
  const lines = rows.map((row) =>
    [
      csvCell(row.item.counterparty),
      row.item.amount.toFixed(2),
      actionLabel(row.action),
      bookLabel(row.raw.book.choice),
      row.raw.willCollect.toFixed(2),
      row.raw.deductible.toFixed(2),
      row.raw.book.confidence.toFixed(2),
      row.expectedCash.toFixed(2),
      row.kept.toFixed(2),
      LETTER_LABEL[row.letter],
    ].join(","),
  );
  return [header.join(","), ...lines].join("\n");
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function bookLabel(book: Book): string {
  switch (book) {
    case "income":
      return "Recette";
    case "expense":
      return "Dépense";
    case "transfer":
      return "Virement";
    case "ignore":
      return "Personnel";
  }
}

export function actionLabel(action: Action): string {
  switch (action) {
    case "chase":
      return "Relancer";
    case "file":
      return "Classer";
    case "review":
      return "À voir";
    case "drop":
      return "Laisser";
  }
}
