import { CheckoutButton } from "@/components/checkout-button";
import { dueLabel, money } from "@/lib/format";
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
    <main id="contenu">
      <section className="hero">
        <h1>
          <span className="balance">{money(totals.chase)}</span>
          à encaisser si vous envoyez les deux lettres.
        </h1>
        <p className="lede">
          Till lit une facture, un reçu ou un export Midday, puis décide quoi relancer,
          quoi classer, et quoi laisser. Jev chiffre les chances. Une règle dans le code
          retient ce qui n'est pas sûr. La lettre est un modèle, rempli avec le montant
          et le nom, prêt à copier.
        </p>
        <div className="row">
          <a className="btn" href="/desk">Ouvrir la semaine d'exemple</a>
          <a className="btn-quiet" href="#pricing">19 € par mois</a>
        </div>
      </section>

      <section className="sheet totals" aria-label="Semaine d'exemple">
        <article>
          <span>Semaine d'exemple, si vous envoyez les lettres</span>
          <strong>{money(totals.chase)}</strong>
        </article>
        <article>
          <span>Dépenses assez claires pour classer</span>
          <strong>{money(totals.filed)}</strong>
        </article>
        <article>
          <span>Retenu, à vous de trancher</span>
          <strong>{money(totals.review)}</strong>
        </article>
      </section>

      <section className="section">
        <div className="board">
          {chase.map((row) => (
            <article className="card" key={row.item.id}>
              <b>{row.item.counterparty}</b>
              <span className="money">
                {money(row.item.amount)} · {dueLabel(row.item.dueOn, row.item.asOf)}
              </span>
              <span className="fine">
                {money(row.expectedCash)} attendu si vous relancez
              </span>
            </article>
          ))}
          <article className="card">
            <b>Kite &amp; Co</b>
            <span className="money">{money(1100)} · laissé de côté</span>
            <span className="fine">Ils ont refusé. Un autre message ne ramènera rien.</span>
          </article>
        </div>
      </section>

      {harbor ? (
        <section className="section split">
          <div>
            <h2>La lettre est choisie, pas rédigée par un modèle.</h2>
            <p>
              Jev choisit l'une des six lettres. Till remplit le nom, le montant et la
              date. Vous la copiez. Rien n'est envoyé tout seul.
            </p>
            <p className="letter">{renderLetter(harbor.letter, harbor.item)}</p>
          </div>
          <div>
            <h2>Ce que vous apportez</h2>
            <ol className="steps">
              <li>
                Un CSV de transactions Midday — date, description, montant, catégorie —
                depuis l'export que vous avez déjà mis en favori.
              </li>
              <li>
                Un JSON receipt-ocr : commerçant, total, date et lignes.
              </li>
              <li>
                Ou saisissez le mot qu'un client a vraiment envoyé. Sept questions
                étroites, un appel à Jev, puis la règle.
              </li>
            </ol>
          </div>
        </section>
      ) : null}

      <section className="section" id="pricing">
        <h2>Tarif</h2>
        <div className="sheet prices">
          <article className="price">
            <h3>Solo</h3>
            <div className="amt">0 €</div>
            <ul>
              <li>La semaine d'exemple et vos propres lignes, sur cet appareil</li>
              <li>Lectures locales, lettres, et un CSV</li>
              <li>De quoi voir l'ordre des relances</li>
            </ul>
            <p><a className="btn-quiet" href="/desk">Ouvrir le bureau</a></p>
          </article>
          <article className="price">
            <h3>Bureau</h3>
            <div className="amt">19 €<span className="fine">/mois</span></div>
            <ul>
              <li>Les mêmes lignes, notées par Jev</li>
              <li>La confiance reste visible, et le doute reste à voir</li>
              <li>Vous payez la décision, pas un autre grand livre bavard</li>
            </ul>
            <CheckoutButton />
          </article>
        </div>
      </section>

      <p className="foot">
        Till classe le travail. Ce n'est ni un conseiller fiscal, ni un expert-comptable,
        ni un avocat. Le montant « conservé » utilise un taux que vous fixez, 25 % sauf
        si vous le changez, pour comparer les dépenses. Ce n'est pas une position de
        déclaration. Une facture refusée est laissée de côté parce que la chance
        d'encaisser est faible, pas parce qu'un modèle a effacé la dette.
      </p>
    </main>
  );
}
