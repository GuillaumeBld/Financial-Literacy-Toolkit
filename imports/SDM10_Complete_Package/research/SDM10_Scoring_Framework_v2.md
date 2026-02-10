# SDM-10 Scoring Framework v2
## Three-Way Classification System
## Model C: Diagnostic Only (SDM does not affect grade)

---

## 1. Design Principle

The 40 anchor items produce the student's grade. The SDM variants (MCQ + open-ended) produce a diagnostic profile. These are separate outputs with separate purposes.

| Output | Source | Purpose | Audience |
|--------|--------|---------|----------|
| **Grade** | 40 anchor items only | Summative evaluation | Student, gradebook |
| **Diagnostic profile** | SDM variants (MCQ + open-ended) | Identify misconceptions, knowledge gaps, and item issues | Instructor, student feedback |

---

## 2. Three-Way Classification

Every open-ended response is classified into one of three categories. This classification drives the diagnostic report.

### Category Definitions

| Category | Definition | Signal | Instructor Action | Student Feedback |
|----------|-----------|--------|-------------------|------------------|
| **Misconception** | Student holds a specific, identifiable wrong mental model | The student explains a coherent but incorrect reasoning pattern | Target the specific wrong belief with corrective instruction | "You explained that [X]. Actually, [Y] because [Z]." |
| **Knowledge Gap** | Student does not have the knowledge to answer | The student says "I don't know," gives no reasoning, or demonstrates unfamiliarity with core terms | Teach the concept from scratch | "This topic covers [X]. Here's what you need to know: [Y]." |
| **Selection Error** | Student understands the concept but selected the wrong answer | The student's explanation demonstrates correct reasoning despite the wrong anchor answer | No content intervention needed. Flag item for potential revision. | "Your explanation shows you understand this concept. Your answer didn't match, possibly due to how the question was worded." |

### Classification Decision Tree

```
1. Is the response blank, "IDK," or too short to classify?
   → YES: Knowledge Gap (tag: idk_no_reasoning | blank | insufficient_response)
   → NO: Continue

2. Does the response demonstrate correct reasoning for the anchor item?
   → YES: Does the student explicitly say they misread or mis-clicked?
     → YES: Selection Error (tag: misread_question)
     → NO: Selection Error (tag: correct_reasoning_wrong_answer)
   → NO: Continue

3. Does the student self-correct to the right answer?
   → YES: Selection Error (tag: self_corrects, corrected_to_right=true)
   → NO: Continue

4. Does the response reveal a specific wrong mental model?
   → YES: Misconception (tag from item-specific taxonomy)
   → NO: Does it show unfamiliarity with key terms/concepts?
     → YES: Knowledge Gap (tag: unfamiliar_with_concept)
     → NO: Misconception with low confidence (tag: unclear_reasoning)
```

---

## 3. Diagnose Scoring Schema

### Input
- Student's open-ended response text
- Anchor item ID (e.g., Q6)
- Anchor answer selected (e.g., A)
- Anchor correct answer (e.g., B)
- Subdomain (e.g., Inflation Lowering)

### Output

```json
{
  "diagnosis_type": "misconception | knowledge_gap | selection_error",
  "credit": 0 | 50 | 100,
  "primary_tag": "string from item taxonomy",
  "secondary_tag": "string | null",
  "classification_confidence": "high | medium | low",
  "flags": [],
  "evidence_quote": "key phrase from response",
  "corrected_to_right": true | false | null,
  "reasoning_summary": "one-sentence summary of what the student believes"
}
```

### Credit Rules (Diagnose)

Credit here measures diagnostic value, not correctness. It answers: "How useful is this response for understanding the student's thinking?"

| Credit | Meaning | When Assigned |
|--------|---------|---------------|
| **100** | High diagnostic value. Clear misconception identified or clear selection error documented. | Misconception with specific tag at high confidence. OR Selection error with clear correct reasoning. |
| **50** | Moderate diagnostic value. Partial misconception or mixed signals. | Misconception at medium confidence. Student reasoning is muddled but reveals a direction. |
| **0** | Low diagnostic value. Cannot determine what the student thinks. | IDK, blank, too short, or unclear reasoning that does not map to any pattern. |

### Why Credit Measures Diagnostic Value, Not "Correctness"

In Model C, we are not grading the open-ended response. We are measuring how much it tells us. A student who writes a clear, detailed explanation of a wrong mental model gets 100 credit because that explanation is maximally useful for diagnosis. A student who writes "idk" gets 0 credit because it tells us nothing beyond what the anchor score already showed.

---

## 4. Confirm Scoring Schema

### Input
- Student's open-ended response text
- Anchor item ID
- Anchor answer selected (correct)
- Subdomain

### Output

```json
{
  "understanding_level": "verified | partial | likely_guess",
  "credit": 0 | 50 | 100,
  "reasoning_quality": "mechanism_explained | rule_stated | vague | none",
  "classification_confidence": "high | medium | low",
  "evidence_quote": "key phrase from response"
}
```

### Credit Rules (Confirm)

| Credit | Understanding Level | Criteria | Example |
|--------|-------------------|----------|---------|
| **100** | Verified | Student explains the mechanism or causal logic correctly | "15-year mortgage pays less total interest because the loan is paid off faster, so interest accrues for fewer years" |
| **50** | Partial | Student states the correct rule or direction but not the mechanism | "because you are paying in less amount of time" |
| **0** | Likely Guess | Student cannot explain, says they guessed, or gives incorrect reasoning | "I got lucky on that one, I don't know how a deductible works" |

### Why Confirm Matters in Model C

Confirm responses do not change the grade (the student already got the anchor right). But they change the diagnostic profile. A student with 100% anchor score and 0% confirm understanding is very different from a student with 100% anchor score and 100% confirm understanding. The first is a lucky guesser, the second genuinely knows the material.

This distinction is valuable for:
- Instructor: Know which "high scorers" actually need reinforcement
- Student: "You got this right, but your explanation suggests you may want to review [topic]"
- Research: Measuring true understanding vs. test-taking ability

---

## 5. SDM MCQ Variant Scoring (Non-Grade)

The MCQ variants (Lower_MCQ, Lower_TF, Same_MCQ, Higher_MCQ) are scored as correct/incorrect but do NOT enter the grade. They contribute to the diagnostic profile.

### What MCQ Variants Tell Us

| Variant Type | Trigger | What a Correct Answer Means | What a Wrong Answer Means |
|-------------|---------|----------------------------|--------------------------|
| **Lower_MCQ / Lower_TF** | Various | Student has foundational knowledge even if anchor was wrong | Deeper gap than anchor alone suggested |
| **Same_MCQ** | Various | Confirms anchor-level knowledge | May indicate guessing on anchor |
| **Higher_MCQ** | Correct + High confidence | Student has above-anchor mastery | Anchor knowledge does not extend to application |

### MCQ Variant Output

```json
{
  "variant_type": "Lower_MCQ | Lower_TF | Same_MCQ | Higher_MCQ",
  "correct": true | false,
  "answer_selected": "A",
  "correct_answer": "B",
  "confidence": 1 | 2 | 3,
  "diagnostic_interpretation": "string"
}
```

### Diagnostic Interpretation Rules

| Anchor Result | Variant Result | Interpretation |
|--------------|----------------|----------------|
| Anchor wrong | Lower correct | Foundational knowledge exists, gap is at application level |
| Anchor wrong | Lower wrong | Deep knowledge gap, needs instruction from basics |
| Anchor right + low conf | Same correct | Understanding likely genuine despite low confidence |
| Anchor right + low conf | Same wrong | Anchor was likely a guess |
| Anchor right + high conf | Higher correct | Strong mastery, no intervention needed |
| Anchor right + high conf | Higher wrong | Knowledge is at recall level, not application |

---

## 6. Misconception Taxonomy by Item (Revised with Three-Way Classification)

Below is the full taxonomy. Each response tag is now assigned a diagnosis_type.

### Notation
- [M] = Misconception
- [KG] = Knowledge Gap
- [SE] = Selection Error

---

### Q1: Compound Interest
| Tag | Type | Description |
|-----|------|-------------|
| `interest_as_fee` | [M] | Believes interest is a fee charged to the saver |
| `simple_interest_only` | [M] | Calculates without compounding |
| `confused_direction` | [KG] | Unsure if interest adds or subtracts |
| `idk_no_reasoning` | [KG] | Cannot explain |

### Q2: Borrowing/Mortgages
| Tag | Type | Description |
|-----|------|-------------|
| `time_irrelevant` | [M] | Believes total payment is the same regardless of term |
| `shorter_means_higher_rate` | [M] | Believes shorter term = higher rate, so more total cost |
| `confused_but_close` | [M] | Muddled reasoning, partially on track |
| `correct_reasoning_wrong_answer` | [SE] | Explains correct concept but chose wrong option |
| `self_corrects` | [SE] | Realizes error while writing |
| `idk_no_reasoning` | [KG] | Cannot explain |

### Q3: Inflation Definition
| Tag | Type | Description |
|-----|------|-------------|
| `inflation_not_prices` | [M] | Believes inflation is about money value, not prices |
| `inflation_is_gradual_not_rapid` | [M] | Disputes "rapidly" qualifier |
| `self_corrects` | [SE] | Realizes error while writing |
| `confused_direction` | [KG] | General confusion about inflation |

### Q5: Emergency Fund
| Tag | Type | Description |
|-----|------|-------------|
| `more_is_always_better` | [M] | Believes saving more is always the right answer |
| `income_based_not_expense_based` | [M] | Emergency fund should scale with income, not expenses |
| `one_month_sufficient` | [M] | One month of expenses is adequate |
| `fixed_dollar_amount` | [M] | Fixed dollar amount regardless of expenses |
| `self_corrects` | [SE] | Realizes error |
| `idk_no_reasoning` | [KG] | Cannot explain |

### Q6: Inflation Lowering (HIGHEST VOLUME)
| Tag | Type | Description |
|-----|------|-------------|
| `lower_inflation_means_lower_prices` | [M] | Core misconception: reduced inflation = prices fall |
| `deflation_confusion` | [M] | Conflates lower inflation with deflation |
| `employment_link` | [M] | Believes inflation control is about employment |
| `purchasing_power_reversal` | [M] | Partially correct logic, reversed conclusion |
| `idk_no_reasoning` | [KG] | Cannot explain |
| `self_corrects` | [SE] | Realizes error |

### Q7: Inflation and Fixed Income
| Tag | Type | Description |
|-----|------|-------------|
| `young_couples_worst` | [M] | Young couples suffer most (less savings) |
| `older_workers_worst` | [M] | Older workers suffer most (retirement impact) |
| `young_because_employment` | [M] | Links inflation to unemployment for young |
| `young_because_building` | [M] | Young people building a life = more expenses |
| `fixed_income_misunderstood` | [KG] | Does not understand "fixed income" |
| `idk_no_reasoning` | [KG] | Cannot explain |

### Q8: Auto Loans Negotiation
| Tag | Type | Description |
|-----|------|-------------|
| `interest_rate_fixed_by_fed` | [M] | Believes rates are set by the Fed |
| `down_payment_only` | [M] | Only down payment is negotiable |
| `interest_rate_only` | [M] | Only interest rate is negotiable |
| `nothing_negotiable` | [M] | Neither can be negotiated |
| `correct_reasoning_wrong_answer` | [SE] | Explains both negotiable but chose wrong option |
| `idk_no_reasoning` | [KG] | Cannot explain |

### Q9: Budgeting
| Tag | Type | Description |
|-----|------|-------------|
| `bills_only` | [M] | Believes budgeting is only about paying bills |
| `self_corrects` | [SE] | Realizes correct answer while explaining |
| `idk_no_reasoning` | [KG] | Cannot explain |

### Q10: Credit Reports
| Tag | Type | Description |
|-----|------|-------------|
| `employer_use_confusion` | [M] | Does not know employers can check credit |
| `credit_score_confusion` | [M] | Confuses credit report with credit score |
| `single_source_belief` | [M] | Believes credit comes from one source |
| `correct_reasoning_wrong_answer` | [SE] | Explains right concept, chose wrong option |
| `misread_question` | [SE] | Admits reading question incorrectly |
| `idk_no_reasoning` | [KG] | Cannot explain |

### Q11: Diversification (Stock vs. Fund)
| Tag | Type | Description |
|-----|------|-------------|
| `unfamiliar_with_mutual_fund` | [KG] | Does not know what a mutual fund is |
| `single_stock_safer_belief` | [M] | Believes single stock is safer |
| `idk_no_reasoning` | [KG] | Cannot explain |

### Q12: Health Insurance Purpose
| Tag | Type | Description |
|-----|------|-------------|
| `routine_care_primary` | [M] | Believes insurance is mainly for routine care |
| `insurance_doesnt_cover_large_bills` | [M] | Believes insurance does not cover large expenses |
| `frequency_over_severity` | [M] | Routine care used more often, so must be primary function |
| `idk_no_reasoning` | [KG] | Cannot explain |

### Q13: Insurance Deductible
| Tag | Type | Description |
|-----|------|-------------|
| `deductible_is_premium` | [M] | Confuses deductible with premium |
| `deductible_is_max_payout` | [M] | Believes deductible is max insurer pays |
| `partial_understanding` | [M] | Close but imprecise definition |
| `idk_no_reasoning` | [KG] | Cannot explain |

### Q14: Diversification Principle
| Tag | Type | Description |
|-----|------|-------------|
| `more_assets_more_risk` | [M] | More assets = more complexity = more risk |
| `more_exposure_more_risk` | [M] | More places = more total exposure |
| `misread_question` | [SE] | Explains correct concept, answered wrong |
| `idk_no_reasoning` | [KG] | Cannot explain |

### Q29: Interest Rates and Bonds
| Tag | Type | Description |
|-----|------|-------------|
| `positive_correlation_belief` | [M] | Bond prices rise with interest rates |
| `inflation_drives_all_up` | [M] | Inflation pushes all asset prices up |
| `no_relationship_belief` | [M] | No relationship between rates and bonds |
| `idk_no_reasoning` | [KG] | Cannot explain |

### Q30: Risk-Return Tradeoff
| Tag | Type | Description |
|-----|------|-------------|
| `exceptions_disprove_rule` | [M] | Because exceptions exist, general rule is false |
| `time_horizon_negates_risk` | [M] | Long time = no risk |
| `prediction_negates_risk` | [M] | Predictability eliminates risk |
| `idk_no_reasoning` | [KG] | Cannot explain |

### Q31: Stock Market Function
| Tag | Type | Description |
|-----|------|-------------|
| `guarantees_profit` | [M] | Stock market guarantees returns |
| `capital_raising_primary` | [M] | Primary function is company fundraising |
| `supply_demand_framing` | [SE] | Close reasoning, wrong option selected |
| `idk_no_reasoning` | [KG] | Cannot explain |

### Q32: Long-Term Asset Returns
| Tag | Type | Description |
|-----|------|-------------|
| `bonds_safest_therefore_best` | [M] | Safety = highest returns (inverts risk-return) |
| `stocks_too_risky_for_returns` | [M] | Risk means returns cannot be highest |
| `savings_safest_therefore_best` | [M] | No-risk option returns most |
| `idk_no_reasoning` | [KG] | Cannot explain |

### Q33: Probability (% to Count)
| Tag | Type | Description |
|-----|------|-------------|
| `calculation_error` | [M] | Attempts math but gets wrong answer |
| `idk_no_reasoning` | [KG] | Cannot explain |

### Q34: Diversification Effect
| Tag | Type | Description |
|-----|------|-------------|
| `more_complexity_more_risk` | [M] | Managing multiple investments is harder and riskier |
| `correct_reasoning_wrong_answer` | [SE] | Explains decrease but chose wrong option |
| `idk_no_reasoning` | [KG] | Cannot explain |

### Q35: Risk-Return Relationship
| Tag | Type | Description |
|-----|------|-------------|
| `real_world_counterexample` | [M] | Uses scenarios where high pay is low risk |
| `exceptions_disprove_rule` | [M] | Same as Q30 pattern |
| `trust_based_reasoning` | [M] | Frames as trust decision, not risk calculation |
| `idk_no_reasoning` | [KG] | Cannot explain |

### Q36: Diversification Principle, Savings (HIGHEST NOISE)
| Tag | Type | Description |
|-----|------|-------------|
| `correct_reasoning_wrong_answer` | [SE] | Explains diversification correctly but chose False |
| `all_places_can_fail` | [M] | Multiple places can all fail simultaneously |
| `misread_question` | [SE] | Explicitly says they misread |
| `idk_no_reasoning` | [KG] | Cannot explain |

### Q37: Insurance Types
| Tag | Type | Description |
|-----|------|-------------|
| `health_insurance_for_injuries` | [M] | Health insurance covers all injury types |
| `auto_liability_for_self` | [M] | Auto liability covers your own injuries |
| `misread_question` | [SE] | Admits misreading |
| `idk_no_reasoning` | [KG] | Cannot explain |

### Q38: Inflation Protection
| Tag | Type | Description |
|-----|------|-------------|
| `fixed_bond_best` | [M] | Fixed bond protects against inflation |
| `cd_benefits_from_inflation` | [M] | CD rates adjust upward with inflation |
| `understands_but_wrong_choice` | [SE] | Explains fixed-rate logic but chose wrong option |
| `idk_no_reasoning` | [KG] | Cannot explain |

### Q39: Stocks vs. Bonds Risk
| Tag | Type | Description |
|-----|------|-------------|
| `bonds_contain_stocks` | [M] | Believes bonds are bundles of stocks |
| `some_bonds_risky_too` | [M] | Some bonds are risky, so stocks are not always riskier |
| `idk_no_reasoning` | [KG] | Cannot explain |

### Q40: 2008 Financial Crisis
| Tag | Type | Description |
|-----|------|-------------|
| `high_savings_risk` | [M] | Crisis was about savings risk |
| `low_borrowing_caused_crash` | [M] | Low borrowing caused the crash (opposite of reality) |
| `excessive_lending_no_risk_mgmt` | [SE] | Understands excessive lending but chose wrong label |
| `idk_no_reasoning` | [KG] | Cannot explain |

---

## 7. Aggregate Reporting Structure

### Student Diagnostic Report (Not a Grade)

```
Your Assessment Score: 73% (29/40)

UNDERSTANDING PROFILE

Strong Understanding (Verified):
  - Compound Interest: You correctly explained that interest compounds over time.
  - Diversification: Your reasoning about spreading risk was clear and accurate.

Areas with Misconceptions (Specific Feedback):
  - Inflation: You explained that lower inflation means prices decrease.
    Actually, lower inflation means prices are still rising, just more slowly.
    Prices only fall during deflation.
  - Health Insurance: You said the primary purpose is routine care.
    Actually, the primary function is protection against large, unexpected
    medical expenses.

Areas to Learn More (Knowledge Gaps):
  - Bond Pricing: You indicated you were unsure about how interest rates
    affect bond prices. Review: when interest rates rise, existing bond
    prices fall.
  - Insurance Deductible: Review what a deductible is and how it works
    in an insurance claim.

Note: Your answer on Q36 (Diversification/Savings) was marked incorrect,
but your written explanation showed you understand the concept well.
This may have been a reading error.
```

### Instructor Class Report

```
CLASS DIAGNOSTIC SUMMARY (QUIN 102, n=421)

MOST PREVALENT MISCONCEPTIONS (Action Required):
  1. Lower inflation = falling prices (Q6): 35 students (8.3%)
     → Recommend: Dedicated lesson on inflation rate vs. price level
  2. Health insurance is for routine care (Q12): 22 students (5.2%)
     → Recommend: Insurance purpose exercise
  3. Young people hurt most by inflation (Q7): 18 students (4.3%)
     → Recommend: Fixed income concept explanation

REASONING ERRORS (Cross-Topic Pattern):
  - "Exceptions disprove general rules" (Q30, Q35): 16 students
    → Recommend: Discussion of general principles vs. exceptions

KNOWLEDGE GAPS (Need Instruction from Basics):
  - Mutual fund definition (Q11): 5 students unfamiliar with term
  - Insurance deductible (Q13): 6 students completely unfamiliar
  - Bond/interest rate relationship (Q29): 8 students no knowledge

ITEMS TO REVIEW (High Selection Error Rate):
  - Q36: 62% of wrong answers showed correct reasoning (question wording issue)
  - Q2: 42% showed correct reasoning (True/False confusion)
  - Q10: 29% showed correct reasoning (option labeling issue)

CONFIRM RESULTS (Guessing Detection):
  - 12-14% of correct answers on Q13, Q12, Q8, Q10 were lucky guesses
    (students could not explain their correct answer)
```

---

## 8. Edge Case Scoring Policies (Final)

| Case | Credit | Diagnosis Type | Tag | Rationale |
|------|--------|---------------|-----|-----------|
| Blank response | 0 | Knowledge Gap | `blank` | No diagnostic information |
| "I don't know" only | 0 | Knowledge Gap | `idk_no_reasoning` | Confirms gap but adds nothing beyond anchor |
| Too short, not IDK (<20 chars) | 0 | Knowledge Gap | `insufficient_response` | Cannot classify |
| Self-corrects to right answer | 100 | Selection Error | `self_corrects` | High diagnostic value: student has latent knowledge |
| Correct reasoning, wrong answer | 100 | Selection Error | `correct_reasoning_wrong_answer` | High diagnostic value: concept understood |
| Misread/mis-clicked, explains correctly | 100 | Selection Error | `misread_question` | High diagnostic value: item issue, not student issue |
| Clear misconception explained | 100 | Misconception | [item-specific tag] | Maximum diagnostic value |
| Partial/muddled misconception | 50 | Misconception | [item-specific tag] | Some diagnostic value |
| Vague reasoning, no clear pattern | 0 | Knowledge Gap | `unclear_reasoning` | Cannot determine what student believes |
