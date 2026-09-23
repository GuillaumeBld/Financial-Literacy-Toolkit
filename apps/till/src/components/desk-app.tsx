"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { dueLabel, isoToday, money, pct } from "@/lib/format";
import { itemFromReceiptOcr, itemsFromCsv } from "@/lib/intake";
import { LETTER_LABEL, renderLetter } from "@/lib/letters";
import { actionLabel, bookLabel, byAction, interpret, toCsv, weekTotals } from "@/lib/money";
import { rehearse } from "@/lib/rehearsal";
import { samples } from "@/lib/samples";
import {
  BOOKS,
  LETTERS,
  RELATIONSHIP,
  URGENCY,
  type Interpreted,
  type Item,
  type Kind,
  type RawReading,
} from "@/lib/types";

type Row = { item: Item; raw: RawReading };
type Plan = "solo" | "desk";

const STORAGE = "till.desk.v2";

function seed(): Row[] {
  return samples.map((item) => ({ item, raw: rehearse(item) }));
}

export function DeskApp() {
  const params = useSearchParams();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [taxRate, setTaxRate] = useState(0.25);
  const [selected, setSelected] = useState("harbor");
  const [plan, setPlan] = useState<Plan>("solo");
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showCsv, setShowCsv] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [importText, setImportText] = useState("");
  const [draft, setDraft] = useState({
    kind: "invoice" as Kind,
    counterparty: "",
    amount: "",
    dueOn: "",
    text: "",
  });

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { rows: Row[]; taxRate: number };
        if (Array.isArray(parsed.rows) && parsed.rows.length) {
          setRows(parsed.rows);
          setTaxRate(parsed.taxRate || 0.25);
          setSelected(parsed.rows[0].item.id);
          return;
        }
      } catch {
        /* replace a broken save with the sample week */
      }
    }
    setRows(seed());
  }, []);

  useEffect(() => {
    if (!rows) return;
    window.localStorage.setItem(STORAGE, JSON.stringify({ rows, taxRate }));
  }, [rows, taxRate]);

  useEffect(() => {
    void fetch("/api/billing/status")
      .then((response) => response.json())
      .then((payload: { plan?: Plan }) => {
        if (payload.plan === "desk") setPlan("desk");
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const sessionId = params.get("session_id");
    if (!sessionId) return;
    void fetch("/api/billing/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    })
      .then(async (response) => {
        const payload = (await response.json()) as { plan?: Plan; error?: string };
        if (response.ok && payload.plan === "desk") {
          setPlan("desk");
          setNotice("Bureau est actif. Lancez une ligne sur Jev pour le score en direct.");
        } else if (payload.error) setNotice(payload.error);
      })
      .catch(() => setNotice("Impossible de confirmer le paiement."));
  }, [params]);

  const interpreted = useMemo(
    () => (rows ? rows.map((row) => interpret(row.item, row.raw, taxRate)) : []),
    [rows, taxRate],
  );
  const totals = weekTotals(interpreted);
  const current = interpreted.find((row) => row.item.id === selected) ?? interpreted[0];

  function replace(next: Row[], id = selected) {
    setRows(next);
    setSelected(id);
  }

  function addManual(event: FormEvent) {
    event.preventDefault();
    const amount = Number(draft.amount);
    if (!draft.counterparty.trim() || !Number.isFinite(amount) || amount <= 0) {
      setNotice("Ajoutez un nom et un montant supérieur à zéro.");
      return;
    }
    const item: Item = {
      id: crypto.randomUUID(),
      kind: draft.kind,
      counterparty: draft.counterparty.trim(),
      amount: Math.round(amount * 100) / 100,
      issuedOn: isoToday(),
      dueOn: draft.dueOn || null,
      text: draft.text.trim(),
      source: "manual",
      asOf: isoToday(),
    };
    const next = [{ item, raw: rehearse(item) }, ...(rows ?? [])];
    replace(next, item.id);
    setDraft({ kind: "invoice", counterparty: "", amount: "", dueOn: "", text: "" });
    setNotice(null);
  }

  function importCsv() {
    const { items, error } = itemsFromCsv(importText);
    if (error) {
      setNotice(error);
      return;
    }
    const imported = items.map((item) => ({ item, raw: rehearse(item) }));
    replace([...(rows ?? []), ...imported], imported[0].item.id);
    setImportText("");
    setShowCsv(false);
    setNotice(`Ajout de ${imported.length} ligne${imported.length > 1 ? "s" : ""} depuis le CSV.`);
  }

  function importReceipt() {
    try {
      const item = itemFromReceiptOcr(JSON.parse(importText));
      if (!item) {
        setNotice("Ce JSON doit contenir merchant_name et total_amount, le format de receipt-ocr.");
        return;
      }
      replace([{ item, raw: rehearse(item) }, ...(rows ?? [])], item.id);
      setImportText("");
      setShowReceipt(false);
      setNotice(`Ajout de ${item.counterparty} depuis receipt-ocr.`);
    } catch {
      setNotice("Ce n'était pas du JSON.");
    }
  }

  async function runJev(item: Item) {
    setPending(true);
    setNotice(null);
    try {
      const response = await fetch("/api/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item, live: true }),
      });
      const payload = (await response.json()) as {
        raw?: RawReading;
        notice?: string | null;
        upgrade?: boolean;
        error?: string;
      };
      if (payload.upgrade) {
        setNotice(payload.notice || "Bureau coûte 19 € par mois.");
        return;
      }
      if (payload.raw && rows) {
        setRows(rows.map((row) => (row.item.id === item.id ? { item, raw: payload.raw as RawReading } : row)));
      }
      if (payload.notice) setNotice(payload.notice);
      if (payload.error) setNotice(payload.error);
    } catch {
      setNotice("La lecture n'a pas abouti.");
    } finally {
      setPending(false);
    }
  }

  function downloadCsv() {
    const blob = new Blob([toCsv(interpreted)], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "till-caisse.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  if (!rows || !current) return <p className="wait">Ouverture du bureau…</p>;

  return (
    <main className="desk">
      <section className="stack">
        <div className="sheet" style={{ padding: 12 }}>
          <p className="kicker">{plan === "desk" ? "Offre Bureau" : "Solo"}</p>
          <p className="money">{money(totals.chase)} à relancer</p>
          <p className="fine">
            {money(totals.filed)} prêt à classer · {money(totals.review)} en attente
          </p>
          <label>
            Votre taux pour classer les dépenses
            <input
              type="number"
              min={0}
              max={60}
              step={1}
              value={Math.round(taxRate * 100)}
              onChange={(event) => setTaxRate(Number(event.target.value) / 100)}
            />
          </label>
          <div className="row">
            <button className="btn-quiet" type="button" onClick={downloadCsv}>Exporter</button>
            <button className="btn-quiet" type="button" onClick={() => replace(seed(), "harbor")}>
              Reprendre la semaine d'exemple
            </button>
          </div>
        </div>

        <form className="stack" onSubmit={addManual}>
          <label>
            Type
            <select
              value={draft.kind}
              onChange={(event) => setDraft({ ...draft, kind: event.target.value as Kind })}
            >
              <option value="invoice">Facture</option>
              <option value="receipt">Reçu</option>
              <option value="note">Note</option>
            </select>
          </label>
          <label>
            Qui
            <input
              value={draft.counterparty}
              onChange={(event) => setDraft({ ...draft, counterparty: event.target.value })}
              placeholder="Harbor & Co"
            />
          </label>
          <label>
            Montant
            <input
              inputMode="decimal"
              value={draft.amount}
              onChange={(event) => setDraft({ ...draft, amount: event.target.value })}
              placeholder="6800"
            />
          </label>
          <label>
            Échéance
            <input
              type="date"
              value={draft.dueOn}
              onChange={(event) => setDraft({ ...draft, dueOn: event.target.value })}
            />
          </label>
          <label>
            Ce qu'on vous a écrit
            <textarea
              value={draft.text}
              onChange={(event) => setDraft({ ...draft, text: event.target.value })}
              placeholder="On va peut-être repousser ça au trimestre prochain."
            />
          </label>
          <button className="btn" type="submit">Ajouter au bureau</button>
        </form>

        <div className="row">
          <button className="btn-quiet" type="button" onClick={() => { setShowCsv((v) => !v); setShowReceipt(false); }}>
            CSV Midday
          </button>
          <button className="btn-quiet" type="button" onClick={() => { setShowReceipt((v) => !v); setShowCsv(false); }}>
            JSON receipt-ocr
          </button>
        </div>
        {showCsv || showReceipt ? (
          <div className="stack">
            <textarea
              value={importText}
              onChange={(event) => setImportText(event.target.value)}
              placeholder={showCsv
                ? "date,description,amount,category,notes"
                : '{"merchant_name":"Adobe","total_amount":59.99,"transaction_date":"2026-09-20","line_items":[]}'}
            />
            <button className="btn" type="button" onClick={showCsv ? importCsv : importReceipt}>
              {showCsv ? "Importer le CSV" : "Importer le reçu"}
            </button>
          </div>
        ) : null}
        {notice ? <p className="notice">{notice}</p> : null}
      </section>

      <section>
        <Queue title="Relancer" hint="Trié par montant × chance d'encaisser" rows={byAction(interpreted, "chase")} selected={current.item.id} onSelect={setSelected} />
        <div className="queues">
          <Queue title="À voir" hint="Retenu. La confiance ou la déduction est au milieu." rows={byAction(interpreted, "review")} selected={current.item.id} onSelect={setSelected} />
          <Queue title="Classer" hint="Assez clair pour garder, à votre taux" rows={byAction(interpreted, "file")} selected={current.item.id} onSelect={setSelected} />
        </div>
        <Queue title="Laissé de côté" hint="Personnel, un virement, ou un client qui ne paiera pas" rows={byAction(interpreted, "drop")} selected={current.item.id} onSelect={setSelected} />
      </section>

      <Detail key={current.item.id} row={current} pending={pending} onJev={() => runJev(current.item)} />
    </main>
  );
}

function Queue({
  title,
  hint,
  rows,
  selected,
  onSelect,
}: {
  title: string;
  hint: string;
  rows: Interpreted[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <section>
      <h2>{title}</h2>
      <p className="fine">{hint}</p>
      {rows.length === 0 ? <p className="fine">Rien ici.</p> : null}
      {rows.map((row) => (
        <button
          key={row.item.id}
          type="button"
          className={row.item.id === selected ? "card on" : "card"}
          onClick={() => onSelect(row.item.id)}
        >
          <b>{row.item.counterparty}</b>
          <span className="money">
            {money(row.item.amount)}
            {row.action === "chase" ? ` · ${money(row.expectedCash)} attendu` : ""}
            {row.action === "file" ? ` · ${money(row.kept)} conservé` : ""}
          </span>
          <span className="fine">
            {row.item.kind === "invoice" ? dueLabel(row.item.dueOn, row.item.asOf) : row.item.text}
            {" · "}
            {row.raw.source === "jev" ? row.raw.model : "En local"}
          </span>
        </button>
      ))}
    </section>
  );
}

function Detail({
  row,
  pending,
  onJev,
}: {
  row: Interpreted;
  pending: boolean;
  onJev: () => void;
}) {
  const letter = renderLetter(row.letter, row.item);
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(letter);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <aside className="sheet detail">
      <span className={`pill ${row.action}`}>{actionLabel(row.action)}</span>
      <h2>{row.item.counterparty}</h2>
      <p className="money">{money(row.item.amount)}</p>
      <p>{row.explanation}</p>
      {letter ? (
        <>
          <p className="fine">
            {row.letter === "write_off" ? "Note pour vous, pas une lettre à envoyer." : LETTER_LABEL[row.letter]}
          </p>
          <p className="letter">{letter}</p>
          {row.letter !== "write_off" ? (
            <button className="btn-quiet" type="button" onClick={copy}>
              {copied ? "Copié" : "Copier la lettre"}
            </button>
          ) : null}
        </>
      ) : null}

      <h3>Livre</h3>
      {BOOKS.map((book) => (
        <Meter key={book} label={bookLabel(book)} value={row.raw.book.probabilities[book]} mark={row.raw.book.choice === book} />
      ))}
      <p className="fine">Confiance sur le livre {pct(row.raw.book.confidence)}. Sous 55 %, la ligne reste à voir.</p>

      <h3>Chances</h3>
      <Meter label="Encaisse si vous relancez" value={row.raw.willCollect} />
      <Meter label="Une relance aujourd'hui en vaut la peine" value={row.raw.worthChase} />
      <Meter label="Coût professionnel à garder" value={row.raw.deductible} />

      <h3>Pression</h3>
      <p className="fine">
        Urgence {row.raw.urgency.score.toFixed(1)} sur 3 — {level(URGENCY, row.raw.urgency.score)}.
        Relation {row.raw.relationship.score.toFixed(1)} sur 3 — {level(RELATIONSHIP, row.raw.relationship.score)}.
      </p>
      <p className="fine">
        Poids des lettres : {LETTERS.map((id) => `${LETTER_LABEL[id]} ${pct(row.raw.letter.probabilities[id])}`).join(" · ")}
      </p>
      <p className="fine">
        {row.raw.source === "jev"
          ? `Jev ${row.raw.model}${row.raw.inputTokens ? `, ${row.raw.inputTokens} jetons en entrée` : ""}.`
          : "Répétition locale. Bureau pose les mêmes sept questions à Jev."}
      </p>
      <button className="btn" type="button" onClick={onJev} disabled={pending}>
        {pending ? "Demande à Jev…" : "Lancer sur Jev"}
      </button>
    </aside>
  );
}

function Meter({ label, value, mark }: { label: string; value: number; mark?: boolean }) {
  return (
    <div className="meter">
      <span className="fine">{mark ? `${label} · retenu` : label} {pct(value)}</span>
      <i><b style={{ width: `${Math.round(value * 100)}%` }} /></i>
    </div>
  );
}

function level(labels: readonly string[], score: number): string {
  const index = Math.max(0, Math.min(labels.length - 1, Math.round(score)));
  return labels[index];
}
