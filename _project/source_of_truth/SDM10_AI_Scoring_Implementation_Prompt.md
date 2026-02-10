# SDM-10 AI Scoring: Implementation Prompt

> **Purpose:** Give this file to an AI agent to implement the SDM-10 open-ended scoring pipeline into the Financial Literacy Toolkit.

---

## 1. Project Context

**Repository:** `/root/Financial-Literacy-Toolkit`
**Stack:** Next.js 14 (App Router) / PostgreSQL 15 via PgBouncer / pnpm monorepo
**App code:** `apps/web/src/`
**Database migrations:** `infra/migration-*.sql`
**Existing SDM selection:** `apps/web/src/app/api/plan-b/status/route.ts` (handles real-time SDM item selection)
**Assessment page:** `apps/web/src/app/assessment/page.tsx` (front-end assessment flow, handles SDM display)

### Database Connection

```bash
# Via PgBouncer (production)
docker run --rm --network host postgres:15-alpine psql \
  "postgresql://finlit_user:FinLit2025SecurePassword@localhost:6432/financial_literacy"
```

### Key Database Tables

- `items` — Question bank. SDM items have `is_sdm = true`, `anchor_item_id` (FK to anchor), `sdm_variant_type` (Lower_TF, Lower_MCQ, Same_MCQ, Higher_MCQ, Open_Confirm, Open_Diagnose)
- `responses` — All student responses. Joined with items to get `domain`, `subdomain`, `is_sdm`
- `submissions` — One row per student submission with `submission_type`, timestamps, `domain_scores` (JSONB)

### Data Already Collected (Test 1, Feb 2–9 2026)

- **421 students** completed the assessment
- **3,985 SDM responses** (10 per student)
- **931 open-ended responses** (556 diagnose + 336 confirm, after filtering 40 stale-anchor mismatches)
- **367 students** (87.2%) received at least 1 open-ended item
- Max 3 open-ended items per student (by design)

### Existing Data Export

The open-ended responses are already exported at:
```
exports/sdm_open_answers.csv
```

CSV columns:
```
attempt_id, submission_type, item_id, question_stem, domain, subdomain,
response_type, student_answer, score, confidence, answered_at
```

- `item_id` format: `Q6_Open_Diagnose` or `Q35_Open_Confirm`
- `response_type`: `diagnose` or `confirm`
- `student_answer`: The student's free-text explanation
- `score`: Platform-assigned score (50.00 for all open-ended; to be replaced by AI scoring)
- `confidence`: 1–3 from the anchor item

### Reference Package

All design documents, taxonomy, framework, and existing Python scorer are in:
```
imports/SDM10_Complete_Package/
```

Key reference files:
- `implementation/sdm10_scorer.py` — Working Python scorer (CLI, OpenRouter API)
- `implementation/SDM10_AI_Scoring_Prompts.md` — Complete prompt system
- `implementation/SDM10_Implementation_Guide.md` — Selection algorithm code (Python)
- `research/SDM10_Scoring_Framework_v2.md` — Three-way classification rules
- `research/SDM10_Taxonomy_Revised.md` — 37-family misconception taxonomy
- `research/SDM10_OpenEnded_Analysis_v1.md` — Test 1 response analysis with patterns

---

## 2. What to Implement

Build a scoring pipeline that:

1. **Reads** open-ended responses from the database (or CSV export)
2. **Sends** each response to an LLM (Claude Sonnet via OpenRouter) with an item-specific prompt
3. **Parses** the JSON classification returned by the LLM
4. **Stores** the AI classification back (in the database or output CSV)
5. **Provides** quality checks and summary statistics

### Implementation Options (choose one)

**Option A: Python CLI script** (simplest, like the existing `sdm10_scorer.py`)
- Input: CSV file (`exports/sdm_open_answers.csv`)
- Output: CSV file with appended `ai_score` column containing JSON classification
- Run manually after data collection

**Option B: Next.js API route** (integrated into platform)
- New route: `apps/web/src/app/api/instructor/score-sdm/route.ts`
- Reads from database, scores via API, writes results back to database
- Triggered from instructor dashboard

**Option C: Standalone Node.js script** (middle ground)
- Script in `scripts/score-sdm-responses.ts`
- Uses the same database connection as the app
- Run via `npx tsx scripts/score-sdm-responses.ts`

---

## 3. API Configuration

```
Provider:    OpenRouter (https://openrouter.ai/api/v1)
Model:       anthropic/claude-sonnet-4
Temperature: 0
Max tokens:  300
Rate limit:  ~3 requests/second (0.3s delay between calls)
Est. time:   ~5 minutes for 931 responses
```

The OpenRouter API is OpenAI-compatible:
```typescript
// Node.js / TypeScript
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

const response = await client.chat.completions.create({
  model: "anthropic/claude-sonnet-4",
  temperature: 0,
  max_tokens: 300,
  messages: [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userPrompt },
  ],
});
```

---

## 4. Complete Scoring Configuration

### 4.1 System Prompt (same for every API call)

```
You are a financial literacy assessment scorer for a university course. Your job is to classify student open-ended responses from an adaptive diagnostic assessment.

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
  50  = Moderate. Partial/muddled misconception, reasoning shows a direction.
  0   = Low. IDK, blank, too short, or unclassifiable.

Output Format (Diagnose):
{"diagnosis_type": "misconception|knowledge_gap|selection_error", "layer1_code": "code from taxonomy", "layer2_tag": "tag from taxonomy or null", "credit": 0|50|100, "classification_confidence": "high|medium|low", "evidence_quote": "key phrase from student (max 30 words)", "reasoning_summary": "one sentence explaining what the student believes or does not know"}

---

CLASSIFICATION SYSTEM FOR CONFIRM RESPONSES:

Understanding Levels:
  - "verified": Student explains the mechanism or causal logic correctly.
  - "partial": Student states the correct direction but not the mechanism.
  - "likely_guess": Student cannot explain, admits guessing, or gives incorrect reasoning.

Credit:
  100 = verified (mechanism explained)
  50  = partial (direction correct, mechanism missing)
  0   = likely_guess (no explanation, admitted guess, wrong reasoning)

Output Format (Confirm):
{"understanding_level": "verified|partial|likely_guess", "credit": 0|50|100, "reasoning_quality": "mechanism_explained|rule_stated|vague|none", "classification_confidence": "high|medium|low", "evidence_quote": "key phrase from student (max 30 words)", "reasoning_summary": "one sentence explaining what the student understands or does not"}

---

IMPORTANT RULES:
- Output ONLY the JSON object. No explanations, no markdown, no code fences.
- The evidence_quote must be a direct excerpt from the student's response.
- If the student writes in informal language, slang, or with typos, classify the underlying reasoning.
- A student who writes a detailed wrong explanation gets credit=100 (high diagnostic value).
- A student who writes "I don't know" gets credit=0 (no diagnostic value).
- Self-correcting students are always selection_error.
```

### 4.2 User Prompt Templates

**For DIAGNOSE responses:**
```
ITEM CONTEXT:
  Anchor Question: {question}
  Options: {options}
  Correct Answer: {correct_answer}
  Student's Anchor Answer: {student_answer}
  Subdomain: {subdomain}

MISCONCEPTION TAXONOMY FOR THIS ITEM:
{taxonomy}

STUDENT'S OPEN-ENDED RESPONSE:
"{response_text}"

Classify this response. Output JSON only.
```

**For CONFIRM responses:**
```
ITEM CONTEXT:
  Anchor Question: {question}
  Correct Answer: {correct_answer}
  Student answered correctly but with low confidence.
  Subdomain: {subdomain}

RUBRIC FOR THIS ITEM:
  Full credit (verified, credit=100): {rubric_accept}
  Partial credit (partial, credit=50): {rubric_partial}
  No credit (likely_guess, credit=0): {rubric_reject}

STUDENT'S OPEN-ENDED RESPONSE:
"{response_text}"

Classify this response. Output JSON only.
```

### 4.3 Item Configurations (All 22 Anchor Items)

Each item below has its question text, options, correct answer, subdomain, misconception taxonomy (for diagnose prompts), and rubric (for confirm prompts). Use these verbatim when building the user prompt.

---

#### Q1: Compound Interest

```json
{
  "question": "Suppose you had $100 in a savings account and the interest rate was 2% per year. After 5 years, how much do you think you would have in the account if you left the money to grow?",
  "options": "A) More than $102, B) Exactly $102, C) Less than $102, D) Do not know",
  "correct_answer": "A) More than $102",
  "subdomain": "Compound Interest",
  "taxonomy": "Layer 1 Codes: INT-01 (Interest as fee to saver) | INT-02 (No compounding awareness) | INT-KG (Knowledge gap)\nLayer 2 Tags:\n  - \"interest_as_fee\" [INT-01]: Student believes interest is a charge to the saver, not earnings\n  - \"simple_interest_only\" [INT-02]: Student calculates 2% x $100 = $2 once, gets exactly $102, ignores compounding over 5 years\n  - \"confused_direction\" [INT-KG]: Student unsure whether interest adds to or subtracts from balance\nKnowledge Gap: KG-idk, KG-blank, KG-unfamiliar\nSelection Error: SE-selfcorrect (student realizes correct answer while writing), SE-misread",
  "rubric_accept": "Mentions interest earning interest, compounding, or interest accumulating each year on a growing balance",
  "rubric_partial": "\"Interest adds up over time\" (vague but directionally correct, no compounding mechanism)",
  "rubric_reject": "No explanation of why amount exceeds $102, or incorrect reasoning, or admits guessing"
}
```

#### Q2: Mortgages

```json
{
  "question": "A 15-year mortgage typically requires higher monthly payments than a 30-year mortgage, but the total interest paid over the life of the loan will be less. True or false?",
  "options": "A) True, B) False, C) Do not know",
  "correct_answer": "A) True",
  "subdomain": "Borrowing/Mortgages",
  "taxonomy": "Layer 1 Codes: INT-03 (Loan term does not affect total interest) | INT-04 (Shorter term = higher total cost)\nLayer 2 Tags:\n  - \"time_irrelevant\" [INT-03]: Student believes total payment is identical regardless of loan length.\n    Example: \"There is no difference between the total amount you pay at the end of the mortgage if you choose 15 or 30 year\"\n  - \"shorter_means_higher_rate\" [INT-04]: Student believes a shorter term comes with a higher interest rate, so total cost is more.\n    Example: \"less mortgage time means you are paying higher interest rate so you can pay off earlier\"\n  - \"monthly_vs_total_confusion\" [INT-03]: Confuses higher monthly payment with higher total cost.\n    Example: \"Because you're still paying a lot of money for the mortgage, just in a shorter period of time\"\n  - \"confused_but_close\" [INT-03]: Muddled reasoning, partially on track but conclusion wrong.\nKnowledge Gap: KG-idk, KG-blank\nSelection Error: SE-selfcorrect, SE-reversal (student explains longer loans accumulate more interest, which is correct reasoning, but chose False)",
  "rubric_accept": "Mentions less time for interest to accumulate, fewer payments, or paying down principal faster reduces total interest",
  "rubric_partial": "\"You pay it off faster\" (correct direction but does not explain the interest mechanism)",
  "rubric_reject": "No explanation or incorrect reasoning"
}
```

#### Q3: Inflation Definition

```json
{
  "question": "High inflation means that the cost of living is increasing rapidly. True or false?",
  "options": "A) True, B) False, C) Do not know",
  "correct_answer": "A) True",
  "subdomain": "Inflation",
  "taxonomy": "Layer 1 Codes: INF-02 (Inflation definition confusion)\nLayer 2 Tags:\n  - \"inflation_not_prices\" [INF-02]: Believes inflation is about money value declining, not about prices rising\n  - \"inflation_is_gradual_not_rapid\" [INF-02]: Disputes the word \"rapidly\" in the question, believes inflation is always gradual\nKnowledge Gap: KG-idk, KG-blank, KG-unfamiliar\nSelection Error: SE-selfcorrect, SE-reversal",
  "rubric_accept": "Mentions prices rising, things costing more, or money buying less over time",
  "rubric_partial": "\"Things get more expensive\" (correct but lacks depth or mechanism)",
  "rubric_reject": "Incorrect definition or no explanation"
}
```

#### Q4: Interest on a Loan

```json
{
  "question": "You lend $25 to a friend one evening and he gives you $25 back the next day. How much interest has he paid on this loan?",
  "options": "A) $25, B) $0, C) Do not know",
  "correct_answer": "B) $0",
  "subdomain": "Borrowing/Interest",
  "taxonomy": "Layer 1 Codes: INT-07 (Principal-interest confusion)\nLayer 2 Tags:\n  - \"principal_is_interest\" [INT-07]: Student believes the $25 returned IS the interest (chose A)\n  - \"interest_definition_error\" [INT-07]: Does not know what interest means in a lending context\nKnowledge Gap: KG-idk, KG-blank\nSelection Error: SE-selfcorrect, SE-misread",
  "rubric_accept": "Mentions he paid back exactly what he borrowed, nothing extra; or interest is the amount above principal",
  "rubric_partial": "\"He just paid back the same amount\" (correct but does not define interest)",
  "rubric_reject": "Incorrect reasoning or no explanation"
}
```

#### Q5: Emergency Fund

```json
{
  "question": "Lyle has a good job and earns enough to pay his bills comfortably each month. In terms of his emergency savings, how much should he have set aside?",
  "options": "A) $200 or so, B) Money equal to his share of one month's rent/mortgage, C) The equivalent of three or more months of living expenses, D) Do not know",
  "correct_answer": "C) Three or more months of living expenses",
  "subdomain": "Emergency Fund",
  "taxonomy": "Layer 1 Codes: BORROW-04 (Income-based not expense-based) | BORROW-05 (Amount underestimated)\nLayer 2 Tags:\n  - \"income_based_not_expense_based\" [BORROW-04]: Believes emergency fund should scale with income, not expenses.\n    Example: \"if lyle makes a lot of money, he should save more because he has more to save. The amount you save should be based on your income\"\n  - \"one_month_sufficient\" [BORROW-05]: Believes one month of rent is adequate.\n    Example: \"I answered B because i feel like that'll be enough to cover for the emergency\"\n  - \"fixed_dollar_amount\" [BORROW-05]: A small fixed dollar amount like $200 is sufficient\n  - \"more_is_always_better\" [BORROW-04]: Vague claim that saving more is always better, no specific benchmark\nKnowledge Gap: KG-idk, KG-blank\nSelection Error: SE-selfcorrect\n  Example: \"I accidentally chose option B instead of option C. However, option C is more financially responsible because it would protect Lyle\"",
  "rubric_accept": "Mentions covering job loss, unexpected expenses, or time needed to find new income source",
  "rubric_partial": "\"In case something bad happens\" (correct direction but vague)",
  "rubric_reject": "No explanation or incorrect reasoning"
}
```

#### Q6: Inflation Lowering (HIGHEST MISCONCEPTION VOLUME)

```json
{
  "question": "A successful effort to lower inflation would likely be accompanied by which of the following?",
  "options": "A) A decrease in the general level of prices, B) A slower increase in prices, C) An increase in employment, D) Do not know",
  "correct_answer": "B) A slower increase in prices",
  "subdomain": "Inflation (Lowering)",
  "taxonomy": "Layer 1 Codes: INF-01 (Lower inflation = falling prices)\nLayer 2 Tags:\n  - \"lower_inflation_means_lower_prices\" [INF-01]: Core misconception. Student states prices decrease when inflation decreases. Confuses the rate of change with the level.\n    Example 1: \"If overall inflation decreases, prices will decrease as a result because they are directly correlated.\"\n    Example 2: \"Inflation is the value of money decreasing over time. If the level of inflation decreased so should the prices of things because your money would have more purchasing power.\"\n    Example 3: \"I said A because inflation means higher prices, so in order to combat that, prices need to decrease.\"\n  - \"deflation_confusion\" [INF-01]: Student describes deflation (prices falling) or uses the word deflation.\n    Example: \"a decrease in general level of prices would help allow all citizens to afford basic necessities.\"\n  - \"employment_link\" [INF-01]: Student connects inflation reduction to employment changes rather than prices.\n    Example: \"I said C because I thought putting more people into the economy creating more jobs would help control prices\"\n  - \"purchasing_power_reversal\" [INF-01]: Gets purchasing power logic partially right but reverses the final conclusion.\nKnowledge Gap: KG-idk, KG-blank\n  Example: \"i dont know\"\nSelection Error: SE-selfcorrect\n  Example: \"i think it is actually B as there is a target inflation of 2% per year\"",
  "rubric_accept": "Mentions inflation is a rate of change not a price level; prices still rise, just more slowly",
  "rubric_partial": "\"Prices don't go down, they just go up less\" (correct but could be clearer on rate vs level)",
  "rubric_reject": "Incorrect reasoning or no explanation"
}
```

#### Q7: Inflation and Fixed Income

```json
{
  "question": "Inflation can cause difficulty in many ways. Which group would have the greatest problem during periods of high inflation?",
  "options": "A) Young couples with no children who both work, B) Older, working couples saving for retirement, C) Retirees living on a fixed income, D) Do not know",
  "correct_answer": "C) Retirees living on a fixed income",
  "subdomain": "Inflation (Fixed Income)",
  "taxonomy": "Layer 1 Codes: INF-03 (Fixed income impact misunderstood) | INF-05 (Empathy-driven reasoning)\nLayer 2 Tags:\n  - \"young_couples_worst\" [INF-05]: Believes young couples suffer most. Often empathy or identification driven.\n    Example 1: \"I said the couples because they dont have much built up and the jobs could disappear at any moment\"\n    Example 2: \"Young working couples because employment is going down so its harder for them to keep a job.\"\n  - \"older_workers_worst\" [INF-03]: Believes older working couples suffer most due to retirement impact.\n    Example 1: \"Older working couples getting hit with rampant inflation will effect them the most\"\n    Example 2: \"the older couple now is forced to put less into their retirement funds in order to keep up with the cost of living today\"\n  - \"young_because_employment\" [INF-05]: Links inflation directly to unemployment affecting young workers.\n  - \"young_because_building\" [INF-05]: Young people are building a life, so more expenses hit harder.\n    Example: \"The young working couples do not have any benefits and need to pay for things like rent.\"\n  - \"fixed_income_misunderstood\" [INF-03]: Does not understand what \"fixed income\" means.\nKnowledge Gap: KG-idk, KG-blank\nSelection Error: SE-selfcorrect, SE-misread",
  "rubric_accept": "Mentions their income does not rise while prices do; purchasing power decreases on fixed income",
  "rubric_partial": "\"Their money is worth less\" (correct but does not explain the fixed-income mechanism)",
  "rubric_reject": "Incorrect reasoning or no explanation"
}
```

#### Q8: Auto Loan Negotiation

```json
{
  "question": "Jayden is shopping for an auto loan. Which of the following can he likely negotiate with the lender?",
  "options": "A) The interest rate, B) The required down payment, C) Both, D) Neither, E) Do not know",
  "correct_answer": "C) Both",
  "subdomain": "Auto Loans",
  "taxonomy": "Layer 1 Codes: INT-05 (Interest rates not negotiable)\nLayer 2 Tags:\n  - \"interest_rate_fixed_by_fed\" [INT-05]: Believes interest rates are set by the Federal Reserve and cannot be negotiated.\n    Example: \"Interest rates cannot be negotiated because the Federal Reserve sets them at their discretion.\"\n  - \"down_payment_only\" [INT-05]: Only the down payment is negotiable, not the rate.\n    Example: \"I believe it is just the down payment because you are able to negotiate your down payments. Interest rates on the other hand are pretty much fixed.\"\n  - \"interest_rate_only\" [INT-05]: Only the interest rate is negotiable\n  - \"nothing_negotiable\" [INT-05]: Neither can be negotiated (chose D)\nKnowledge Gap: KG-idk, KG-blank\n  Example: \"I think I said Interest rate, honestly I just guessed I am unsure of what you can negotiate.\"\nSelection Error: SE-selfcorrect, SE-reversal\n  Example SE-reversal: \"C) Both. Jayden can often negotiate the interest rate and the down payment, so both are typically negotiable.\" (student chose B but explains Both)",
  "rubric_accept": "Mentions lenders compete for business or borrowers can shop around for better terms",
  "rubric_partial": "\"You can ask for better terms\" (correct but does not explain why negotiation works)",
  "rubric_reject": "Incorrect reasoning or no explanation"
}
```

#### Q9: Budgeting

```json
{
  "question": "Considering the strategy of allocating income, what is the PRIMARY advantage to your household of making a budget?",
  "options": "A) Ensures funds are available for bill paying and saving, B) Reduces your taxes, C) Increases rate of return on your investments, D) Do not know",
  "correct_answer": "A) Ensures funds are available for bill paying and saving",
  "subdomain": "Budgeting",
  "taxonomy": "Layer 1 Codes: BORROW-06 (Budgeting purpose misunderstood)\nLayer 2 Tags:\n  - \"tax_confusion\" [BORROW-06]: Believes budgeting reduces taxes (chose B)\n  - \"investment_confusion\" [BORROW-06]: Believes budgeting increases investment returns (chose C)\n  - \"purpose_misunderstanding\" [BORROW-06]: General confusion about what budgeting does\nKnowledge Gap: KG-idk, KG-blank\nSelection Error: SE-selfcorrect",
  "rubric_accept": "Mentions planning spending in advance or knowing where money goes ensures bills and savings are covered",
  "rubric_partial": "\"Helps you not run out of money\" (correct effect but does not explain how budgeting achieves this)",
  "rubric_reject": "Incorrect reasoning or no explanation"
}
```

#### Q10: Credit Reports (HIGH SELECTION ERROR — 29%)

```json
{
  "question": "Which of the following statements regarding credit reports is FALSE?",
  "options": "A) Credit reports are used by employers to screen job applicants, B) A credit report includes an assessment of your worthiness to receive credit, C) Your credit report is provided by a single source, D) Do not know",
  "correct_answer": "C) Your credit report is provided by a single source",
  "subdomain": "Credit Reports",
  "taxonomy": "Layer 1 Codes: BORROW-01 (Credit report vs score confusion) | BORROW-03 (Employer use unknown)\nLayer 2 Tags:\n  - \"employer_use_confusion\" [BORROW-03]: Does not know employers can check credit reports. Chose A thinking it is false.\n    Example: \"I answered A because I don't think employers can see an applicant's credit reports\"\n  - \"credit_score_confusion\" [BORROW-01]: Confuses credit report with credit score\n  - \"single_source_belief\" [BORROW-02]: Believes credit data comes from only one source\nKnowledge Gap: KG-idk, KG-blank\n  Example: \"what? I am confused...\"\nSelection Error: SE-selfcorrect, SE-misread, SE-reversal\n  Example SE-selfcorrect: \"I realized my answer is incorrect. The answer is C) because multiple sources report your credit score\"\n  Example SE-reversal: \"C, credit scores come from multiple sources not just one. I might be wrong but I believe there is 3 main credit agencies\" (student chose B but explains C correctly)\nNOTE: This item has a high selection error rate (~29%). The \"FALSE\" framing is confusing.",
  "rubric_accept": "Mentions there are multiple credit bureaus (e.g. Equifax, Experian, TransUnion)",
  "rubric_partial": "\"There's more than one place that does credit reports\" (correct but vague, no bureau names)",
  "rubric_reject": "Incorrect reasoning or no explanation"
}
```

#### Q11: Stock vs Mutual Fund

```json
{
  "question": "Please tell me whether this statement is true or false: Buying a single company's stock usually provides a safer return than a stock mutual fund.",
  "options": "A) True, B) False, C) Do not know",
  "correct_answer": "B) False",
  "subdomain": "Diversification (Stock vs Fund)",
  "taxonomy": "Layer 1 Codes: RISK-05 (Single stock safer) | RISK-06 (Mutual fund unfamiliarity)\nLayer 2 Tags:\n  - \"single_stock_safer_belief\" [RISK-05]: Believes owning one stock is safer than a fund\n  - \"unfamiliar_with_mutual_fund\" [RISK-06]: Does not know what a mutual fund is\nKnowledge Gap: KG-idk, KG-unfamiliar (dominant pattern)\nSelection Error: SE-selfcorrect, SE-reversal",
  "rubric_accept": "Mentions spreading risk across many companies or diversification reduces risk",
  "rubric_partial": "\"Don't have all your eggs in one basket\" (correct metaphor but could be more specific)",
  "rubric_reject": "Incorrect reasoning or no explanation"
}
```

#### Q12: Health Insurance Purpose (67% MISCONCEPTION RATE)

```json
{
  "question": "Which of the following best describes the PRIMARY function of health insurance?",
  "options": "A) Protect against the possibility of large unexpected medical bills, B) Cover the cost of routine health care expenses, C) Pay for elective medical procedures, D) Do not know",
  "correct_answer": "A) Protect against large unexpected medical bills",
  "subdomain": "Health Insurance Purpose",
  "taxonomy": "Layer 1 Codes: INS-01 (Insurance for routine care) | INS-02 (Frequency = purpose)\nLayer 2 Tags:\n  - \"routine_care_primary\" [INS-01]: Believes insurance is primarily for routine doctor visits and checkups.\n    Example 1: \"Health insurance is meant to cover for routine health care services like short check ups or vaccine shots.\"\n    Example 2: \"I answered B because health insurance does not cover large unexpected bills, and mainly function with routine health care.\"\n  - \"frequency_over_severity\" [INS-02]: Because routine care is used more often, it must be the primary function.\n    Example: \"Routine health care is more often used for most people than the other options.\"\n  - \"insurance_doesnt_cover_large_bills\" [INS-01]: Believes insurance does not cover large unexpected expenses.\n    Example: \"when you get into accidents they do not fully cover all expenses\"\nKnowledge Gap: KG-idk, KG-blank\nSelection Error: SE-selfcorrect",
  "rubric_accept": "Mentions large medical bills can be financially devastating without insurance; insurance is catastrophic protection",
  "rubric_partial": "\"So you don't go broke if you get sick\" (correct idea but informal, no mechanism)",
  "rubric_reject": "Incorrect reasoning or no explanation"
}
```

#### Q13: Insurance Deductible (30% IDK RATE)

```json
{
  "question": "What does a home insurance deductible represent?",
  "options": "A) Amount you pay before insurance covers damages, B) Monthly premium for coverage, C) Maximum amount insurance will pay, D) Do not know",
  "correct_answer": "A) Amount you pay before insurance covers damages",
  "subdomain": "Insurance Deductible",
  "taxonomy": "Layer 1 Codes: INS-03 (Deductible definition wrong)\nLayer 2 Tags:\n  - \"deductible_is_premium\" [INS-03]: Confuses deductible with monthly premium (chose B)\n  - \"deductible_is_max_payout\" [INS-03]: Believes deductible is the maximum amount insurance will pay (chose C)\n  - \"partial_understanding\" [INS-03]: Close to correct but imprecise or confused\nKnowledge Gap: KG-idk, KG-unfamiliar (dominant pattern; many students chose D)\nSelection Error: SE-selfcorrect",
  "rubric_accept": "Mentions paying the deductible amount out of pocket first, then insurance covers the rest",
  "rubric_partial": "\"You pay some, insurance pays the rest\" (correct but vague on the order or threshold mechanism)",
  "rubric_reject": "Incorrect reasoning or no explanation"
}
```

#### Q14: Diversification Principle

```json
{
  "question": "When an investor spreads money among different assets, the risk of losing money usually:",
  "options": "A) Increases, B) Decreases, C) Stays the same, D) Do not know",
  "correct_answer": "B) Decreases",
  "subdomain": "Diversification Principle",
  "taxonomy": "Layer 1 Codes: RISK-03 (Diversification increases risk)\nLayer 2 Tags:\n  - \"more_assets_more_risk\" [RISK-03]: More assets = more complexity = more things that can go wrong\n  - \"more_exposure_more_risk\" [RISK-03]: Spreading across places = more total exposure to risk\nKnowledge Gap: KG-idk, KG-blank\nSelection Error: SE-misread, SE-selfcorrect",
  "rubric_accept": "Mentions if one investment fails, others can offset the loss; not all assets move together",
  "rubric_partial": "\"Don't put all eggs in one basket\" (correct metaphor but does not explain WHY)",
  "rubric_reject": "Incorrect reasoning or no explanation"
}
```

#### Q29: Interest Rates and Bonds

```json
{
  "question": "If interest rates rise, what will typically happen to bond prices?",
  "options": "A) They will rise, B) They will fall, C) They will stay the same, D) There is no relationship, E) Do not know",
  "correct_answer": "B) They will fall",
  "subdomain": "Interest Rates and Bonds",
  "taxonomy": "Layer 1 Codes: INT-06 (Bond price/rate relationship reversed)\nLayer 2 Tags:\n  - \"positive_correlation_belief\" [INT-06]: Believes bond prices rise when interest rates rise.\n    Example 1: \"Bond prices have a positive correlation with interest rates.\"\n    Example 2: \"The bond prices rise because inflation causes everything to rise in price\"\n    Example 3: \"You typically pay an interest rate on a bond... if one goes up, so does the other.\"\n  - \"inflation_drives_all_up\" [INT-06]: Inflation pushes all asset prices up, including bonds\n  - \"no_relationship_belief\" [INT-06]: Believes there is no relationship (chose D)\nKnowledge Gap: KG-idk, KG-blank, KG-unfamiliar (dominant)\n  Example: \"I said i dont know.\"\nSelection Error: SE-selfcorrect\n  Example: \"when interest rates rise, bonds offer higher yields making them less wantable\" (chose E but reasoning suggests B)\nNOTE: Some students reported UI issues (\"I am not seeing my answer\"). Tag these as KG-idk.",
  "rubric_accept": "Mentions existing bonds become less attractive compared to new higher-rate bonds, so their price falls",
  "rubric_partial": "\"New bonds are better so old ones are worth less\" (correct direction but could be clearer)",
  "rubric_reject": "Incorrect reasoning or no explanation"
}
```

#### Q30: Risk-Return Tradeoff

```json
{
  "question": "An investment with a high return is likely to be high risk. True or false?",
  "options": "A) True, B) False, C) Do not know",
  "correct_answer": "A) True",
  "subdomain": "Risk-Return Tradeoff",
  "taxonomy": "Layer 1 Codes: RISK-02 (Exceptions disprove general rule)\nLayer 2 Tags:\n  - \"exceptions_disprove_rule\" [RISK-02]: Student argues exceptions exist so the general principle is false.\n    Example 1: \"I answered false because this may not always be the case. There are low risk strategies that can accompany high rewards.\"\n    Example 2: \"a high return does not automatically mean high risk in every case. Some investments can have strong returns due to factors like long time horizons, diversification\"\n  - \"time_horizon_negates_risk\" [RISK-02]: Long time horizon eliminates risk entirely\n  - \"prediction_negates_risk\" [RISK-02]: Skill eliminates risk\nKnowledge Gap: KG-idk, KG-blank\nSelection Error: SE-selfcorrect\nNOTE: Dominant pattern is RISK-02. Students interpret \"likely\" as \"always\" and argue exceptions invalidate the principle.",
  "rubric_accept": "Mentions you must take more risk to have the chance of earning more; the risk-return tradeoff",
  "rubric_partial": "\"More reward means more risk\" (correct but does not explain why)",
  "rubric_reject": "Incorrect reasoning or no explanation"
}
```

#### Q31: Stock Market Function

```json
{
  "question": "Which of the following best describes what the stock market does?",
  "options": "A) Results in a gain in wealth for investors, B) Creates liquidity by guaranteeing investors a profit, C) Brings people who want to buy stocks together with those who want to sell stocks, D) Do not know",
  "correct_answer": "C) Brings buyers and sellers together",
  "subdomain": "Stock Market Function",
  "taxonomy": "Layer 1 Codes: RISK-07 (Stock market guarantees returns)\nLayer 2 Tags:\n  - \"guarantees_profit\" [RISK-07]: Believes the stock market guarantees investors a profit (chose B)\n  - \"wealth_creation_primary\" [RISK-07]: Believes stock market's main function is creating wealth (chose A)\n  - \"capital_raising_primary\" [RISK-07]: Believes primary function is helping companies raise money\nKnowledge Gap: KG-idk, KG-blank, KG-vague\nSelection Error: SE-reversal, SE-selfcorrect",
  "rubric_accept": "Mentions it allows people to buy ownership in companies or sell when they need money; provides liquidity",
  "rubric_partial": "\"So people can trade stocks\" (correct but does not explain why this marketplace function matters)",
  "rubric_reject": "Incorrect reasoning or no explanation"
}
```

#### Q32: Long-Term Asset Returns

```json
{
  "question": "Considering a long time period (e.g., 10-20 years), which asset normally gives the highest return?",
  "options": "A) Savings accounts, B) Bonds, C) Stocks, D) Do not know",
  "correct_answer": "C) Stocks",
  "subdomain": "Long-Term Asset Returns",
  "taxonomy": "Layer 1 Codes: RISK-01 (Safety = highest returns)\nLayer 2 Tags:\n  - \"bonds_safest_therefore_best\" [RISK-01]: Believes safer assets produce highest returns (chose B)\n  - \"stocks_too_risky_for_returns\" [RISK-01]: Stocks are too risky, so returns cannot be highest\n  - \"savings_safest_therefore_best\" [RISK-01]: Zero-risk returns the most (chose A)\nKnowledge Gap: KG-idk, KG-blank\nSelection Error: SE-selfcorrect",
  "rubric_accept": "Mentions stocks are riskier so they offer higher potential returns; or stocks represent ownership in growing companies",
  "rubric_partial": "\"Stocks go up more over time\" (correct but does not explain why)",
  "rubric_reject": "Incorrect reasoning or no explanation"
}
```

#### Q33: Probability

```json
{
  "question": "In the BIG BUCKS LOTTERY, the chance of winning a $10 prize is 1%. What is your best guess about how many people would win a $10 prize if 1,000 people each buy a single ticket?",
  "options": "A) 5, B) 8, C) 10, D) 12, E) Do not know",
  "correct_answer": "C) 10",
  "subdomain": "Probability (Percentage to Frequency)",
  "taxonomy": "Layer 1 Codes: NUM-01 (Percentage calculation error)\nLayer 2 Tags:\n  - \"calculation_error\" [NUM-01]: Student miscalculates 1% of 1,000\n  - \"probability_misunderstanding\" [NUM-01]: Does not understand percentage-to-count conversion\nKnowledge Gap: KG-idk, KG-blank\nSelection Error: SE-selfcorrect",
  "rubric_accept": "Mentions 1% of 1,000 is 10, or 0.01 x 1,000 = 10",
  "rubric_partial": "\"1% means 1 out of 100, so 10 out of 1,000\" (correct reasoning shown)",
  "rubric_reject": "Incorrect calculation or no explanation"
}
```

#### Q34: Diversification Effect

```json
{
  "question": "When an investor spreads money among different assets, does the risk of losing money usually increase, decrease, or stay the same?",
  "options": "A) Increase, B) Decrease, C) Stay the same, D) Do not know",
  "correct_answer": "B) Decrease",
  "subdomain": "Diversification Effect",
  "taxonomy": "Layer 1 Codes: RISK-03 (Diversification increases risk)\nLayer 2 Tags:\n  - \"more_complexity_more_risk\" [RISK-03]: More investments = more complexity = more risk\n  - \"more_exposure_more_risk\" [RISK-03]: More places = more total exposure\nKnowledge Gap: KG-idk, KG-blank\nSelection Error: SE-selfcorrect, SE-reversal",
  "rubric_accept": "Mentions losses in one investment can be offset by gains in others",
  "rubric_partial": "\"Not all eggs in one basket\" (correct idea but does not explain the offsetting mechanism)",
  "rubric_reject": "Incorrect reasoning or no explanation"
}
```

#### Q35: Risk-Return Relationship

```json
{
  "question": "If someone offers you the chance to make a lot of money, it is likely that there is also a chance that you will lose a lot of money. True or false?",
  "options": "A) True, B) False, C) Do not know",
  "correct_answer": "A) True",
  "subdomain": "Risk-Return Relationship",
  "taxonomy": "Layer 1 Codes: RISK-02 (Exceptions disprove rule) | RISK-10 (Real-world counterexamples)\nLayer 2 Tags:\n  - \"real_world_counterexample\" [RISK-10]: Uses non-financial scenarios (jobs, promotions) to disprove a financial principle.\n    Example 1: \"Not every situation is high risk. If a company offers you a better position that pays a lot more, it doesn't mean that you are going to lose that money\"\n    Example 2: \"if you just show up to a chanced high paying job... you wouldn't lose any money because you didn't give any money\"\n  - \"exceptions_disprove_rule\" [RISK-02]: Same as Q30 pattern.\n    Example: \"a high potential gain does not automatically mean a high potential risk.\"\n  - \"trust_based_reasoning\" [RISK-02]: Frames the scenario as a trust or scam decision\nKnowledge Gap: KG-idk, KG-blank\nSelection Error: SE-selfcorrect",
  "rubric_accept": "Mentions risk and reward are linked; you cannot have high potential gain without accepting high potential loss",
  "rubric_partial": "\"No free lunch\" or \"nothing is guaranteed\" (correct direction but vague)",
  "rubric_reject": "Incorrect reasoning or no explanation"
}
```

#### Q36: Diversification / Savings (HIGHEST SELECTION ERROR — 62%)

```json
{
  "question": "True or false: It is less likely that you will lose all of your money if you save it in more than one place.",
  "options": "A) True, B) False, C) Do not know",
  "correct_answer": "A) True",
  "subdomain": "Diversification Principle",
  "taxonomy": "Layer 1 Codes: RISK-03 (Diversification increases risk) | RISK-04 (Understood but misapplied)\nLayer 2 Tags:\n  - \"correct_reasoning_wrong_answer\" [SE-reversal]: Student explains diversification CORRECTLY but chose False. Very common.\n    Example 1: \"i actually think it's true. because it will be in separate places\"\n    Example 2: \"I actually meant to put the other option because I was confused, I believe this is true.\"\n    Example 3: \"if one of the investments, or places you put your money goes bad and you loose the money, you still have the other money\" (chose False)\n    Example 4: \"I remember my finance teacher said its better to invest in multiple instead of one place\" (chose False)\n  - \"all_places_can_fail\" [RISK-03]: Argues multiple places can all fail simultaneously.\n    Example: \"wherever you save the money could still go wrong like save money in different banks and the banks go through financial struggle\"\n  - \"not_guaranteed\" [RISK-03]: Spreading reduces but does not eliminate risk, so the statement is False.\n    Example: \"spreading money out can help, it does not completely eliminate the chance of losing it\"\n  - \"misread_question\" [SE-misread]: Student explicitly says they misread the question\nKnowledge Gap: KG-idk, KG-blank\nCRITICAL NOTE: This item has 62% selection error rate. The T/F framing with \"less likely you will lose\" causes widespread confusion. Most students who chose False actually understand diversification. Pay extra attention to selection error classification.",
  "rubric_accept": "Mentions if one institution or investment fails, you do not lose everything because money is elsewhere",
  "rubric_partial": "\"Safer to spread it out\" (correct but does not explain why)",
  "rubric_reject": "Incorrect reasoning or no explanation"
}
```

#### Q37: Insurance Types

```json
{
  "question": "Which of the following insurance policies is most likely to protect you if you cause an accident that injures someone?",
  "options": "A) Health insurance, B) Homeowner's or renter's insurance, C) Auto insurance liability coverage, D) Do not know",
  "correct_answer": "C) Auto insurance liability coverage",
  "subdomain": "Insurance Types",
  "taxonomy": "Layer 1 Codes: INS-04 (Liability coverage scope wrong)\nLayer 2 Tags:\n  - \"health_insurance_for_injuries\" [INS-04]: Believes health insurance covers injuries you cause to others (chose A)\n  - \"auto_liability_for_self\" [INS-04]: Confuses liability coverage with personal injury coverage\n  - \"homeowner_covers_accidents\" [INS-04]: Believes homeowner's insurance covers all accident injuries (chose B)\nKnowledge Gap: KG-idk, KG-blank\nSelection Error: SE-misread, SE-selfcorrect",
  "rubric_accept": "Mentions liability coverage specifically covers damage or injury you cause to OTHERS",
  "rubric_partial": "\"Covers accidents you cause\" (correct but could specify what liability pays for)",
  "rubric_reject": "Incorrect reasoning or no explanation"
}
```

#### Q38: Inflation Protection

```json
{
  "question": "Which of the following types of investment would best protect the purchasing power of a family's savings in the event of a sudden increase in inflation?",
  "options": "A) A 10-year bond paying a fixed rate of interest, B) A certificate of deposit at a bank, C) A 25-year home mortgage at a fixed rate, D) A house financed with a fixed-rate mortgage, E) Do not know",
  "correct_answer": "D) A house financed with a fixed-rate mortgage",
  "subdomain": "Inflation Protection",
  "taxonomy": "Layer 1 Codes: INF-04 (Inflation protection confusion)\nLayer 2 Tags:\n  - \"fixed_bond_best\" [INF-04]: Believes a fixed-rate bond protects against inflation (chose A)\n  - \"cd_benefits_from_inflation\" [INF-04]: Believes CD rates adjust upward automatically (chose B)\n  - \"debt_is_bad\" [INF-04]: Avoided mortgage options because debt is inherently negative\n  - \"mortgage_not_house\" [INF-04]: Chose C (the mortgage/debt) rather than D (the house/asset). Understands concept but picked wrong framing.\nKnowledge Gap: KG-idk, KG-blank, KG-unfamiliar\nSelection Error: SE-selfcorrect, SE-reversal\nNOTE: Options C and D are very close. C is the mortgage (debt instrument), D is the house (real asset with fixed-cost financing). C-choosers may understand the concept but picked the wrong framing. Classify carefully.",
  "rubric_accept": "Mentions the mortgage payment stays fixed while the home's value and income rise with inflation",
  "rubric_partial": "\"Houses go up in value\" (correct but does not explain the fixed-mortgage payment benefit)",
  "rubric_reject": "Incorrect reasoning or no explanation"
}
```

#### Q39: Stocks vs Bonds Risk

```json
{
  "question": "True or false: Stocks are generally riskier than bonds.",
  "options": "A) True, B) False, C) Do not know",
  "correct_answer": "A) True",
  "subdomain": "Stocks vs Bonds Risk",
  "taxonomy": "Layer 1 Codes: RISK-08 (Stocks vs bonds risk confusion)\nLayer 2 Tags:\n  - \"bonds_contain_stocks\" [RISK-08]: Believes bonds are bundles of stocks or contain stocks\n  - \"some_bonds_risky_too\" [RISK-08]: Argues some bonds are risky, so stocks are not always riskier\nKnowledge Gap: KG-idk, KG-unfamiliar (dominant pattern)\nSelection Error: SE-selfcorrect, SE-reversal",
  "rubric_accept": "Mentions stocks have more price volatility, bigger swings in value, or greater uncertainty than bonds",
  "rubric_partial": "\"Stocks go up and down more\" (correct but does not explain why)",
  "rubric_reject": "Incorrect reasoning or no explanation"
}
```

#### Q40: 2008 Financial Crisis

```json
{
  "question": "What was a key factor contributing to the 2007 to 2008 financial crisis?",
  "options": "A) Strong regulation of mortgage lending, B) Widespread failure to properly assess and manage financial risk, C) High household savings rates, D) Low levels of borrowing by households",
  "correct_answer": "B) Widespread failure to properly assess and manage financial risk",
  "subdomain": "Crisis/Systemic Risk",
  "taxonomy": "Layer 1 Codes: CRISIS-01 (Cause reversed) | CRISIS-02 (Savings focus)\nLayer 2 Tags:\n  - \"regulation_caused_crisis\" [CRISIS-01]: Believes strong regulation caused the crisis (chose A).\n  - \"low_borrowing_caused_crash\" [CRISIS-01]: Believes low borrowing caused the crisis (chose D).\n  - \"high_savings_risk\" [CRISIS-02]: Believes the crisis was about savings losing value (chose C)\nKnowledge Gap: KG-idk, KG-blank\nSelection Error: SE-selfcorrect, SE-reversal\n  Example SE-reversal: Student understands excessive/risky lending occurred but chose A thinking regulation failed",
  "rubric_accept": "Mentions risky mortgages given to people who could not repay, or financial risks were hidden, underestimated, or spread throughout the system",
  "rubric_partial": "\"Banks took too many risks\" (correct direction but could be more specific)",
  "rubric_reject": "Incorrect reasoning or no explanation"
}
```

---

## 5. Processing Logic

### 5.1 Extracting the anchor item ID

The `item_id` in the CSV has the format `Q6_Open_Diagnose` or `Q35_Open_Confirm`. Strip the suffix to get the anchor item ID:

```typescript
const anchorId = itemId.replace(/_Open_Diagnose$/, "").replace(/_Open_Confirm$/, "");
// "Q6_Open_Diagnose" → "Q6"
```

### 5.2 Determining response type

```typescript
const responseType = itemId.includes("_Open_Diagnose") ? "diagnose" : "confirm";
```

### 5.3 Building the prompt

1. Look up the item config from the ITEMS map using `anchorId`
2. If `diagnose`: insert taxonomy into DIAGNOSE_TEMPLATE
3. If `confirm`: insert rubric into CONFIRM_TEMPLATE
4. Send `SYSTEM_PROMPT` + user prompt to the LLM

### 5.4 Parsing the response

The LLM should return raw JSON. Parse it and validate:
- For diagnose: must have `diagnosis_type`, `layer1_code`, `credit`, `classification_confidence`
- For confirm: must have `understanding_level`, `credit`, `classification_confidence`
- If parsing fails, store `{"error": "parse_failed", "raw": "..."}`

### 5.5 Quality checks after scoring

1. Review all `classification_confidence: "low"` responses (~5–10%)
2. Verify `selection_error` classifications show correct reasoning in evidence_quote
3. Check distribution: diagnose responses should be roughly 60% misconception, 25% knowledge_gap, 15% selection_error
4. Compare AI distribution to any manual review sample

---

## 6. Known Data Issues

1. **Stale anchor scores bug (fixed in commit 039f955):** 40 responses had mismatched SDM variant assignments across 36 students. These were filtered by cross-checking `anchor_score` and `confidence` fields. If re-exporting data, apply this filter.

2. **High selection error items:** Q36 (62%), Q2 (42%), Q10 (29%) have unusually high selection error rates. The AI scorer should be especially attentive to correct-reasoning-wrong-answer patterns on these items.

3. **Per-item coverage varies:** Ranges from 20% (Q32) to 90% (Q7). Do not extrapolate findings to the full class for items with coverage below 50%.

---

## 7. Expected Output

After scoring, the output should support:

1. **Per-student diagnostic report:** Score, strong areas, misconceptions identified, knowledge gaps
2. **Per-item summary:** Distribution of misconception/knowledge_gap/selection_error across all responses
3. **Instructor class report:** Layer A (anchor prevalence, all 421), Layer B (diagnostic findings, open-ended subset), Layer C (guessing analysis from confirm responses)
4. **Misconception prevalence table:** For each Layer 1 code, count and percentage across all diagnose responses

---

## 8. Validation Checklist

- [ ] System prompt is sent unchanged with every API call
- [ ] Item taxonomy is inserted verbatim (not summarized)
- [ ] Temperature is 0 (deterministic)
- [ ] JSON output is parsed and validated before storage
- [ ] Errors are caught and logged, not silently dropped
- [ ] Rate limiting prevents API throttling (~0.3s between calls)
- [ ] All 22 item configurations are included (Q1–Q14, Q29–Q40)
- [ ] Both diagnose and confirm templates are implemented
- [ ] Selection errors are classified correctly (student shows correct reasoning)
- [ ] Low-confidence classifications are flagged for human review
