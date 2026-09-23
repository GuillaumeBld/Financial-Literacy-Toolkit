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
      setMessage(payload.error || "Checkout is not available.");
    } catch {
      setMessage("Checkout is not available.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <button className="btn" type="button" onClick={start} disabled={pending}>
        {pending ? "Opening checkout…" : "Subscribe — $19/mo"}
      </button>
      {message ? <p className="fine">{message}</p> : null}
    </div>
  );
}
