"use client";

import { useEffect, useState } from "react";
import { decide, markPaper, openPaper, traderCommand } from "@/lib/decide";
import { euros, pct, pts } from "@/lib/format";
import { SAMPLES } from "@/lib/markets";
import { EVIDENCE_LABEL, ISSUE_LABEL, type Market, type Paper, type Reading } from "@/lib/types";

const KEY = "lisiere.book.v1";

const CHIPS = [
  { id: "quiet", label: "Rien de neuf", text: "Rien de neuf." },
  {
    id: "for",
    label: "Pour le premier",
    text: "Un fait solide va dans le sens du premier résultat, et la foule n'a pas encore bougé.",
  },
  {
    id: "against",
    label: "Contre le premier",
    text: "Un fait solide va contre le premier résultat, et la foule n'a pas encore bougé.",
  },
  {
    id: "fog",
    label: "Question floue",
    text: "La résolution est ambiguë : pas de date, et deux lectures restent possibles.",
  },
];

export function Stage() {
  const [markets, setMarkets] = useState<Market[]>(SAMPLES);
  const [id, setId] = useState(SAMPLES[0].id);
  const [fact, setFact] = useState("");
  const [reading, setReading] = useState<Reading | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [live, setLive] = useState(false);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [ready, setReady] = useState(false);

  const market = markets.find((item) => item.id === id) ?? markets[0];
  const decision = market && reading ? decide(market, reading) : null;

  useEffect(() => {
    const saved = localStorage.getItem(KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Paper[];
        if (Array.isArray(parsed)) setPapers(parsed);
      } catch {
        localStorage.removeItem(KEY);
      }
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(KEY, JSON.stringify(papers));
  }, [papers, ready]);

  useEffect(() => {
    let stop = false;
    async function pull() {
      try {
        const response = await fetch("/api/markets");
        const body = (await response.json()) as { markets?: Market[] };
        if (stop || !body.markets?.length) return;
        setMarkets(body.markets);
        setId((current) => (body.markets!.some((item) => item.id === current) ? current : body.markets![0].id));
      } catch {
        if (!stop) setNotice("Les marchés en direct n'ont pas répondu. La scène reste sur les exemples.");
      }
    }
    pull();
    const timer = setInterval(pull, 20000);
    return () => {
      stop = true;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!market) return;
    void ask(market, fact);
    // Chips and the form call ask() with the new fact. This effect covers a new market or the Jev switch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [market?.id, live]);

  async function ask(next: Market, text: string) {
    setPending(true);
    try {
      const response = await fetch("/api/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ market: next, fact: text, live }),
      });
      const body = (await response.json()) as { raw?: Reading; notice?: string | null; error?: string };
      if (!response.ok || !body.raw) {
        setNotice(body.error ?? "La lecture n'a pas abouti.");
        return;
      }
      setReading(body.raw);
      setNotice(body.notice ?? null);
    } catch {
      setNotice("La lecture n'a pas abouti.");
    } finally {
      setPending(false);
    }
  }

  function take() {
    if (!market || !decision) return;
    const paper = openPaper(market, decision, new Date().toISOString());
    if (!paper) return;
    setPapers((current) => [paper, ...current.filter((item) => item.marketId !== market.id)]);
  }

  if (!market || !decision || !reading) {
    return <p className="wait" role="status">Ouverture de la scène…</p>;
  }

  const open = papers.find((item) => item.marketId === market.id);
  const marked = open ? markPaper(open, market.price) : null;

  return (
    <div className="scene">
      <header className="top">
        <a className="brand" href="/">
          <strong>Lisière</strong>
          <span>Jev contre la foule</span>
        </a>
        <label className="live">
          <input type="checkbox" checked={live} onChange={(event) => setLive(event.target.checked)} />
          Envoyer à Jev
        </label>
      </header>

      <div className="layout">
        <aside className="rail" aria-label="Marchés">
          {markets.map((item) => (
            <button
              key={item.id}
              type="button"
              className={item.id === market.id ? "mkt on" : "mkt"}
              aria-pressed={item.id === market.id}
              onClick={() => setId(item.id)}
            >
              <b>{item.question}</b>
              <span className="fine">
                {item.outcomes[0]} {pct(item.price)}
                {item.source === "sample" ? " · exemple" : ""}
              </span>
            </button>
          ))}
        </aside>

        <section className="board">
          <p className="kicker">
            {market.source === "polymarket" ? "Prix Polymarket, en direct" : "Exemple figé"}
            {reading.source === "jev" ? " · lu par Jev" : " · lecture locale"}
          </p>
          <h1>{market.question}</h1>

          <div className="hero" aria-live="polite">
            <article>
              <span>Foule · {market.outcomes[0]}</span>
              <strong>{pct(market.price)}</strong>
            </article>
            <article>
              <span>Jev · {market.outcomes[0]}</span>
              <strong className="jev">{pct(reading.yes)}</strong>
            </article>
            <article>
              <span>Écart</span>
              <strong className={decision.edge >= 0 ? "up" : "down"}>{pts(decision.edge)}</strong>
            </article>
          </div>

          <div className="track" aria-hidden="true">
            <i className="pin crowd" style={{ left: `${market.price * 100}%` }} />
            <i className="pin jev" style={{ left: `${reading.yes * 100}%` }} />
          </div>
          <p className="legend">
            <span><i className="swatch crowd" /> foule</span>
            <span><i className="swatch jev" /> Jev</span>
          </p>

          <p className={decision.side === "watch" ? "stance watch" : "stance take"} role="status">
            {decision.side === "watch" ? "Regarder" : `Papier sur ${market.outcomes[decision.side === "a" ? 0 : 1]}`}
            {" — "}
            {decision.reason}
          </p>

          <div className="dists">
            <Mass
              title="La question"
              parts={(["clear", "ambiguous", "unresolvable"] as const).map((key) => ({
                label: ISSUE_LABEL[key],
                value: reading.issue.probabilities[key],
                on: reading.issue.choice === key,
              }))}
            />
            <Mass
              title={`${market.outcomes[0]} ou ${market.outcomes[1]}`}
              parts={[
                { label: market.outcomes[0], value: reading.yes, on: true },
                { label: market.outcomes[1], value: 1 - reading.yes, on: false },
              ]}
            />
            <Mass
              title="Le fait"
              parts={(["thin", "mixed", "solid"] as const).map((key) => ({
                label: EVIDENCE_LABEL[key],
                value: reading.evidence.probabilities[key],
                on: reading.evidence.choice === key,
              }))}
            />
            <Mass
              title="Ça vaut un papier"
              parts={[
                { label: "Oui", value: reading.worth, on: reading.worth >= 0.55 },
                { label: "Non", value: 1 - reading.worth, on: reading.worth < 0.55 },
              ]}
            />
          </div>

          <form
            className="fact"
            onSubmit={(event) => {
              event.preventDefault();
              void ask(market, fact);
            }}
          >
            <label>
              Ajouter un fait, puis regarder la masse bouger
              <textarea
                value={fact}
                onChange={(event) => setFact(event.target.value)}
                placeholder="Un procès-verbal, un sondage, une date."
              />
            </label>
            <div className="chips">
              {CHIPS.map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  className="btn-quiet"
                  onClick={() => {
                    setFact(chip.text);
                    void ask(market, chip.text);
                  }}
                >
                  {chip.label}
                </button>
              ))}
              <button className="btn" type="submit" disabled={pending}>
                {pending ? "Lecture…" : "Relire"}
              </button>
            </div>
          </form>

          {notice ? <p className="notice" role="alert">{notice}</p> : null}

          <div className="ticket">
            {open && marked ? (
              <>
                <p className="money">
                  Papier ouvert sur {open.outcome} à {pct(open.entry)}. Marque {euros(marked.pnl)}.
                </p>
                <p className="fine">Même geste que le papier étoilé, sans envoyer d'ordre :</p>
                <code>{traderCommand(open)}</code>
              </>
            ) : (
              <button className="btn" type="button" disabled={decision.side === "watch" || pending} onClick={take}>
                Ouvrir un papier de 100 €
              </button>
            )}
            <p className="fine">
              Aucun ordre réel. Le prix vient de Polymarket. Le papier suit l'idée de{" "}
              <a href="https://github.com/agent-next/polymarket-paper-trader">polymarket-paper-trader</a>
              {" "}— un achat au prix de la foule, le résultat reste sur cet appareil.
            </p>
          </div>

          {papers.length > 0 ? (
            <ul className="book">
              {papers.map((paper) => {
                const quote = markets.find((item) => item.id === paper.marketId);
                const pnl = quote ? markPaper(paper, quote.price).pnl : 0;
                return (
                  <li key={paper.id}>
                    <span>{paper.outcome}</span>
                    <b className={pnl >= 0 ? "up" : "down"}>{euros(pnl)}</b>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </section>
      </div>
    </div>
  );
}

function Mass({
  title,
  parts,
}: {
  title: string;
  parts: { label: string; value: number; on: boolean }[];
}) {
  return (
    <div className="dist">
      <p>{title}</p>
      <div className="mass">
        {parts.map((part) => (
          <span key={part.label} className={part.on ? "on" : ""} style={{ width: `${Math.max(part.value, 0.02) * 100}%` }}>
            {part.label} {pct(part.value)}
          </span>
        ))}
      </div>
    </div>
  );
}
