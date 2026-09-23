"use client";

import { useState } from "react";

export function CheckoutButton() {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function start() {
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch("/api/billing/checkout", { method: "POST" });
      const payload = (await response.json()) as { url?: string; error?: string };
      if (payload.url) {
        window.location.href = payload.url;
        return;
      }
      setMessage(payload.error || "Le paiement n'est pas disponible.");
    } catch {
      setMessage("Le paiement n'est pas disponible.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <button className="btn" type="button" onClick={start} disabled={pending}>
        {pending ? "Ouverture du paiement…" : "S'abonner — 19 €/mois"}
      </button>
      {message ? <p className="fine">{message}</p> : null}
    </div>
  );
}
