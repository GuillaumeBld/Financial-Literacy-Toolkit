# AI Scoring Rubrics

## Overview

AI-assisted scoring is used for open-ended responses in the SDM-10 module. The scoring follows pre-specified rubrics with misconception tagging for diagnostic purposes.

## When AI Scoring Applies

AI scoring is used ONLY for:
- **Open_Confirm variants**: Verify reasoning for correct + low confidence responses
- **Open_Diagnose variants**: Identify misconceptions for incorrect + high confidence responses

## Rubric Tiers

### Full Credit (2 points)
The response demonstrates understanding of the underlying mechanism or principle.

**Criteria:**
- Mentions the key causal relationship or conceptual link
- Shows mechanistic understanding, not just restating the answer
- Provides specific reasoning relevant to the question

**Example (Q1: Compound Interest):**
> "The interest earned each year gets added to the balance, so next year you earn interest on a larger amount. This compounds over time."

### Partial Credit (1 point)
The response is directionally correct but lacks specificity or mechanistic explanation.

**Criteria:**
- Correct general direction
- Missing key mechanistic detail
- Vague but not incorrect

**Example (Q1: Compound Interest):**
> "Interest adds up over time."

### No Credit (0 points)
The response provides no explanation, an incorrect explanation, or reasoning that contradicts the correct answer.

**Criteria:**
- No explanation provided
- Incorrect reasoning
- Contradicts the concept being tested

**Example (Q1: Compound Interest):**
> "Because the bank gives you more money." (no mechanism)

## Misconception Tags

Each Open_Diagnose variant includes predefined misconception tags for classification.

### Example: Q6 (Inflation Lowering)

| Tag | Description |
|-----|-------------|
| `deflation-confusion` | Believes lower inflation means prices fall |
| `rate-vs-level` | Conflates rate of change with absolute level |
| `unrelated-factor` | Cites employment or other unrelated factor |
| `unclear-reasoning` | Response not classifiable |

### Example: Q1 (Compound Interest)

| Tag | Description |
|-----|-------------|
| `simple-interest-only` | Describes simple interest (no compounding) |
| `interest-as-fee` | Confuses interest earned with fees paid |
| `no-time-component` | Ignores time factor in growth |
| `unclear-reasoning` | Response not classifiable |

## AI Confidence Thresholds

| Confidence | Action |
|------------|--------|
| ≥ 0.85 | Auto-accept AI classification |
| 0.70 - 0.84 | Accept with flag for sampling |
| < 0.70 | Queue for human review |

## Human Review Process

1. Low-confidence AI classifications are queued
2. Human reviewer sees: question, student response, AI score, AI tags
3. Reviewer confirms or overrides classification
4. Corrections feed back into calibration set

## Calibration Set

- Maintain labeled set of ~200 responses across all open-ended variants
- Use for periodic AI calibration checks
- Expand set with reviewed edge cases
- Target: 90%+ agreement with human reviewers

## Implementation Notes

1. AI scoring runs asynchronously after submission
2. Raw responses stored immediately; scores populated after AI processing
3. Misconception tags stored as JSONB array
4. All AI classifications include confidence score
5. No AI-generated questions - only rubric-based scoring of pre-written items
