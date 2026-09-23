# Till

A cash desk for freelancers. It decides which invoice to chase, which receipt to file, and which item to leave alone.

Solo is free and runs on this device. Desk is $19 a month and sends each item to [Jev](https://typesafe.ai/), TypeSafe’s decision model. Jev answers seven narrow questions (book, letter, two chase odds, a deduction screen, urgency, relationship). Till combines them in code and will not auto-file a low-confidence answer.

## What you can sell

- **Solo — $0.** Sample week, your own items, local readings, copy-ready letters, CSV.
- **Desk — $19/month.** The same desk, scored by Jev, after Stripe checkout.

The letter is a template Till fills in. Jev only picks which template. Nothing is emailed unless the user copies it.

Intake uses two projects from Guillaume’s stars:

- [midday](https://github.com/midday-ai/midday) transaction CSV (`date,description,amount,category,notes`)
- [receipt-ocr](https://github.com/bhimrazy/receipt-ocr) JSON (`merchant_name`, `total_amount`, `transaction_date`, `line_items`)

## Run

From the repo root:

```bash
pnpm install
pnpm --filter till dev
```

Open http://localhost:3210

## Charge for Desk

Set these on the server:

- `TYPESAFE_API_KEY` — Jev
- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_DESK` — a recurring $19 price id
- `STRIPE_WEBHOOK_SECRET` — so signed Stripe events are accepted
- `TILL_COOKIE_SECRET` — signs the 32-day Desk cookie (falls back to the Stripe secret)

`TILL_OPEN=1` treats every visitor as Desk. Use that only on a machine you control.

Without Stripe keys, checkout explains what is missing and the desk still runs. Without a Jev key, Desk stays on the local reading.

Till is a priority desk, not a tax advisor. The “kept” number uses a rate the user sets (default 25%) so expenses can be ranked. It is not a filing position.

Access from a successful checkout lasts 32 days. Canceling a subscription in Stripe does not revoke that cookie early; pair the webhook with a customer record before relying on it for a larger list.
