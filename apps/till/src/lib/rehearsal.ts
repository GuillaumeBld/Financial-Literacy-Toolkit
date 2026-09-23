import { clamp, daysUntil } from "./format";
import {
  BOOKS,
  LETTERS,
  type Book,
  type Choice,
  type Item,
  type LetterId,
  type RawReading,
} from "./types";

function spread<T extends string>(
  keys: readonly T[],
  choice: T,
  peak: number,
): Record<T, number> {
  const top = clamp(peak, 0.34, 0.97);
  const rest = (1 - top) / (keys.length - 1);
  const out = {} as Record<T, number>;
  for (const key of keys) out[key] = key === choice ? top : rest;
  return out;
}

function pick<T extends string>(
  keys: readonly T[],
  choice: T,
  peak: number,
  confidence: number,
): Choice<T> {
  return {
    choice,
    probabilities: spread(keys, choice, peak),
    confidence,
  };
}

function blob(item: Item): string {
  return `${item.counterparty} ${item.text}`.toLowerCase();
}

function hostile(text: string): boolean {
  return /won'?t pay|will not pay|stop emailing|never paying|chargeback|see you in court|do not contact|ne paierons pas|ne payerons pas|n'allons pas payer|arrêtez de m'écrire|arretez de m'ecrire|cessez de m'écrire|ne paye pas|ne paie pas|refusons de payer/.test(
    text,
  );
}

function personal(text: string): boolean {
  return /grocer|whole foods|trader joe|supermarket|apartment rent|netflix|personal|courses|épicerie|epicerie|appartement|personnel|personnelle/.test(
    text,
  );
}

function transfer(text: string): boolean {
  return /checking to savings|savings to checking|transfer between|moved my own money|own account|mon propre argent|virement entre|compte courant vers/.test(
    text,
  );
}

function software(text: string): boolean {
  return /adobe|figma|github|aws|google workspace|creative cloud|domain name|notion|linear\.app|software|logiciel/.test(
    text,
  );
}

function mixedTrip(text: string): boolean {
  return /flight|united|hotel|airbnb|conference|lyft|uber|airfare|vol pour|conférence|avion|hôtel/.test(text);
}

function meal(text: string): boolean {
  return /coffee|latte|lunch|dinner|restaurant|meal|cafe|café|déjeuner|dîner|diner|dejeuner|repas/.test(text);
}

function delaying(text: string): boolean {
  return /next quarter|next month|push this|might push|when we can|cash is tight|trimestre prochain|mois prochain|repousser/.test(
    text,
  );
}

export function rehearse(item: Item): RawReading {
  const text = blob(item);
  const late = daysUntil(item.dueOn, item.asOf);

  let book: Book = item.kind === "invoice" ? "income" : "expense";
  let letter: LetterId = "none";
  let bookPeak = 0.84;
  let bookConf = 0.86;
  let letterPeak = 0.8;
  let letterConf = 0.8;
  let willCollect = item.kind === "invoice" ? 0.7 : 0.05;
  let worthChase = item.kind === "invoice" ? 0.6 : 0.04;
  let deductible = item.kind === "receipt" ? 0.6 : 0.05;
  let urgency = 1;
  let urgencyConf = 0.7;
  let relationship = 0.3;
  let relationshipConf = 0.72;

  if (item.kind !== "invoice" && personal(text)) {
    book = "ignore";
    deductible = 0.06;
    bookPeak = 0.9;
    bookConf = 0.9;
    willCollect = 0.02;
    worthChase = 0.02;
    urgency = 0.2;
  } else if (transfer(text)) {
    book = "transfer";
    bookPeak = 0.88;
    bookConf = 0.84;
    deductible = 0.04;
    willCollect = 0.02;
    worthChase = 0.02;
  } else if (item.kind === "invoice" || /invoice|net 30|amount due|facture|échéance|echeance/.test(text)) {
    book = "income";
    if (hostile(text)) {
      letter = "write_off";
      letterPeak = 0.9;
      letterConf = 0.88;
      willCollect = 0.08;
      worthChase = 0.12;
      bookConf = 0.84;
      urgency = 3;
      urgencyConf = 0.9;
      relationship = 3;
      relationshipConf = 0.92;
    } else if (late !== null && late < -30) {
      letter = "final_notice";
      willCollect = 0.4;
      worthChase = 0.72;
      urgency = 2.6;
      relationship = 2.1;
    } else if (delaying(text)) {
      letter = late !== null && late < 0 ? "past_due_firm" : "gentle_nudge";
      willCollect = 0.46;
      worthChase = 0.74;
      urgency = 1.8;
      relationship = 1.7;
      relationshipConf = 0.8;
    } else if (late !== null && late < 0) {
      letter = "past_due_firm";
      willCollect = 0.64;
      worthChase = 0.8;
      urgency = 2.2;
      relationship = 1.1;
    } else if (late !== null && late <= 3) {
      letter = "due_today";
      willCollect = 0.81;
      worthChase = 0.86;
      urgency = 2.1;
      relationship = 0.3;
    } else {
      letter = "gentle_nudge";
      willCollect = 0.74;
      worthChase = 0.58;
      urgency = 1.2;
    }
  } else if (software(text)) {
    book = "expense";
    deductible = 0.92;
    bookPeak = 0.91;
    bookConf = 0.9;
    urgency = 0.6;
  } else if (mixedTrip(text)) {
    book = "expense";
    deductible = 0.55;
    bookConf = 0.74;
    bookPeak = 0.7;
    urgency = 1;
    relationshipConf = 0.6;
  } else if (meal(text)) {
    book = "expense";
    deductible = 0.44;
    bookConf = 0.66;
    bookPeak = 0.68;
    urgency = 0.4;
  } else if (item.kind === "receipt") {
    book = "expense";
    deductible = 0.62;
    bookConf = 0.58;
    bookPeak = 0.64;
  } else {
    book = "expense";
    deductible = 0.5;
    bookConf = 0.42;
    bookPeak = 0.48;
  }

  return {
    source: "rehearsal",
    model: null,
    book: pick(BOOKS, book, bookPeak, bookConf),
    letter: pick(LETTERS, letter, letterPeak, letterConf),
    willCollect,
    worthChase,
    deductible,
    urgency: { score: urgency, confidence: urgencyConf },
    relationship: { score: relationship, confidence: relationshipConf },
    inputTokens: null,
  };
}
