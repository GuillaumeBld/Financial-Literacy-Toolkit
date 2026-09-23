import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import { deskCookieValid, signDesk, verifyStripeSignature } from "../src/lib/billing";
import { itemFromReceiptOcr, itemsFromCsv } from "../src/lib/intake";
import { money } from "../src/lib/format";
import { formatDay, renderLetter } from "../src/lib/letters";
import { parseReading } from "../src/lib/jev";
import { byAction, interpret, weekTotals } from "../src/lib/money";
import { rehearse } from "../src/lib/rehearsal";
import { samples } from "../src/lib/samples";
import { BOOKS, LETTERS } from "../src/lib/types";

const tax = 0.25;

function week() {
  return samples.map((item) => interpret(item, rehearse(item), tax));
}

test("sample week chases the likely invoice first and drops the refusal", () => {
  const rows = week();
  const chase = byAction(rows, "chase");
  assert.deepEqual(
    chase.map((row) => row.item.id),
    ["harbor", "northwind"],
  );
  assert.equal(chase[0].expectedCash, 5508);
  assert.equal(chase[1].expectedCash, 1104);
  assert.equal(weekTotals(rows).chase, 6612);

  const kite = rows.find((row) => row.item.id === "kite");
  assert.equal(kite?.action, "drop");
  assert.equal(kite?.letter, "write_off");
  assert.equal(kite?.expectedCash, 0);
});

test("clear software is filed and mixed costs stay in review", () => {
  const rows = week();
  const adobe = rows.find((row) => row.item.id === "adobe");
  const flight = rows.find((row) => row.item.id === "united");
  const meal = rows.find((row) => row.item.id === "cafe");
  const groceries = rows.find((row) => row.item.id === "foods");
  assert.equal(adobe?.action, "file");
  assert.equal(adobe?.kept, 13.8);
  assert.equal(flight?.action, "review");
  assert.equal(flight?.kept, 88);
  assert.equal(meal?.action, "review");
  assert.equal(groceries?.action, "drop");
  assert.equal(weekTotals(rows).filed, 13.8);
  assert.equal(weekTotals(rows).review, 90.02);
});

test("a low book confidence never auto-files", () => {
  const item = samples[0];
  const raw = rehearse(item);
  raw.book.confidence = 0.4;
  raw.willCollect = 0.99;
  raw.worthChase = 0.99;
  const row = interpret(item, raw, tax);
  assert.equal(row.action, "review");
});

test("letter template carries the amount and the name", () => {
  const harbor = samples[0];
  const text = renderLetter("due_today", harbor);
  assert.match(text, /Bonjour Harbor & Co/);
  assert.ok(text.includes(money(6800)));
  assert.ok(text.includes(formatDay("2026-09-25")));
});

test("rehearsal probabilities cover every option", () => {
  const raw = rehearse(samples[0]);
  const books = BOOKS.reduce((sum, key) => sum + raw.book.probabilities[key], 0);
  const letters = LETTERS.reduce((sum, key) => sum + raw.letter.probabilities[key], 0);
  assert.ok(Math.abs(books - 1) < 1e-9);
  assert.ok(Math.abs(letters - 1) < 1e-9);
});

test("receipt-ocr JSON becomes a receipt", () => {
  const item = itemFromReceiptOcr(
    {
      merchant_name: "Adobe",
      merchant_address: "San Jose",
      transaction_date: "2026-09-20",
      transaction_time: "09:00:00",
      total_amount: 59.99,
      line_items: [{ item_name: "Creative Cloud", item_quantity: 1, item_price: 59.99 }],
    },
    "2026-09-23",
  );
  assert.ok(item);
  assert.equal(item?.source, "receipt-ocr");
  assert.equal(item?.kind, "receipt");
  assert.equal(item?.amount, 59.99);
  assert.equal(interpret(item!, rehearse(item!), tax).action, "file");
});

test("a Midday CSV keeps sign, due date, and quoted commas", () => {
  const csv = [
    "date,description,amount,category,notes",
    '2026-09-01,"Harbor, Co",6800.00,Income,"Due 2026-09-25. New client."',
    "2026-09-20,Adobe,-59.99,Software,Creative Cloud",
  ].join("\n");
  const { items, error } = itemsFromCsv(csv, "2026-09-23");
  assert.equal(error, null);
  assert.equal(items[0].counterparty, "Harbor, Co");
  assert.equal(items[0].kind, "invoice");
  assert.equal(items[0].dueOn, "2026-09-25");
  assert.equal(items[0].source, "midday");
  assert.equal(items[1].kind, "receipt");
  assert.equal(items[1].amount, 59.99);
});

test("Jev payloads parse into the same reading the desk gates on", () => {
  const raw = parseReading({
    model: "jev-1.13.0",
    usage: { input_tokens: 420, output_tokens: 0 },
    answers: {
      book: {
        type: "choice",
        choice: "income",
        confidence: 0.91,
        probabilities: { income: 0.9, expense: 0.04, transfer: 0.03, ignore: 0.03 },
      },
      letter: {
        type: "choice",
        choice: "due_today",
        confidence: 0.8,
        probabilities: {
          gentle_nudge: 0.05,
          due_today: 0.75,
          past_due_firm: 0.05,
          final_notice: 0.05,
          write_off: 0.05,
          none: 0.05,
        },
      },
      will_collect: { type: "noul", noul: 0.81 },
      worth_chase: { type: "noul", noul: 0.86 },
      deductible: { type: "noul", noul: 0.04 },
      urgency: { type: "score", score: 2.1, confidence: 0.7 },
      relationship: { type: "score", score: 0.2, confidence: 0.7 },
    },
  });
  assert.equal(raw.source, "jev");
  assert.equal(raw.model, "jev-1.13.0");
  assert.equal(raw.inputTokens, 420);
  const row = interpret(samples[0], raw, tax);
  assert.equal(row.action, "chase");
  assert.equal(row.expectedCash, 5508);
});

test("a broken Jev choice is rejected", () => {
  assert.throws(() => parseReading({ answers: { book: { choice: "magic" } } }));
});

test("desk cookie round-trips and stripe signatures reject tampering", () => {
  process.env.TILL_COOKIE_SECRET = "test-secret";
  process.env.TILL_OPEN = "0";
  const token = signDesk(1_700_000_000_000);
  assert.equal(deskCookieValid(token, 1_700_000_000_000), true);
  assert.equal(deskCookieValid(`${token}x`, 1_700_000_000_000), false);

  const secret = "whsec_test";
  const payload = JSON.stringify({ type: "checkout.session.completed" });
  const timestamp = 1_700_000_000;
  const signature = createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
  assert.equal(
    verifyStripeSignature(payload, `t=${timestamp},v1=${signature}`, secret, timestamp),
    true,
  );
  assert.equal(
    verifyStripeSignature(payload, `t=${timestamp},v1=${signature}`, secret, timestamp + 10_000),
    false,
  );
});

test("transfer between your own accounts is dropped", () => {
  const item = {
    ...samples[3],
    id: "move",
    kind: "note" as const,
    counterparty: "Checking",
    amount: 500,
    text: "Virement de mon propre argent du compte courant vers l'épargne.",
  };
  assert.equal(interpret(item, rehearse(item), tax).action, "drop");
});
