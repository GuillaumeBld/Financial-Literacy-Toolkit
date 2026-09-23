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
      instructions: "Dans quel livre ranger cet élément ?",
      criteria: {
        income: "De l'argent qu'un client doit, ou paie, pour un travail",
        expense: "Un coût du travail",
        transfer: "Un mouvement de votre propre argent entre vos comptes",
        ignore: "Personnel, un doublon, ou hors de l'activité",
      },
    },
    letter: {
      type: "choice",
      instructions:
        "Quelle relance, s'il y en a une, convient ? Choisir aucune, sauf s'il s'agit d'argent qu'on vous doit.",
      criteria: {
        gentle_nudge: "Facture ouverte, relation encore bonne, un court rappel suffit",
        due_today: "Échéance dans quelques jours",
        past_due_firm: "Nettement en retard, mais le client n'a pas refusé",
        final_notice: "Très en retard, une dernière demande avant d'arrêter le travail",
        write_off: "Refus, litige, ou ils ont dit qu'ils ne paieront pas",
        none: "Ce n'est pas de l'argent qu'on vous doit, ou il ne faut rien envoyer",
      },
    },
    will_collect: {
      type: "noul",
      instructions:
        "Si vous relancez cette semaine, cet encaissement arrivera-t-il vraiment ?",
    },
    worth_chase: {
      type: "noul",
      instructions:
        "Une relance aujourd'hui vaut-elle le temps, vu le montant et les chances d'être payé ?",
    },
    deductible: {
      type: "noul",
      instructions:
        "Est-ce une dépense professionnelle courante qu'un indépendant garderait, plutôt qu'un coût personnel ? Les repas et les déplacements mixtes ne comptent qu'en partie.",
    },
    urgency: {
      type: "score",
      instructions: "Dans quel délai cet élément demande-t-il une décision humaine ?",
      criteria: [...URGENCY],
    },
    relationship: {
      type: "score",
      instructions: "À quel point la relation client est-elle tendue dans cette note ?",
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
  if (!body) throw new Error("Jev a renvoyé un corps vide.");
  const answers = asRecord(body.answers);
  if (!answers) throw new Error("Jev n'a renvoyé aucune réponse.");
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
    throw new Error("Le choix Jev ne correspond à aucune option connue.");
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
    throw new Error("Le noul Jev est absent.");
  }
  return clamp(n, 0, 1);
}

function parseScore(value: unknown): Score {
  const record = asRecord(value);
  const score = record?.score;
  const confidence = record?.confidence;
  if (typeof score !== "number" || !Number.isFinite(score)) {
    throw new Error("Le score Jev est absent.");
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
    throw new Error(`Jev a répondu ${response.status}.`);
  }
  return parseReading(JSON.parse(text) as unknown);
}
