# SDM-10: Supplemental Diagnostic Module for Financial Literacy Assessment
## Complete Project Package

**Course:** QUIN 102 (Financial Literacy)
**Assessment:** 40-item anchor test + 10-item adaptive diagnostic follow-up (SDM-10)
**Test 1 Data:** 421 students, 931 open-ended responses
**Date:** February 2026

---

## Quick Start (for implementer)

```bash
pip install openai

python implementation/sdm10_scorer.py \
  --input YOUR_open_questions.csv \
  --output scored_responses.csv \
  --api-key sk-or-v1-YOUR_OPENROUTER_KEY \
  --model anthropic/claude-sonnet-4
```

**Input CSV columns required:** student_hash, item_id, type (diagnose/confirm), answer, anchor_answer, anchor_score, anchor_confidence

**Output:** Same CSV with appended `ai_score` column containing JSON classification.

---

## Folder Structure

```
sdm10_package/
  README.md                         <- You are here
  
  implementation/                   <- CODE + PROMPTS (run the scoring system)
    sdm10_scorer.py                 <- Python scorer, OpenRouter API
    SDM10_AI_Scoring_Prompts.md     <- Complete prompt system (system + 26 item blocks)
    SDM10_Implementation_Guide.md   <- Selection algorithm code (pre-existing)
  
  research/                         <- ANALYSIS + FRAMEWORK (for the paper)
    Introduction_Draft.md           <- Paper introduction (pre-existing)
    SDM10_Selection_Algorithm_Paper.md <- Algorithm specification (pre-existing)
    SDM10_OpenEnded_Analysis_v1.md  <- Test 1 response analysis, patterns, frequencies
    SDM10_Scoring_Framework_v2.md   <- Three-way classification, credit rules, edge cases
    SDM10_Scoring_Framework_v3_Addendum.md <- Representativeness, reporting structure
    SDM10_Taxonomy_Revised.md       <- Two-layer misconception taxonomy (37 families)
  
  reference/                        <- SOURCE MATERIALS (do not modify)
    Quinn102_Assessment_40Q.md      <- All 40 anchor questions with answer keys
    SDM10_Item_Bank.xlsx            <- 182-row item bank (26 anchors + 156 variants)
    baseline+40_Questions.csv       <- Baseline survey + question metadata
    narration_script_v2.txt         <- Student-facing assessment narration
```

---

## Document Map

### For Implementation

| Document | Purpose | When to Use |
|----------|---------|-------------|
| `sdm10_scorer.py` | Scores all open-ended responses via OpenRouter API | Run after collecting open-ended data |
| `SDM10_AI_Scoring_Prompts.md` | System prompt + 26 item-specific prompt blocks with real student examples | Reference for prompt engineering, calibration |
| `SDM10_Implementation_Guide.md` | Selection algorithm: Need scores, tiebreakers, variant assignment | Building/maintaining the SDM-10 selection engine |

### For Research Paper

| Document | Paper Section | Key Content |
|----------|--------------|-------------|
| `Introduction_Draft.md` | Introduction | Literature review, motivation, research questions |
| `SDM10_Selection_Algorithm_Paper.md` | Methodology (Selection) | Need score calculation, format-aware scoring, constraint system, variant construction |
| `SDM10_OpenEnded_Analysis_v1.md` | Results (Qualitative) | Per-item response patterns, example quotes, frequency distributions |
| `SDM10_Scoring_Framework_v2.md` | Methodology (Scoring) | Three-way classification (misconception/knowledge_gap/selection_error), credit rules, edge case policies |
| `SDM10_Scoring_Framework_v3_Addendum.md` | Methodology (Reporting) | Representativeness rules, coverage analysis, instructor/student report templates |
| `SDM10_Taxonomy_Revised.md` | Methodology (Taxonomy) | Layer 1: 37 generalizable financial literacy misconception families. Layer 2: item-specific tags. Reproducibility across contexts |
| `SDM10_AI_Scoring_Prompts.md` | Methodology (AI Scoring) | Prompt design, calibration examples, decision tree |

---

## Key Design Decisions

### 1. Model C: SDM is Diagnostic Only (Not Graded)
- Grade comes from 40 anchors only (100% of class)
- SDM provides personalized feedback (87% of class contributed)
- Rationale: no grade pressure = honest explanations; different students get different questions = inequitable to grade

### 2. Three-Way Classification
Every open-ended response is classified as:
- **Misconception:** Student holds specific wrong mental model. Instructor corrects the belief.
- **Knowledge gap:** Student lacks knowledge (IDK, blank, unfamiliar). Instructor teaches from scratch.
- **Selection error:** Student understands but selected wrong answer (misread, misclick, self-corrects). Instructor flags item for revision.

### 3. Two-Layer Taxonomy (Reproducibility)
- **Layer 1 (37 codes, 7 categories):** Generalizable across any financial literacy assessment. Grounded in Lusardi & Mitchell, OECD/INFE, CFPB research.
- **Layer 2 (item-specific tags):** Derived from real student responses. Regenerated for each new assessment.

### 4. Representativeness Rules
- Open-ended sample is NOT random (filtered by SDM algorithm)
- Reports must separate: anchor prevalence (all 421) from diagnostic findings (subset)
- Extrapolation only when item coverage >50%
- Coverage table required in every instructor report

---

## Bug Fix (Stale Anchor Scores)

A bug was identified where `handleAnswer()` updates the answers state but NOT the `scoredAnchors` map, causing 40 mismatched SDM assignments (9.8% of students). The fix recomputes `ScoredAnchor` in `handleAnswer` when the answer changes. Mismatched responses were already filtered from analysis (by anchor_score + confidence cross-check), so the taxonomy is unaffected. See `SDM10_Scoring_Framework_v2.md` Section 6 for full root cause analysis.

---

## Data Notes

**Not included in this package (too large, keep separate):**
- `open_questions_2026-02-09_114048.csv` (931 rows, input to scorer)
- `submissions_detailed_2026-02-09_114142.csv` (full submission data, 421 students)

These must be provided alongside this package when running the scorer.

**Test 1 Key Stats:**
- 421 students completed the assessment
- 367 (87.2%) received at least 1 open-ended question
- 556 diagnose responses, 336 confirm responses (after filtering)
- Max 3 open-ended per student (by design)
- Per-item coverage ranges from 20% (Q32) to 90% (Q7)

---

## Workflow: Scoring Pipeline

```
1. Student completes 40 anchors + 10 SDM items
2. Export open_questions.csv from assessment platform
3. Run sdm10_scorer.py (produces scored_responses.csv)
4. Quality checks:
   a. Review all classification_confidence="low" responses (~5-10%)
   b. Verify selection_error classifications show correct reasoning
   c. Compare AI distribution to manual review sample
5. Generate instructor report (Layer A: anchor prevalence, Layer B: diagnosis, Layer C: guessing)
6. Generate student feedback (score + strong areas + misconceptions + gaps)
```

---

## Extending to Future Tests

For Test 2 and beyond:
1. Layer 1 taxonomy stays the same (37 misconception families)
2. Layer 2 tags may need additions based on new response patterns
3. Prompt examples in `SDM10_AI_Scoring_Prompts.md` can be supplemented with new calibration examples
4. The scorer script works unchanged on new data (same CSV format)
5. New items added to the anchor set require new entries in `DIAGNOSE_ITEMS` and `CONFIRM_RUBRICS` dicts in the scorer
