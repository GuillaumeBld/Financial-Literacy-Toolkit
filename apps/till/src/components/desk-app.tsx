"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { dueLabel, isoToday, pct, usd } from "@/lib/format";
import { itemFromReceiptOcr, itemsFromCsv } from "@/lib/intake";
import { LETTER_LABEL, renderLetter } from "@/lib/letters";
import { bookLabel, byAction, interpret, toCsv, weekTotals } from "@/lib/money";
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

const STORAGE = "till.desk.v1";

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
          setNotice("Desk is on. Run an item on Jev when you want the live score.");
        } else if (payload.error) setNotice(payload.error);
      })
      .catch(() => setNotice("Could not confirm the checkout."));
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
      setNotice("Add a name and an amount greater than zero.");
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
    setNotice(`Added ${imported.length} from the CSV.`);
  }

  function importReceipt() {
    try {
      const item = itemFromReceiptOcr(JSON.parse(importText));
      if (!item) {
        setNotice("That JSON needs merchant_name and total_amount, the receipt-ocr shape.");
        return;
      }
      replace([{ item, raw: rehearse(item) }, ...(rows ?? [])], item.id);
      setImportText("");
      setShowReceipt(false);
      setNotice(`Added ${item.counterparty} from receipt-ocr.`);
    } catch {
      setNotice("That was not JSON.");
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
        setNotice(payload.notice || "Desk is $19 a month.");
        return;
      }
      if (payload.raw && rows) {
        setRows(rows.map((row) => (row.item.id === item.id ? { item, raw: payload.raw as RawReading } : row)));
      }
      if (payload.notice) setNotice(payload.notice);
      if (payload.error) setNotice(payload.error);
    } catch {
      setNotice("The reading did not complete.");
    } finally {
      setPending(false);
    }
  }

  function downloadCsv() {
    const blob = new Blob([toCsv(interpreted)], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "till-desk.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  if (!rows || !current) return <p className="wait">Opening the desk…</p>;

  return (
    <main className="desk">
      <section className="stack">
        <div className="sheet" style={{ padding: 12 }}>
          <p className="kicker">{plan === "desk" ? "Desk plan" : "Solo"}</p>
          <p className="money">{usd(totals.chase)} to chase</p>
          <p className="fine">
            {usd(totals.filed)} ready to file · {usd(totals.review)} waiting on you
          </p>
          <label>
            Your rate for ranking expenses
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
            <button className="btn-quiet" type="button" onClick={downloadCsv}>CSV</button>
            <button className="btn-quiet" type="button" onClick={() => replace(seed(), "harbor")}>
              Reset sample week
            </button>
          </div>
        </div>

        <form className="stack" onSubmit={addManual}>
          <label>
            Kind
            <select
              value={draft.kind}
              onChange={(event) => setDraft({ ...draft, kind: event.target.value as Kind })}
            >
              <option value="invoice">Invoice</option>
              <option value="receipt">Receipt</option>
              <option value="note">Note</option>
            </select>
          </label>
          <label>
            Who
            <input
              value={draft.counterparty}
              onChange={(event) => setDraft({ ...draft, counterparty: event.target.value })}
              placeholder="Harbor & Co"
            />
          </label>
          <label>
            Amount
            <input
              inputMode="decimal"
              value={draft.amount}
              onChange={(event) => setDraft({ ...draft, amount: event.target.value })}
              placeholder="6800"
            />
          </label>
          <label>
            Due
            <input
              type="date"
              value={draft.dueOn}
              onChange={(event) => setDraft({ ...draft, dueOn: event.target.value })}
            />
          </label>
          <label>
            What they said
            <textarea
              value={draft.text}
              onChange={(event) => setDraft({ ...draft, text: event.target.value })}
              placeholder="We might push this to next quarter."
            />
          </label>
          <button className="btn" type="submit">Add to the desk</button>
        </form>

        <div className="row">
          <button className="btn-quiet" type="button" onClick={() => { setShowCsv((v) => !v); setShowReceipt(false); }}>
            Midday CSV
          </button>
          <button className="btn-quiet" type="button" onClick={() => { setShowReceipt((v) => !v); setShowCsv(false); }}>
            receipt-ocr JSON
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
              {showCsv ? "Import CSV" : "Import receipt"}
            </button>
          </div>
        ) : null}
        {notice ? <p className="notice">{notice}</p> : null}
      </section>

      <section>
        <Queue title="Chase" hint="Sorted by amount × chance it arrives" rows={byAction(interpreted, "chase")} selected={current.item.id} onSelect={setSelected} />
        <div className="queues">
          <Queue title="Review" hint="Held. Confidence or the deduction is in the middle." rows={byAction(interpreted, "review")} selected={current.item.id} onSelect={setSelected} />
          <Queue title="File" hint="Clear enough to keep, at your rate" rows={byAction(interpreted, "file")} selected={current.item.id} onSelect={setSelected} />
        </div>
        <Queue title="Left alone" hint="Personal, a transfer, or a client who will not pay" rows={byAction(interpreted, "drop")} selected={current.item.id} onSelect={setSelected} />
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
      {rows.length === 0 ? <p className="fine">Nothing here.</p> : null}
      {rows.map((row) => (
        <button
          key={row.item.id}
          type="button"
          className={row.item.id === selected ? "card on" : "card"}
          onClick={() => onSelect(row.item.id)}
        >
          <b>{row.item.counterparty}</b>
          <span className="money">
            {usd(row.item.amount)}
            {row.action === "chase" ? ` · ${usd(row.expectedCash)} expected` : ""}
            {row.action === "file" ? ` · ${usd(row.kept)} kept` : ""}
          </span>
          <span className="fine">
            {row.item.kind === "invoice" ? dueLabel(row.item.dueOn, row.item.asOf) : row.item.text}
            {" · "}
            {row.raw.source === "jev" ? row.raw.model : "Local"}
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
      <span className={`pill ${row.action}`}>{row.action}</span>
      <h2>{row.item.counterparty}</h2>
      <p className="money">{usd(row.item.amount)}</p>
      <p>{row.explanation}</p>
      {letter ? (
        <>
          <p className="fine">
            {row.letter === "write_off" ? "Note for you, not a letter to send." : LETTER_LABEL[row.letter]}
          </p>
          <p className="letter">{letter}</p>
          {row.letter !== "write_off" ? (
            <button className="btn-quiet" type="button" onClick={copy}>
              {copied ? "Copied" : "Copy letter"}
            </button>
          ) : null}
        </>
      ) : null}

      <h3>Book</h3>
      {BOOKS.map((book) => (
        <Meter key={book} label={bookLabel(book)} value={row.raw.book.probabilities[book]} mark={row.raw.book.choice === book} />
      ))}
      <p className="fine">Book confidence {pct(row.raw.book.confidence)}. Below 55% stays in review.</p>

      <h3>Odds</h3>
      <Meter label="Arrives if you follow up" value={row.raw.willCollect} />
      <Meter label="Worth a follow-up today" value={row.raw.worthChase} />
      <Meter label="Business cost to keep" value={row.raw.deductible} />

      <h3>Pressure</h3>
      <p className="fine">
        Urgency {row.raw.urgency.score.toFixed(1)} of 3 — {level(URGENCY, row.raw.urgency.score)}.
        Relationship {row.raw.relationship.score.toFixed(1)} of 3 — {level(RELATIONSHIP, row.raw.relationship.score)}.
      </p>
      <p className="fine">
        Letter weights: {LETTERS.map((id) => `${LETTER_LABEL[id]} ${pct(row.raw.letter.probabilities[id])}`).join(" · ")}
      </p>
      <p className="fine">
        {row.raw.source === "jev"
          ? `Jev ${row.raw.model}${row.raw.inputTokens ? `, ${row.raw.inputTokens} input tokens` : ""}.`
          : "Local rehearsal. Desk runs the same seven questions on Jev."}
      </p>
      <button className="btn" type="button" onClick={onJev} disabled={pending}>
        {pending ? "Asking Jev…" : "Run on Jev"}
      </button>
    </aside>
  );
}

function Meter({ label, value, mark }: { label: string; value: number; mark?: boolean }) {
  return (
    <div className="meter">
      <span className="fine">{mark ? `${label} · chosen` : label} {pct(value)}</span>
      <i><b style={{ width: `${Math.round(value * 100)}%` }} /></i>
    </div>
  );
}

function level(labels: readonly string[], score: number): string {
  const index = Math.max(0, Math.min(labels.length - 1, Math.round(score)));
  return labels[index];
}
