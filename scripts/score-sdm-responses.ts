/**
 * SDM-10 AI Scoring Pipeline
 * Scores open-ended student responses via OpenRouter API and writes results to the database.
 *
 * Usage:
 *   OPENROUTER_API_KEY=sk-or-... npx tsx scripts/score-sdm-responses.ts [flags]
 *
 * Flags:
 *   --limit N        Process only first N unscored responses (default: all)
 *   --dry-run        Build prompts but do not call API or write DB
 *   --item Q6        Only score responses for a specific anchor item
 *   --verbose        Print each API response
 *   --delay 300      Delay between API calls in ms (default: 300)
 *   --model ID       OpenRouter model ID (default: anthropic/claude-sonnet-4.5)
 */

import pg from "pg";
import { ITEM_CONFIGS, type ItemConfig } from "./sdm-item-configs.js";

const { Pool } = pg;

// ---------------------------------------------------------------------------
// CLI ARGS
// ---------------------------------------------------------------------------
function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    limit: 0,
    dryRun: false,
    item: "",
    verbose: false,
    delay: 300,
    model: "anthropic/claude-sonnet-4.5",
  };
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--limit":
        opts.limit = parseInt(args[++i], 10);
        break;
      case "--dry-run":
        opts.dryRun = true;
        break;
      case "--item":
        opts.item = args[++i];
        break;
      case "--verbose":
        opts.verbose = true;
        break;
      case "--delay":
        opts.delay = parseInt(args[++i], 10);
        break;
      case "--model":
        opts.model = args[++i];
        break;
    }
  }
  return opts;
}

// ---------------------------------------------------------------------------
// SYSTEM PROMPT (identical for every API call)
// ---------------------------------------------------------------------------
const SYSTEM_PROMPT = `You are a financial literacy assessment scorer for a university course. Your job is to classify student open-ended responses from an adaptive diagnostic assessment.

CONTEXT:
Students completed a 40-item financial literacy assessment. For items where they answered incorrectly with high confidence, they were asked to explain their reasoning (Diagnose). For items where they answered correctly with low confidence, they were asked to explain why their answer is correct (Confirm).

YOUR TASK:
Classify each response and output a JSON object only. No additional text, no markdown, no code fences.

---

CLASSIFICATION SYSTEM FOR DIAGNOSE RESPONSES:

Diagnosis Types:
  - "misconception": Student holds a specific, identifiable wrong mental model.
  - "knowledge_gap": Student lacks knowledge (IDK, blank, vague, unfamiliar with terms).
  - "selection_error": Student demonstrates correct understanding despite selecting the wrong anchor answer (misread, mis-clicked, or self-corrected while writing).

Decision Tree:
  Step 1: Is the response blank, "IDK," "I don't know," or under 20 characters with no reasoning?
    -> knowledge_gap, credit=0
  Step 2: Does the response demonstrate correct reasoning for the anchor item (student actually understands)?
    -> selection_error, credit=100
  Step 3: Does the student self-correct to the right answer while writing?
    -> selection_error, credit=100
  Step 4: Does the response reveal a specific wrong mental model from the item taxonomy?
    -> misconception, credit=100
  Step 5: Is the reasoning muddled but shows a direction toward a misconception?
    -> misconception, credit=50
  Step 6: Shows unfamiliarity with key terms?
    -> knowledge_gap, credit=0
  Step 7: Cannot classify.
    -> knowledge_gap, credit=0

Credit Scoring (measures diagnostic value, NOT correctness):
  100 = High diagnostic value. Clear misconception OR clear selection error.
  50  = Partial. Muddled misconception, reasoning shows a direction.
  0   = IDK, blank, too short, or unclassifiable.

---

CLASSIFICATION SYSTEM FOR CONFIRM RESPONSES:

Understanding Levels:
  - "verified": Student explains the correct reasoning behind their answer.
  - "partial": Student gives a vague or incomplete explanation.
  - "likely_guess": Student admits guessing, gives wrong reasoning, or cannot explain.

Credit Scoring:
  100 = Verified understanding with mechanism explained.
  50  = Partial understanding, directionally correct but vague.
  0   = Likely guessed, no real understanding demonstrated.

---

IMPORTANT:
- Output ONLY the JSON object. No explanations, no markdown, no code fences.
- evidence_quote must be a direct excerpt from the student response (max 30 words).
- Informal language, slang, or typos: classify the underlying reasoning, not the grammar.
- Detailed wrong explanations get credit=100 (high diagnostic value).
- For DIAGNOSE output: {"diagnosis_type": "...", "layer1_code": "...", "layer2_tag": "...", "credit": N, "classification_confidence": "high|medium|low", "evidence_quote": "...", "reasoning_summary": "..."}
- For CONFIRM output: {"understanding_level": "...", "credit": N, "reasoning_quality": "mechanism_explained|rule_stated|vague|none", "classification_confidence": "high|medium|low", "evidence_quote": "...", "reasoning_summary": "..."}`;

// ---------------------------------------------------------------------------
// PROMPT BUILDERS
// ---------------------------------------------------------------------------
export function buildDiagnosePrompt(config: ItemConfig, responseText: string): string {
  return `ITEM CONTEXT:
  Anchor Question: ${config.question}
  Options: ${config.options}
  Correct Answer: ${config.correct_answer}
  Subdomain: ${config.subdomain}

MISCONCEPTION TAXONOMY FOR THIS ITEM:
${config.taxonomy}

STUDENT'S OPEN-ENDED RESPONSE:
"${responseText}"

Classify this response. Output JSON only.`;
}

export function buildConfirmPrompt(config: ItemConfig, responseText: string): string {
  return `ITEM CONTEXT:
  Anchor Question: ${config.question}
  Correct Answer: ${config.correct_answer}
  Student answered correctly but with low confidence.
  Subdomain: ${config.subdomain}

RUBRIC FOR THIS ITEM:
  Full credit (verified, credit=100): ${config.rubric.accept}
  Partial credit (partial, credit=50): ${config.rubric.partial}
  No credit (likely_guess, credit=0): ${config.rubric.reject}

STUDENT'S OPEN-ENDED RESPONSE:
"${responseText}"

Classify this response. Output JSON only.`;
}

// ---------------------------------------------------------------------------
// OPENROUTER API
// ---------------------------------------------------------------------------
async function callOpenRouter(
  systemPrompt: string,
  userPrompt: string,
  apiKey: string,
  model: string
): Promise<string> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://financial-literacy.qualiaai.fr",
      "X-Title": "Financial Literacy Toolkit SDM Scorer",
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      max_tokens: 300,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  return data.choices[0].message.content;
}

// ---------------------------------------------------------------------------
// RESPONSE PARSING
// ---------------------------------------------------------------------------
export function parseAiResponse(text: string): Record<string, unknown> {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }
  cleaned = cleaned.trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    console.warn(`[parseAiResponse] Failed to parse AI response: ${cleaned.slice(0, 80)}`);
    return { error: "parse_failed", raw: cleaned.slice(0, 200) };
  }
}

export function extractResponseText(rawAnswer: unknown): string {
  if (typeof rawAnswer === "string") return rawAnswer;
  if (rawAnswer && typeof rawAnswer === "object") {
    const obj = rawAnswer as Record<string, unknown>;
    return String(obj.answer || obj.text || obj.response || JSON.stringify(obj));
  }
  return String(rawAnswer || "");
}

export function mapConfidence(conf: unknown): number {
  switch (conf) {
    case "high":
      return 0.9;
    case "medium":
      return 0.7;
    case "low":
      return 0.5;
    default:
      return 0.5;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// PUBLIC TYPES (exported for use by callers and tests)
// ---------------------------------------------------------------------------
export interface ScoreInput {
  responseId: string;
  rawAnswer: unknown;
  variantType: 'Open_Diagnose' | 'Open_Confirm';
  anchorItemId: string;
  metadata?: Record<string, unknown>; // optional caller-provided fields merged into aiFlags on success
}

export interface ScoreResult {
  responseId: string;
  aiFlags: Record<string, unknown>;
  score?: number;         // credit value: 0, 50, or 100
  aiConfidence?: number;  // mapped: 0.5 | 0.7 | 0.9
  error?: string;         // present when scoring failed
}

export type ApiCaller = (systemPrompt: string, userPrompt: string) => Promise<string>;

// ---------------------------------------------------------------------------
// STATELESS SCORER (exported — no DB, no process.env access)
// Returns ScoreResult with error field set on no_config / api_error / parse failure;
// score and aiConfidence populated only on success. Optional metadata in ScoreInput
// is merged into aiFlags on success (use to inject model, scorer_version, etc.).
// ---------------------------------------------------------------------------
export async function score(
  input: ScoreInput,
  callApi: ApiCaller
): Promise<ScoreResult> {
  const config = ITEM_CONFIGS[input.anchorItemId];

  if (!config) {
    return {
      responseId: input.responseId,
      error: "no_config",
      aiFlags: {
        error: "no_config",
        anchor_item_id: input.anchorItemId,
        scored_at: new Date().toISOString(),
      },
    };
  }

  const responseText = extractResponseText(input.rawAnswer);
  const isDiagnose = input.variantType === "Open_Diagnose";
  const userPrompt = isDiagnose
    ? buildDiagnosePrompt(config, responseText)
    : buildConfirmPrompt(config, responseText);

  let aiText: string;
  try {
    aiText = await callApi(SYSTEM_PROMPT, userPrompt);
  } catch (err) {
    return {
      responseId: input.responseId,
      error: "api_error",
      aiFlags: {
        error: "api_error",
        message: String(err).slice(0, 200),
        scored_at: new Date().toISOString(),
      },
    };
  }

  const parsed = parseAiResponse(aiText);
  parsed.scored_at = new Date().toISOString();

  if (parsed.error) {
    return {
      responseId: input.responseId,
      error: String(parsed.error),
      aiFlags: parsed,
    };
  }

  const credit = typeof parsed.credit === "number" ? parsed.credit : 0;
  const conf = mapConfidence(parsed.classification_confidence);

  if (input.metadata) {
    Object.assign(parsed, input.metadata);
  }

  return {
    responseId: input.responseId,
    aiFlags: parsed,
    score: credit,
    aiConfidence: conf,
  };
}

// ---------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------
interface ResponseRow {
  response_id: string;
  raw_answer: unknown;
  confidence: number;
  variant_type: string;
  anchor_item_id: string;
  subdomain: string;
  domain: string;
}

async function main() {
  const opts = parseArgs();
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey && !opts.dryRun) {
    console.error("ERROR: OPENROUTER_API_KEY environment variable required");
    process.exit(1);
  }

  // DB connection — own pool, not the app's db.ts
  const pool = new Pool({
    connectionString:
      process.env.SCORING_DATABASE_URL ||
      "postgresql://finlit_user:FinLit2025SecurePassword@localhost:6432/financial_literacy",
    max: 3,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 5000,
  });

  pool.on("connect", (client) => {
    client.query("SET statement_timeout = 600000"); // 10 min
  });

  try {
    // Build query
    let sql = `
      SELECT r.response_id, r.raw_answer, r.confidence,
             i.variant_type, i.anchor_item_id, i.subdomain, i.domain
      FROM responses r
      JOIN items i ON r.item_id = i.item_id
      WHERE i.variant_type IN ('Open_Diagnose', 'Open_Confirm')
        AND r.ai_flags IS NULL
    `;
    const params: unknown[] = [];

    if (opts.item) {
      params.push(opts.item);
      sql += ` AND i.anchor_item_id = $${params.length}`;
    }

    sql += " ORDER BY r.created_at";

    if (opts.limit > 0) {
      params.push(opts.limit);
      sql += ` LIMIT $${params.length}`;
    }

    const { rows } = await pool.query<ResponseRow>(sql, params);

    const diagnoseCount = rows.filter(
      (r) => r.variant_type === "Open_Diagnose"
    ).length;
    const confirmCount = rows.filter(
      (r) => r.variant_type === "Open_Confirm"
    ).length;

    console.log(
      `Found ${rows.length} unscored responses (${diagnoseCount} diagnose, ${confirmCount} confirm)`
    );
    console.log(`Model: ${opts.model}`);
    console.log(`Delay: ${opts.delay}ms`);

    if (rows.length === 0) {
      console.log("Nothing to score.");
      return;
    }

    // Dry run: show first prompt and exit
    if (opts.dryRun) {
      const first = rows[0];
      const config = ITEM_CONFIGS[first.anchor_item_id];
      if (!config) {
        console.log(
          `No config for anchor_item_id=${first.anchor_item_id}`
        );
        return;
      }
      const responseText = extractResponseText(first.raw_answer);
      const isDiagnose = first.variant_type === "Open_Diagnose";
      const userPrompt = isDiagnose
        ? buildDiagnosePrompt(config, responseText)
        : buildConfirmPrompt(config, responseText);

      console.log("\n=== DRY RUN — First Prompt ===");
      console.log(`Response ID: ${first.response_id}`);
      console.log(`Anchor: ${first.anchor_item_id} (${first.variant_type})`);
      console.log(`Student text: "${responseText.slice(0, 100)}..."`);
      console.log("\n--- SYSTEM PROMPT ---");
      console.log(SYSTEM_PROMPT.slice(0, 300) + "...");
      console.log("\n--- USER PROMPT ---");
      console.log(userPrompt);
      console.log("\n=== End dry run ===");
      return;
    }

    // Scoring loop
    const stats = {
      success: 0,
      errors: 0,
      diagnose: { misconception: 0, knowledge_gap: 0, selection_error: 0 },
      confirm: { verified: 0, partial: 0, likely_guess: 0 },
      confidence: { high: 0, medium: 0, low: 0 },
    };

    const startTime = Date.now();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      const result = await score(
        {
          responseId: row.response_id,
          rawAnswer: row.raw_answer,
          variantType: row.variant_type as 'Open_Diagnose' | 'Open_Confirm',
          anchorItemId: row.anchor_item_id,
          metadata: { model: opts.model, scorer_version: "1.0" },
        },
        (sys, usr) => callOpenRouter(sys, usr, apiKey!, opts.model)
      );

      if (result.error) {
        await pool.query(
          "UPDATE responses SET ai_flags = $1 WHERE response_id = $2",
          [JSON.stringify(result.aiFlags), result.responseId]
        );
        stats.errors++;
        if (result.error === "no_config") {
          console.warn(
            `[${i + 1}/${rows.length}] SKIP: no config for ${row.anchor_item_id}`
          );
        } else {
          console.error(
            `  [${i + 1}] ERROR on ${row.anchor_item_id}: ${result.aiFlags.message ?? result.error}`
          );
          if (result.error === "api_error") {
            await sleep(2000); // backoff on rate-limit / transient API error
          }
        }
      } else {
        await pool.query(
          "UPDATE responses SET ai_flags = $1, score = $2, ai_confidence = $3 WHERE response_id = $4",
          [JSON.stringify(result.aiFlags), result.score, result.aiConfidence, result.responseId]
        );
        stats.success++;

        // Track distributions
        const isDiagnose = row.variant_type === "Open_Diagnose";
        if (isDiagnose) {
          const dt = result.aiFlags.diagnosis_type as string;
          if (dt in stats.diagnose)
            stats.diagnose[dt as keyof typeof stats.diagnose]++;
        } else {
          const ul = result.aiFlags.understanding_level as string;
          if (ul in stats.confirm)
            stats.confirm[ul as keyof typeof stats.confirm]++;
        }
        const confLevel = result.aiFlags.classification_confidence as string;
        if (confLevel in stats.confidence)
          stats.confidence[confLevel as keyof typeof stats.confidence]++;
      }

      if (opts.verbose) {
        console.log(
          `  [${i + 1}] ${row.anchor_item_id} ${row.variant_type}: ${JSON.stringify(result.aiFlags).slice(0, 120)}`
        );
      }

      // Progress
      if ((i + 1) % 50 === 0) {
        console.log(
          `[${i + 1}/${rows.length}] ${stats.success} scored, ${stats.errors} errors`
        );
      }

      await sleep(opts.delay);
    }

    // Summary
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n=== SDM-10 AI Scoring Complete ===`);
    console.log(`Model: ${opts.model}`);
    console.log(`Total processed: ${rows.length}`);
    console.log(`Successful: ${stats.success}`);
    console.log(`Errors: ${stats.errors}`);
    console.log(`Time: ${elapsed}s`);
    console.log(`\nDIAGNOSE DISTRIBUTION:`);
    const dTotal =
      stats.diagnose.misconception +
      stats.diagnose.knowledge_gap +
      stats.diagnose.selection_error;
    if (dTotal > 0) {
      console.log(
        `  misconception:   ${stats.diagnose.misconception} (${((stats.diagnose.misconception / dTotal) * 100).toFixed(1)}%)`
      );
      console.log(
        `  knowledge_gap:   ${stats.diagnose.knowledge_gap} (${((stats.diagnose.knowledge_gap / dTotal) * 100).toFixed(1)}%)`
      );
      console.log(
        `  selection_error: ${stats.diagnose.selection_error} (${((stats.diagnose.selection_error / dTotal) * 100).toFixed(1)}%)`
      );
    }
    console.log(`\nCONFIRM DISTRIBUTION:`);
    const cTotal =
      stats.confirm.verified +
      stats.confirm.partial +
      stats.confirm.likely_guess;
    if (cTotal > 0) {
      console.log(
        `  verified:     ${stats.confirm.verified} (${((stats.confirm.verified / cTotal) * 100).toFixed(1)}%)`
      );
      console.log(
        `  partial:      ${stats.confirm.partial} (${((stats.confirm.partial / cTotal) * 100).toFixed(1)}%)`
      );
      console.log(
        `  likely_guess: ${stats.confirm.likely_guess} (${((stats.confirm.likely_guess / cTotal) * 100).toFixed(1)}%)`
      );
    }
    console.log(`\nCONFIDENCE:`);
    console.log(`  high:   ${stats.confidence.high}`);
    console.log(`  medium: ${stats.confidence.medium}`);
    console.log(`  low:    ${stats.confidence.low} (review recommended)`);
  } finally {
    await pool.end();
  }
}

// Run main() only when executed directly (not when imported by tests)
import { fileURLToPath } from "node:url";
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  // Graceful shutdown
  process.on("SIGINT", () => {
    console.log("\nInterrupted. Partial results saved to DB.");
    process.exit(0);
  });

  main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
}
