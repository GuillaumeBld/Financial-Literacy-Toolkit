export function money(n: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(n);
}

export function pct(n: number): string {
  return `${Math.round(n * 100)} %`;
}

export function cents(n: number): number {
  return Math.round(n * 100) / 100;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function isoToday(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function daysUntil(due: string | null, asOf: string): number | null {
  if (!due) return null;
  const a = Date.parse(`${asOf}T00:00:00Z`);
  const b = Date.parse(`${due}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.round((b - a) / 86400000);
}

export function dueLabel(due: string | null, asOf: string): string {
  const n = daysUntil(due, asOf);
  if (n === null) return "Pas de date d'échéance";
  if (n === 0) return "Dû aujourd'hui";
  if (n === 1) return "Dû demain";
  if (n > 1) return `Dû dans ${n} jours`;
  if (n === -1) return "1 jour de retard";
  return `${-n} jours de retard`;
}
