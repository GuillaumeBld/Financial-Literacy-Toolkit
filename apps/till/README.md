# Till

Une caisse pour indépendants. Elle décide quelle facture relancer, quel reçu classer, et quelle ligne laisser.

Solo est gratuit et tourne sur cet appareil. Bureau coûte 19 € par mois et envoie chaque ligne à [Jev](https://typesafe.ai/), le modèle de décision de TypeSafe. Jev répond à sept questions étroites : le livre, la lettre, deux chances de relance, un filtre de dépense, l'urgence, la relation. Till les combine dans le code et ne classe pas une réponse peu sûre.

L'interface, les lettres et la semaine d'exemple sont en français.

## Ce que vous pouvez vendre

- **Solo — 0 €.** Semaine d'exemple, vos lignes, lectures locales, lettres à copier, CSV.
- **Bureau — 19 €/mois.** Le même bureau, noté par Jev, après un paiement Stripe.

La lettre est un modèle que Till remplit. Jev choisit seulement lequel. Rien n'est envoyé tant que l'utilisateur ne copie pas le texte.

Deux projets déjà en favori servent d'entrée :

- le CSV de transactions [Midday](https://github.com/midday-ai/midday) (`date`, `description`, `amount` ou `montant`, `category`)
- le JSON [receipt-ocr](https://github.com/bhimrazy/receipt-ocr) (`merchant_name`, `total_amount`, `transaction_date`, `line_items`)

## Lancer

Depuis la racine du dépôt :

```bash
pnpm install
pnpm --filter till dev
```

Ouvrir http://localhost:3210

## Encaisser Bureau

À poser sur le serveur :

- `TYPESAFE_API_KEY` — Jev
- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_DESK` — un prix récurrent à 19 €
- `STRIPE_WEBHOOK_SECRET` — pour accepter les événements Stripe signés
- `TILL_COOKIE_SECRET` — signe le cookie Bureau de 32 jours (sinon, le secret Stripe)

`TILL_OPEN=1` traite chaque visiteur comme Bureau. À réserver à une machine que vous contrôlez.

Sans clés Stripe, le paiement explique ce qui manque et le bureau tourne quand même. Sans clé Jev, Bureau reste sur la lecture locale.

Till classe des priorités. Ce n'est pas un conseiller fiscal. Le montant « conservé » utilise un taux choisi par l'utilisateur (25 % par défaut) pour comparer les dépenses. Ce n'est pas une position de déclaration.

L'accès après un paiement réussi dure 32 jours. Annuler l'abonnement dans Stripe ne révoque pas ce cookie plus tôt.
