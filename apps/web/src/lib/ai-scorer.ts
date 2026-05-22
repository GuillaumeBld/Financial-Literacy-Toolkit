/**
 * SDM-10 AI Scoring Library
 * Scores open-ended student responses via OpenRouter API.
 * Called asynchronously after assessment submission (fire-and-forget).
 */

import { query } from '@/lib/db';
import { ITEM_CONFIGS, type ItemConfig } from '@/lib/sdm-item-configs';

const MODEL = 'openai/gpt-4.1';
const DELAY_MS = 300;

// ---------------------------------------------------------------------------
// SYSTEM PROMPT
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
function buildDiagnosePrompt(config: ItemConfig, responseText: string): string {
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

function buildConfirmPrompt(config: ItemConfig, responseText: string): string {
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
  apiKey: string
): Promise<string> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://financial-literacy.qualiaai.fr',
      'X-Title': 'Financial Literacy Toolkit SDM Scorer',
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0,
      max_tokens: 300,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
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
// HELPERS
// ---------------------------------------------------------------------------
function parseAiResponse(text: string): Record<string, unknown> {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }
  cleaned = cleaned.trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    return { error_type: 'parse_failed', raw: cleaned.slice(0, 200) };
  }
}

function extractResponseText(rawAnswer: unknown): string {
  if (typeof rawAnswer === 'string') return rawAnswer;
  if (rawAnswer && typeof rawAnswer === 'object') {
    const obj = rawAnswer as Record<string, unknown>;
    return String(obj.answer || obj.text || obj.response || JSON.stringify(obj));
  }
  return String(rawAnswer || '');
}

function mapConfidence(conf: unknown): number {
  switch (conf) {
    case 'high': return 0.9;
    case 'medium': return 0.7;
    case 'low': return 0.5;
    default: return 0.5;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function isTransientError(errorType: string, message: string): boolean {
  if (errorType !== 'api_error') return false;
  return /429|timeout|ECONNRESET|ETIMEDOUT|ENOTFOUND/i.test(message);
}

function buildErrorFlags(
  errorType: string,
  message: string,
  model: string,
  retryCount = 0
): AiErrorFlags {
  return {
    error_type: errorType,
    message,
    scored_at: new Date().toISOString(),
    model,
    retry_count: retryCount,
    eligible_for_retry: isTransientError(errorType, message),
  };
}

// ---------------------------------------------------------------------------
// MAIN ENTRY POINT
// ---------------------------------------------------------------------------
interface AiErrorFlags {
  error_type: string;
  message: string;
  scored_at: string;
  model: string;
  retry_count: number;
  eligible_for_retry: boolean;
}

interface ResponseRow {
  response_id: string;
  raw_answer: unknown;
  confidence: number;
  variant_type: string;
  anchor_item_id: string;
  subdomain: string;
  domain: string;
}

/**
 * Score all unscored open-ended responses for a given attempt.
 * Designed to be called fire-and-forget after submission.
 * Never throws — all errors are caught and logged.
 */
export async function scoreOpenEndedResponses(attemptId: string): Promise<void> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.warn('[AI Scorer] OPENROUTER_API_KEY not set, skipping scoring');
    return;
  }

  try {
    const result = await query<ResponseRow>(
      `SELECT r.response_id, r.raw_answer, r.confidence,
              i.variant_type, i.anchor_item_id, i.subdomain, i.domain
       FROM responses r
       JOIN items i ON r.item_id = i.item_id
       WHERE r.attempt_id = $1
         AND i.variant_type IN ('Open_Diagnose', 'Open_Confirm')
         AND r.ai_flags IS NULL`,
      [attemptId]
    );

    const rows = result.rows;
    if (rows.length === 0) {
      console.log('[AI Scorer] No unscored open-ended responses for attempt', attemptId);
      return;
    }

    console.log(`[AI Scorer] Scoring ${rows.length} responses for attempt ${attemptId}`);

    let scored = 0;
    let errors = 0;

    for (const row of rows) {
      const config = ITEM_CONFIGS[row.anchor_item_id];
      if (!config) {
        await query(
          'UPDATE responses SET ai_flags = $1 WHERE response_id = $2',
          [JSON.stringify({ ...buildErrorFlags('no_config', `No item config found for anchor_item_id: ${row.anchor_item_id}`, MODEL), anchor_item_id: row.anchor_item_id }), row.response_id]
        );
        errors++;
        continue;
      }

      const responseText = extractResponseText(row.raw_answer);
      const isDiagnose = row.variant_type === 'Open_Diagnose';
      const userPrompt = isDiagnose
        ? buildDiagnosePrompt(config, responseText)
        : buildConfirmPrompt(config, responseText);

      try {
        const aiText = await callOpenRouter(SYSTEM_PROMPT, userPrompt, apiKey);
        const parsed = parseAiResponse(aiText);

        parsed.scored_at = new Date().toISOString();
        parsed.model = MODEL;
        parsed.scorer_version = '1.0';

        if (parsed.error_type) {
          const errorFlags = {
            ...buildErrorFlags(
              parsed.error_type as string,
              `AI response parse failed: ${(parsed.raw as string) ?? ''}`.slice(0, 200),
              MODEL
            ),
            ...(parsed.raw !== undefined ? { raw: parsed.raw } : {}),
          };
          await query(
            'UPDATE responses SET ai_flags = $1 WHERE response_id = $2',
            [JSON.stringify(errorFlags), row.response_id]
          );
          errors++;
        } else {
          const credit = typeof parsed.credit === 'number' ? parsed.credit : 0;
          const conf = mapConfidence(parsed.classification_confidence);

          await query(
            'UPDATE responses SET ai_flags = $1, score = $2, ai_confidence = $3 WHERE response_id = $4',
            [JSON.stringify(parsed), credit, conf, row.response_id]
          );
          scored++;
        }
      } catch (err) {
        const msg = String(err).slice(0, 200);
        await query(
          'UPDATE responses SET ai_flags = $1 WHERE response_id = $2',
          [JSON.stringify(buildErrorFlags('api_error', msg, MODEL)), row.response_id]
        );
        errors++;
        console.error(`[AI Scorer] API error on ${row.anchor_item_id}:`, String(err).slice(0, 100));
        await sleep(2000); // backoff on error
      }

      await sleep(DELAY_MS);
    }

    console.log(`[AI Scorer] Done: ${scored} scored, ${errors} errors for attempt ${attemptId}`);
  } catch (err) {
    console.error('[AI Scorer] Fatal error for attempt', attemptId, err);
  }
}
