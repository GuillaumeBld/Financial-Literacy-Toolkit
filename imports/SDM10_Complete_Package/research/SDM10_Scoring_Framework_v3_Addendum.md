# SDM-10 Scoring Framework v3 (Addendum)
## Revisions: Reproducibility, Representativeness, and Reporting

---

## 1. Two-Layer Taxonomy (Reproducible Design)

### Layer 1: Generalizable Classification (Domain-Independent)

These tags transfer to any assessment in any subject. They classify the TYPE of diagnostic finding.

| Code | Category | Definition | Example (Finance) | Example (Biology) |
|------|---------|------------|-------------------|-------------------|
| **M-causal** | Wrong causal model | Student has a wrong cause-effect belief | "Lower inflation causes prices to fall" | "Antibiotics kill viruses" |
| **M-definition** | Wrong definition | Student defines a concept incorrectly | "A deductible is the max an insurer pays" | "Mitosis produces sex cells" |
| **M-scope** | Wrong scope/boundary | Student applies a concept too broadly or narrowly | "Health insurance is mainly for routine care" | "Only plants do photosynthesis" |
| **M-reasoning** | Reasoning error | Student uses a flawed reasoning pattern | "Exceptions exist, so the rule is false" | "Correlation proves causation" |
| **M-conflation** | Concept conflation | Student merges two distinct concepts | "Credit report and credit score are the same" | "DNA and RNA do the same thing" |
| **M-reversal** | Direction/relationship reversal | Student reverses the direction of a relationship | "Bond prices rise when interest rates rise" | "Predator populations rise when prey declines" |
| **M-empathy** | Empathy-driven reasoning | Student reasons from personal identification, not analysis | "Young people suffer most because I relate to them" | "Mammals are smarter because we are mammals" |
| **KG-unfamiliar** | Never encountered concept | Student has not learned this term or idea | "I don't know what a mutual fund is" | "I don't know what a ribosome is" |
| **KG-vague** | Vague awareness only | Student has heard of it but cannot explain | "I think bonds are related to interest somehow" | "Something about cell walls" |
| **KG-idk** | Explicit "I don't know" | Student states they do not know | "I don't know" | "I don't know" |
| **KG-blank** | No response | -- | -- | -- |
| **KG-insufficient** | Too short to classify | Under 20 chars, not IDK | "no" / "B" | "yes" / "A" |
| **SE-misread** | Misread the question | Student explains correct concept, misread question text | "I read it as 'which IS true'" | "I thought it said 'which is NOT'" |
| **SE-reversal** | True/False or option reversal | Reasoning supports opposite of their selection | Chose False, explains why it's True | Chose A, explains why B is correct |
| **SE-selfcorrect** | Self-corrects while writing | Student realizes error during explanation | "Actually I meant to choose C" | "Wait, I think it's B" |

### Layer 2: Content-Specific Tags (Assessment-Dependent)

These are derived from real student responses for each specific assessment. They describe WHAT the student specifically believes wrong.

**Generation process (reproducible):**
1. Run the assessment with a sample population
2. Collect open-ended responses
3. Review substantive responses, group by recurring patterns
4. Name each pattern as a content tag
5. Map each content tag to a Layer 1 general tag
6. Add content tags to the AI scoring prompt for that item

**For this assessment (QUIN 102 Financial Literacy):**

| Item | Content Tag | Layer 1 Code | Description |
|------|------------|-------------|-------------|
| Q1 | `interest_as_fee` | M-reversal | Interest is a fee charged to savers |
| Q1 | `simple_interest_only` | M-scope | Calculates without compounding |
| Q2 | `time_irrelevant` | M-causal | Term length does not affect total interest |
| Q2 | `shorter_means_higher_rate` | M-causal | Shorter term = higher rate = more total cost |
| Q3 | `inflation_not_prices` | M-definition | Inflation is about money value, not prices |
| Q3 | `inflation_is_gradual_not_rapid` | M-scope | Disputes "rapidly" qualifier |
| Q5 | `income_based_not_expense_based` | M-causal | Emergency fund scales with income, not expenses |
| Q5 | `one_month_sufficient` | M-scope | One month is adequate |
| Q5 | `fixed_dollar_amount` | M-scope | Fixed amount regardless of expenses |
| Q6 | `lower_inflation_means_lower_prices` | M-causal | Reduced inflation = prices fall |
| Q6 | `deflation_confusion` | M-conflation | Conflates lower inflation with deflation |
| Q6 | `employment_link` | M-causal | Inflation control is about employment |
| Q7 | `young_couples_worst` | M-empathy | Young couples suffer most (empathy-driven) |
| Q7 | `older_workers_worst` | M-causal | Older workers suffer most (retirement impact) |
| Q7 | `fixed_income_misunderstood` | M-definition | Does not understand "fixed income" |
| Q8 | `interest_rate_fixed_by_fed` | M-causal | Fed sets consumer loan rates directly |
| Q8 | `down_payment_only` | M-scope | Only down payment is negotiable |
| Q10 | `employer_use_confusion` | M-scope | Employers cannot check credit |
| Q10 | `credit_score_confusion` | M-conflation | Credit report = credit score |
| Q11 | `unfamiliar_with_mutual_fund` | KG-unfamiliar | Does not know what a mutual fund is |
| Q12 | `routine_care_primary` | M-scope | Insurance is mainly for routine care |
| Q12 | `frequency_over_severity` | M-reasoning | Used more often = primary function |
| Q13 | `deductible_is_premium` | M-conflation | Deductible = premium |
| Q13 | `deductible_is_max_payout` | M-definition | Deductible = max insurer pays |
| Q14 | `more_assets_more_risk` | M-causal | More assets = more complexity = more risk |
| Q29 | `positive_correlation_belief` | M-reversal | Bond prices rise with interest rates |
| Q30 | `exceptions_disprove_rule` | M-reasoning | Exceptions invalidate general principles |
| Q32 | `bonds_safest_therefore_best` | M-reasoning | Safety = highest returns |
| Q35 | `real_world_counterexample` | M-reasoning | Uses non-investment scenarios to disprove rule |
| Q36 | `all_places_can_fail` | M-scope | Multiple places can all fail at once |
| Q37 | `health_insurance_for_injuries` | M-scope | Health insurance covers all injuries |
| Q37 | `auto_liability_for_self` | M-definition | Auto liability covers your own injuries |
| Q38 | `fixed_bond_best` | M-causal | Fixed bond protects against inflation |
| Q39 | `bonds_contain_stocks` | M-definition | Bonds are bundles of stocks |
| Q40 | `low_borrowing_caused_crash` | M-reversal | Low borrowing caused the 2008 crisis |

**When reproducing for a new population:**
- Layer 1 stays identical
- Layer 2 is regenerated. Some tags will recur (the core misconceptions are well-documented in financial literacy research). New ones may appear.
- The AI scoring prompt template stays the same; only the content-tag examples change.

---

## 2. Instructor Report: Representativeness Rules

### The Core Problem

The SDM assigns a maximum of 3 open-ended questions per student, selected by the algorithm based on need scores. This means:
- Not every student who has a misconception is asked to explain it
- The open-ended sample for each item is a SUBSET of students with that issue
- Reporting raw counts from open-ended data would understate the problem

### Data Sources and What They Tell Us

| Data Source | Coverage | What It Tells Us | Limitation |
|------------|----------|-----------------|------------|
| Anchor scores (40 items) | 100% of class (421 students) | HOW MANY students got each topic wrong | Does not tell us WHY |
| Anchor + confidence | 100% of class | How many were wrong AND confident (likely misconception) | Still no "why" |
| Open-ended responses | 87% of class, but only 20-90% per item | WHAT SPECIFIC misconception they hold | Not everyone was asked |
| SDM MCQ variants | Varies by student | Whether the gap is deep (Lower wrong) or shallow (Lower right) | Not diagnostic of specific misconception |

### Reporting Structure

The instructor report MUST present data in layers, never mixing counts from different sources.

**Layer A: Class-Wide Prevalence (Anchor Data, All 421 Students)**

This is the primary data. Every student answered every anchor. These numbers are fully representative.

```
TOPIC DIFFICULTY (All 421 Students)

Hardest Topics (% answering incorrectly):
  Q6  - Inflation Lowering:          43.2% incorrect (182 students)
  Q29 - Interest Rates & Bonds:      39.7% incorrect (167 students)
  Q38 - Inflation Protection:        37.5% incorrect (158 students)
  Q36 - Diversification (Savings):   35.4% incorrect (149 students)
  Q7  - Inflation & Fixed Income:    31.4% incorrect (132 students)

Confident Errors (Incorrect + High Confidence):
  Q6:  23.3% of class (98 students) -- high priority for intervention
  Q29: 19.2% of class (81 students)
  Q38: 18.8% of class (79 students)
  Q36: 17.6% of class (74 students)
  Q7:  14.3% of class (60 students)
```

**Layer B: Misconception Diagnosis (Open-Ended Data, Stated Sample Size)**

This is the diagnostic layer. Every statement includes its sample size and the inference.

```
MISCONCEPTION DETAILS

Q6 - Inflation Lowering
  98 students (23.3%) answered incorrectly with high confidence.
  64 of these were asked to explain their reasoning.
  Among those 64:
    - 55% believe that when inflation decreases, prices actually fall
      (confusing lower inflation with deflation)
    - 8% link inflation control to employment rather than prices
    - 3% could not explain their reasoning

  Estimated class impact: Based on the open-ended sample, approximately
  50-60 students in your class likely hold the "lower inflation = lower
  prices" misconception.

  Recommended intervention: Explicit lesson distinguishing between
  "inflation rate" and "price level." Visual: show a graph where
  inflation drops from 5% to 2% but prices continue rising.
```

**Layer C: Guessing Detection (Confirm Data, Stated Sample Size)**

```
POSSIBLE GUESSING (Correct Answer + Could Not Explain)

  Q13 - Insurance Deductible: 38 students answered correctly with low
  confidence. 29 were asked to explain. Of those, 14% admitted guessing
  or could not define a deductible. These students may need
  reinforcement despite their correct score.
```

### Representativeness Rules (Non-Negotiable)

1. **Never report open-ended counts as class totals.** Always state "of the N who were asked to explain..."
2. **Always anchor to the full-class prevalence first.** Start with anchor data (421 students), then narrow to the open-ended sample.
3. **Provide an estimated class impact when sample is large enough.** If open-ended coverage is >50% for an item, extrapolate with a range. If <50%, state "sample too small for class-level estimates, but the pattern suggests..."
4. **Flag low-coverage items.** If fewer than 10 students explained a given item, state: "Small sample. Patterns are suggestive, not conclusive."
5. **Use percentages within the open-ended sample, not within the class.** "55% of the 64 who explained" not "8.3% of the class."

### Coverage Summary Table (Include in Every Report)

| Topic | Class Wrong + High Conf | Asked to Explain | Coverage % | Extrapolation Reliable? |
|-------|------------------------|-----------------|------------|------------------------|
| Q6 Inflation Lowering | 98 | 64 | 65% | Yes |
| Q29 Bonds | 81 | 29 | 36% | Marginal |
| Q38 Inflation Protection | 79 | 19 | 24% | No, too low |
| Q36 Diversification | 74 | 50 | 68% | Yes |
| Q7 Fixed Income | 60 | 54 | 90% | Yes |
| Q10 Credit Reports | 57 | 48 | 84% | Yes |
| Q32 Long-Term Returns | 56 | 11 | 20% | No, too low |
| Q8 Auto Loans | 49 | 34 | 69% | Yes |
| Q37 Insurance Types | 46 | 18 | 39% | Marginal |
| Q31 Stock Market | 42 | 12 | 29% | No, too low |

This table goes into the instructor report so the instructor knows exactly how much to trust each diagnostic finding.

---

## 3. Student Diagnostic Report (Revised)

### Framing for Students

Since students did not know SDM was separate:
- Do NOT say "your grade was based on 40 questions and the other 10 were diagnostic"
- DO say "here is your score, and here is feedback based on your responses"
- Frame open-ended feedback as personalized coaching, not a separate system

### Template

```
YOUR ASSESSMENT RESULTS
Score: 29/40 (73%)

PERSONALIZED FEEDBACK

Strong Understanding:
  Compound Interest - Your explanation showed you understand how interest
  compounds over multiple years. Well done.

  Diversification - You clearly articulated why spreading investments
  reduces risk.

Areas to Review:

  Inflation (Important):
  You explained that when inflation decreases, prices should also
  decrease. This is a common misunderstanding. Lower inflation means
  prices are still rising, just more slowly. Prices only fall during
  deflation, which is a separate and rarer condition.
  → Review: inflation rate vs. price level

  Health Insurance:
  You described health insurance as primarily covering routine doctor
  visits. While insurance does help with routine care, its primary
  function is to protect you from large, unexpected medical expenses
  that could otherwise cause serious financial hardship.
  → Review: purpose of insurance as risk protection

  Note on Q36 (Diversification/Savings):
  Your written answer showed you understand why saving in multiple
  places is safer. Your selected answer did not match your explanation,
  which may have been a reading error. No action needed on this topic.

Topics to Explore:
  Bond Pricing - You indicated you were unsure about how interest rates
  affect bond prices. This is a topic covered later in the course.
```

---

## 4. Assessment Framing for Post-Assessment

**Recommended intro text (before questions 41-50):**

> "The following questions build on your earlier answers. They are
> designed to help us understand your thinking and provide you with
> more detailed, personalized feedback. Please explain your reasoning
> as clearly as you can."

This is:
- True (it does provide personalized feedback)
- Not deceptive (does not claim these are graded)
- Motivating (students understand the purpose)
- Brief (does not disrupt flow)

---

## 5. Methodology Reproducibility Summary

To reproduce this system for a different assessment or population:

| Step | What Transfers | What Must Be Regenerated |
|------|---------------|------------------------|
| 1. Assessment design | SDM architecture, variant types, selection algorithm | Anchor items, answer keys, subdomains |
| 2. Data collection | Data schema, collection pipeline | -- |
| 3. Response review | Layer 1 taxonomy (M-causal, KG-unfamiliar, etc.) | Layer 2 content tags (from real responses) |
| 4. AI scoring prompts | Prompt template, decision tree, output schema | Item-specific examples and content tags |
| 5. Reporting | Report structure, representativeness rules, coverage table | Thresholds and specific recommendations |

**What is fully generalizable:** Three-way classification, Layer 1 taxonomy, scoring framework, representativeness rules, report templates.

**What is content-specific:** Layer 2 tags, item-specific prompt examples, instructor recommendations.

**Estimated effort to reproduce for a new assessment:** 2-3 days of response review and prompt calibration after the first test run, assuming the infrastructure is in place.
