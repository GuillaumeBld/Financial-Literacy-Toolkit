import type { Item, LetterId } from "./types";
import { money } from "./format";

export const LETTER_LABEL: Record<LetterId, string> = {
  gentle_nudge: "Relance douce",
  due_today: "Échéance proche",
  past_due_firm: "Impayé",
  final_notice: "Dernier avis",
  write_off: "Passer en perte",
  none: "Pas de lettre",
};

export function renderLetter(id: LetterId, item: Item): string {
  const amount = money(item.amount);
  const name = item.counterparty;
  const due = item.dueOn ? formatDay(item.dueOn) : "la date d'échéance";
  switch (id) {
    case "gentle_nudge":
      return `Bonjour ${name} — la facture de ${amount} est toujours ouverte. Je peux renvoyer le PDF si ça aide. Si elle est déjà dans votre file, inutile de répondre.`;
    case "due_today":
      return `Bonjour ${name} — rappel : ${amount} est dû le ${due}. Répondez avec la date de paiement et je le note de mon côté.`;
    case "past_due_firm":
      return `Bonjour ${name} — ${amount}, dû le ${due}, est toujours ouvert. Merci d'envoyer le règlement cette semaine, ou de me dire la date à laquelle il partira.`;
    case "final_notice":
      return `Bonjour ${name} — ${amount}, dû le ${due}, reste impayé. Ceci est mon dernier message avant de clôturer la facture et d'arrêter le travail sur le compte.`;
    case "write_off":
      return `${name} — je clôture ${amount} de mon côté. Je n'enverrai plus de relance.`;
    default:
      return "";
  }
}

export function formatDay(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const date = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat("fr-FR", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
