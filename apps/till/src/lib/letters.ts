import type { Item, LetterId } from "./types";
import { usd } from "./format";

export const LETTER_LABEL: Record<LetterId, string> = {
  gentle_nudge: "Gentle nudge",
  due_today: "Due soon",
  past_due_firm: "Past due",
  final_notice: "Final notice",
  write_off: "Write off",
  none: "No letter",
};

export function renderLetter(id: LetterId, item: Item): string {
  const amount = usd(item.amount);
  const name = item.counterparty;
  const due = item.dueOn ? formatDay(item.dueOn) : "the due date";
  switch (id) {
    case "gentle_nudge":
      return `Hi ${name} — invoice ${amount} is still open. I can resend the PDF if that helps. If it is already in your queue, no need to reply.`;
    case "due_today":
      return `Hi ${name} — a reminder that ${amount} is due ${due}. Reply with the payment date and I will mark it on my side.`;
    case "past_due_firm":
      return `Hi ${name} — ${amount} was due ${due} and is still open. Please send payment this week, or tell me the date it will go out.`;
    case "final_notice":
      return `Hi ${name} — ${amount}, due ${due}, is still unpaid. This is my last note before I close the invoice and stop work on the account.`;
    case "write_off":
      return `${name} — closing ${amount} on my side. I will not send more reminders.`;
    default:
      return "";
  }
}

export function formatDay(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const date = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
