# Adaptive Testing: Supplemental Diagnostic Module (SDM-10)

## Overview

The Financial Literacy Assessment uses an adaptive Supplemental Diagnostic Module (SDM-10) that selects 10 follow-up items from a pre-written item bank based on students' responses to the 40 fixed anchor items.

**Important**: This is NOT traditional IRT-based adaptive testing. All students receive the same 40 anchor items. The SDM-10 provides targeted diagnostic follow-up based on correctness and confidence patterns.

## Assessment Flow

1. **Onboarding**: 13 baseline covariates (B1-B13)
2. **Anchor Assessment**: 40 fixed items (Q1-Q40) with confidence ratings (1-3)
3. **SDM-10**: 10 adaptive follow-up items selected from item bank
4. **Total**: 63 questions

## Confidence Rating Scale

Students rate confidence on a **1-3 scale**:
- **1 (Low)**: Not confident in answer
- **2 (Mid)**: Somewhat confident
- **3 (High)**: Very confident in answer

## SDM-10 Selection Logic

### Mastery Δ and Need Δ Update Rules

For each anchor item, the platform computes two indices based on correctness and confidence:

| Confidence | Correct: Mastery Δ | Correct: Need Δ | Incorrect: Mastery Δ | Incorrect: Need Δ |
|------------|-------------------|-----------------|---------------------|-------------------|
| 1 (Low) | 0 | +2 | 0 | +1 |
| 2 (Mid) | +1 | 0 | -1 | +2 |
| 3 (High) | +2 | -1 | -2 | +3 |

- **Mastery Δ**: Controls targeted level of understanding (lower, same, higher)
- **Need Δ**: Ranks subcategories for inclusion in SDM-10

### Action Rules by Confidence and Accuracy

| Confidence | If Correct | If Incorrect |
|------------|------------|--------------|
| 1 (Low) | Open-ended (1-2 sentences) to confirm understanding | Lower level item (T/F or simplified MCQ) |
| 2 (Mid) | Same level MCQ in same subcategory | Lower level MCQ or T/F |
| 3 (High) | Optional higher level MCQ (transfer/multi-step) | Open-ended to diagnose misconception |

## Variant Types

Items in the SDM bank are tagged by:

### Format
- **True/False**: Quick confirmation
- **Multiple Choice (MCQ)**: Standard format
- **Open-ended**: 1-2 sentence explanation

### Level of Understanding
- **Lower (Foundational)**: One-step, direct reasoning
- **Same (Comparable)**: Parallel complexity to anchor
- **Higher (Applied)**: Multi-part or new scenario

## Format × Level Grid

|  | True/False | MCQ | Open-ended |
|--|------------|-----|------------|
| **Lower** | Basic recognition | Simplified, one-step | Use sparingly |
| **Same** | Quick confirmation | Parallel difficulty | Verify understanding |
| **Higher** | Avoid/rare | Transfer or multi-part | Diagnose misconceptions |

## Burden Controls

| Control | Rule |
|---------|------|
| SDM size | Fixed 10 items after 40 anchors |
| Selection basis | Ranked by Need Δ at subcategory level |
| Domain balance | At least 2 items per domain |
| Subcategory cap | Max 2 SDM items per subcategory |
| Open-ended cap | Max 3 open-ended items in SDM-10 |
| Item source | Pre-written bank only, no generated questions |

## Which Items Trigger SDM Selection?

- **Knowledge items (Q1-Q14, Q29-Q40)**: Trigger SDM-10 selection based on correctness + confidence
- **Preference items (Q15-Q28)**: Do NOT trigger SDM selection (they assess attitudes, not factual knowledge)

## Scoring

- **Primary outcomes (RQ1/RQ2)**: Based on 26 knowledge items only
- **SDM-10**: Secondary diagnostic output, not used for primary learning gains

## Implementation Notes

1. SDM items are pre-loaded once selected to reduce latency
2. Open-ended responses use rubric-aligned NLP scoring
3. Low-confidence NLP classifications flagged for human review
4. Misconception tags stored for aggregate analysis
