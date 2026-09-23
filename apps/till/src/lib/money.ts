import { cents, clamp, daysUntil, pct, usd } from "./format";
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
  const amt = usd(item.amount);
  const conf = pct(raw.book.confidence);
  if (action === "chase") {
    return `${who}: ${amt} is income. If you follow up this week, the chance it arrives is ${pct(raw.willCollect)}. Book confidence is ${conf}, so ${LETTER_LABEL[letter].toLowerCase()} can go out.`;
  }
  if (action === "file") {
    return `${who}: ${amt} is an expense. The chance it is a business cost you would keep is ${pct(raw.deductible)}, above the file line, at ${conf} book confidence.`;
  }
  if (action === "review" && raw.book.choice === "expense") {
    return `${who}: ${amt} sits in the middle of the deduction screen (${pct(raw.deductible)}). Till will not file it until you do.`;
  }
  if (action === "review") {
    return `${who}: ${amt} is not clear enough to act on. Book confidence is ${conf}, and the chance you collect is ${pct(raw.willCollect)}.`;
  }
  if (letter === "write_off" || raw.letter.choice === "write_off") {
    return `${who}: ${amt} looks like income you will not collect (${pct(raw.willCollect)}). Till drops it instead of drafting another chase.`;
  }
  return `${who}: ${amt} is ${raw.book.choice}. Till leaves it out of the chase and the file.`;
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
    "counterparty",
    "amount",
    "action",
    "book",
    "will_collect",
    "deductible",
    "book_confidence",
    "expected_cash",
    "kept_at_your_rate",
    "letter",
  ];
  const lines = rows.map((row) =>
    [
      csvCell(row.item.counterparty),
      row.item.amount.toFixed(2),
      row.action,
      row.raw.book.choice,
      row.raw.willCollect.toFixed(2),
      row.raw.deductible.toFixed(2),
      row.raw.book.confidence.toFixed(2),
      row.expectedCash.toFixed(2),
      row.kept.toFixed(2),
      row.letter,
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
      return "Income";
    case "expense":
      return "Expense";
    case "transfer":
      return "Transfer";
    case "ignore":
      return "Personal";
  }
}
