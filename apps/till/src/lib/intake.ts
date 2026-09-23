import { isoToday } from "./format";
import type { Item, Kind } from "./types";

type ReceiptLine = {
  item_name?: string;
  item_total?: number;
  item_price?: number;
};

type ReceiptOcr = {
  merchant_name?: string;
  transaction_date?: string;
  total_amount?: number;
  line_items?: ReceiptLine[];
};

function id(): string {
  return crypto.randomUUID();
}

export function itemFromReceiptOcr(
  raw: unknown,
  asOf = isoToday(),
): Item | null {
  if (!raw || typeof raw !== "object") return null;
  const receipt = raw as ReceiptOcr;
  const merchant = receipt.merchant_name?.trim();
  const total = receipt.total_amount;
  if (!merchant || typeof total !== "number" || !Number.isFinite(total) || total <= 0) {
    return null;
  }
  const lines = Array.isArray(receipt.line_items) ? receipt.line_items : [];
  const names = lines
    .map((line) => line?.item_name?.trim())
    .filter((name): name is string => Boolean(name));
  const issued = /^\d{4}-\d{2}-\d{2}$/.test(receipt.transaction_date ?? "")
    ? (receipt.transaction_date as string)
    : asOf;
  return {
    id: id(),
    kind: "receipt",
    counterparty: merchant,
    amount: Math.round(total * 100) / 100,
    issuedOn: issued,
    dueOn: null,
    text: names.join(", ") || "Receipt",
    source: "receipt-ocr",
    asOf,
  };
}

export function itemsFromCsv(
  text: string,
  asOf = isoToday(),
): { items: Item[]; error: string | null } {
  const rows = parseCsv(text);
  if (rows.length < 2) {
    return { items: [], error: "The CSV needs a header row and at least one item." };
  }
  const header = rows[0].map((cell) => cell.trim().toLowerCase());
  const col = (...names: string[]) => header.findIndex((cell) => names.includes(cell));
  const dateCol = col("date", "issued", "issued_on", "transaction_date");
  const nameCol = col("description", "merchant", "counterparty", "name", "merchant_name");
  const amountCol = col("amount", "total", "total_amount");
  const categoryCol = col("category");
  const notesCol = col("notes", "note", "memo");
  const dueCol = col("due", "due_on", "due_date");
  if (nameCol < 0 || amountCol < 0) {
    return {
      items: [],
      error: "Need description and amount columns. A Midday export (date, description, amount, category) works.",
    };
  }

  const items: Item[] = [];
  for (const row of rows.slice(1)) {
    const counterparty = (row[nameCol] ?? "").trim();
    const amount = parseMoney(row[amountCol] ?? "");
    if (!counterparty || amount === null || amount === 0) continue;
    const category = categoryCol >= 0 ? (row[categoryCol] ?? "").trim() : "";
    const notes = notesCol >= 0 ? (row[notesCol] ?? "").trim() : "";
    const issued = dateCol >= 0 ? normalizeDate(row[dateCol] ?? "") : asOf;
    const dueFromCol = dueCol >= 0 ? normalizeDate(row[dueCol] ?? "") : null;
    const dueFromNotes = notes.match(/due\s+(\d{4}-\d{2}-\d{2})/i)?.[1] ?? null;
    const income = /income|invoice|client payment/i.test(category) || amount > 0 && !category;
    const kind: Kind = amount < 0 || /expense|software|meal|travel|supplies/i.test(category)
      ? "receipt"
      : income
        ? "invoice"
        : "note";
    items.push({
      id: id(),
      kind: amount < 0 ? "receipt" : kind === "note" ? "invoice" : kind,
      counterparty,
      amount: Math.round(Math.abs(amount) * 100) / 100,
      issuedOn: issued || asOf,
      dueOn: dueFromCol || dueFromNotes,
      text: [category, notes].filter(Boolean).join(". ") || counterparty,
      source: "midday",
      asOf,
    });
  }
  if (!items.length) {
    return { items: [], error: "No usable rows. Each row needs a name and a non-zero amount." };
  }
  return { items, error: null };
}

function normalizeDate(value: string): string | null {
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
  return null;
}

function parseMoney(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const paren = /^\(.*\)$/.test(trimmed);
  const n = Number(trimmed.replace(/[$,()\s]/g, ""));
  if (!Number.isFinite(n)) return null;
  return paren ? -Math.abs(n) : n;
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const source = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (quoted) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        cell += char;
      }
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (char !== "\r") {
      cell += char;
    }
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((cells) => cells.some((value) => value.trim() !== ""));
}
