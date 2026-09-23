import { CheckoutButton } from "@/components/checkout-button";
import { dueLabel, usd } from "@/lib/format";
import { byAction, interpret, weekTotals } from "@/lib/money";
import { rehearse } from "@/lib/rehearsal";
import { renderLetter } from "@/lib/letters";
import { samples } from "@/lib/samples";

export default function HomePage() {
  const rows = samples.map((item) => interpret(item, rehearse(item), 0.25));
  const totals = weekTotals(rows);
  const chase = byAction(rows, "chase");
  const harbor = rows.find((row) => row.item.id === "harbor");

  return (
    <main>
      <section className="hero">
        <p className="kicker">For freelancers who already did the work</p>
        <h1>Get the cash you are already owed.</h1>
        <p className="lede">
          Till reads an invoice, a receipt, or a Midday export and decides what to chase,
          what to file, and what to leave alone. Jev scores the odds. A gate in the code
          holds back anything it is not sure about. The letter is a template, filled with
          the amount and the name, ready to copy.
        </p>
        <div className="row">
          <a className="btn" href="/desk">Open the sample week</a>
          <a className="btn-quiet" href="#pricing">$19 a month</a>
        </div>
      </section>

      <section className="sheet totals" aria-label="Sample week">
        <article>
          <span>Sample week, if you send the letters</span>
          <strong>{usd(totals.chase)}</strong>
        </article>
        <article>
          <span>Expenses clear enough to file</span>
          <strong>{usd(totals.filed)}</strong>
        </article>
        <article>
          <span>Held for you to decide</span>
          <strong>{usd(totals.review)}</strong>
        </article>
      </section>

      <section className="section">
        <div className="board">
          {chase.map((row) => (
            <article className="card" key={row.item.id}>
              <b>{row.item.counterparty}</b>
              <span className="money">
                {usd(row.item.amount)} · {dueLabel(row.item.dueOn, row.item.asOf)}
              </span>
              <span className="fine">
                {usd(row.expectedCash)} expected if you follow up
              </span>
            </article>
          ))}
          <article className="card">
            <b>Kite &amp; Co</b>
            <span className="money">$1,100.00 · left alone</span>
            <span className="fine">They refused. Another email will not collect it.</span>
          </article>
        </div>
      </section>

      {harbor ? (
        <section className="section split">
          <div>
            <h2>The letter is chosen, not written by a model.</h2>
            <p>
              Jev picks one of six letters. Till fills in the name, the amount, and the
              date. You copy it. Nothing is sent on its own.
            </p>
            <p className="letter">{renderLetter(harbor.letter, harbor.item)}</p>
          </div>
          <div>
            <h2>What you bring in</h2>
            <ol className="steps">
              <li>
                A Midday transactions CSV — date, description, amount, category — from
                the export you already starred.
              </li>
              <li>
                A receipt-ocr JSON file: merchant, total, date, and line items.
              </li>
              <li>
                Or type the note a client actually sent. Seven narrow questions, one
                Jev call, then the gate.
              </li>
            </ol>
          </div>
        </section>
      ) : null}

      <section className="section" id="pricing">
        <h2>Price</h2>
        <div className="sheet prices">
          <article className="price">
            <h3>Solo</h3>
            <div className="amt">$0</div>
            <ul>
              <li>The sample week and your own items, on this device</li>
              <li>Local readings, letters, and a CSV</li>
              <li>Enough to see the order of the chase</li>
            </ul>
            <p><a className="btn-quiet" href="/desk">Use the desk</a></p>
          </article>
          <article className="price">
            <h3>Desk</h3>
            <div className="amt">$19<span className="fine">/mo</span></div>
            <ul>
              <li>The same items, scored by Jev</li>
              <li>Confidence stays visible, and low confidence stays in review</li>
              <li>You pay for the decision, not for another chatbot ledger</li>
            </ul>
            <CheckoutButton />
          </article>
        </div>
      </section>

      <p className="foot">
        Till ranks work. It is not a tax advisor, an accountant, or a lawyer. The
        “kept” figure uses a rate you set, 25% unless you change it, so you can compare
        expenses. It is not a filing position. A refused invoice is dropped because the
        chance of collection is low, not because a model said the debt disappeared.
      </p>
    </main>
  );
}
