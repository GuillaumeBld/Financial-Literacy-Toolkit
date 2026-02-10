# SDM-10 Open-Ended Response Analysis (Test 1)
## QUIN 102 Pre-Assessment | February 9, 2026

---

## 1. Data Overview

| Metric | Value |
|--------|-------|
| Total open-ended responses | 931 |
| Valid diagnose (incorrect + high confidence) | 556 |
| Valid confirm (correct + low confidence) | 336 |
| Trigger mismatches (under investigation) | 40 |
| Unique students with open-ended responses | 367 |
| Unique subdomains covered | 25 |

### Response Quality Distribution

| Category | Diagnose (n=556) | Confirm (n=336) |
|----------|-----------------|-----------------|
| Substantive (scorable) | 496 (89.2%) | 315 (93.8%) |
| "I don't know" only | 23 (4.1%) | 18 (5.4%) |
| Self-corrects in explanation | 18 (3.2%) | 0 (0%) |
| Too short (<20 chars, not IDK) | 17 (3.1%) | 3 (0.9%) |
| Blank | 2 (0.4%) | 0 (0%) |

---

## 2. Edge Case Policies (Decisions Needed)

### 2a. "I Don't Know" Responses
46 total across both types. These students answered the anchor item (with high or low confidence) but wrote "I don't know" or equivalent in the open-ended explanation.

**Proposed policy:** Score as 0 credit. Tag as `idk_no_reasoning`. This is diagnostically meaningful: the student committed to an answer with high confidence but cannot articulate why, which suggests guessing or inability to reason about the topic.

### 2b. Self-Correcting Diagnose Responses
18 students realized their error while writing the explanation (e.g., "I accidentally chose B instead of C" or "Looking back, I would change my answer to true").

**Proposed policy:** Score as 0 credit for the original misconception diagnosis (the anchor was still wrong). Tag as `self_corrects`. Add a secondary flag `corrected_to_right` (boolean) if the student's revised answer matches the key. This is diagnostically valuable: it shows the student has latent knowledge but made a selection error.

### 2c. Very Short Non-IDK Responses
17 diagnose responses under 20 chars that are not IDK (e.g., "no", "B", "A", single letter answers).

**Proposed policy:** Score as 0 credit. Tag as `insufficient_response`. These do not provide enough information for misconception classification.

### 2d. Blank Responses
2 blanks in the dataset.

**Proposed policy:** Score as 0 credit. Tag as `blank`.

---

## 3. Diagnose Misconception Taxonomy (Derived from Real Data)

Each item below lists the identified misconception patterns from actual student responses. These will become the classification tags for AI scoring.

---

### Q1: Compound Interest (n=5 diagnose)
**Anchor:** $100 at 2% annual interest for 5 years, result is more than $102. Correct = A (more than $102).

| Tag | Description | Example Quote | Frequency |
|-----|-------------|---------------|-----------|
| `interest_as_fee` | Believes interest is a fee charged TO the saver, reducing balance | "every year the bank takes 2% of your money" | 1 |
| `simple_interest_only` | Calculates correctly for 1 year but does not compound | "100 times 1.02 equals 102" | 1 |
| `confused_direction` | Knows interest exists but unsure if it adds or subtracts | mixed reasoning | 2 |
| `idk_no_reasoning` | Cannot explain | -- | 0 |

---

### Q2: Borrowing/Mortgages (n=26 diagnose)
**Anchor:** 15-year mortgage pays less total interest than 30-year. Correct = A (True).

| Tag | Description | Example Quote | Freq |
|-----|-------------|---------------|------|
| `time_irrelevant` | Believes total payment is the same regardless of term length | "no difference between total amount you pay at the end" | 3 |
| `shorter_means_higher_rate` | Believes shorter term = higher interest rate, so more total cost | "less mortgage time means you are paying higher interest rate" | 4 |
| `confused_but_close` | Reasoning is muddled but partially on track | "interest only covers a certain period of time, extended..." | 5 |
| `correct_reasoning_wrong_answer` | Actually explains the correct concept but chose B or C | "the longer you have to pay a loan off, the longer the interest builds" (chose B=False) | 8 |
| `idk_no_reasoning` | Cannot explain | "I don't know" | 2 |
| `self_corrects` | Realizes error while writing | "I meant to pick true" | 3 |

**Key finding:** 8/26 (31%) students who chose the wrong answer actually demonstrated correct reasoning in their explanation. This suggests a question-reading error or answer-key misalignment rather than a true misconception. This is the highest self-contradiction rate of any item.

---

### Q3: Inflation Definition (n=16 diagnose)
**Anchor:** High inflation means cost of living is increasing rapidly. Correct = A (True).

| Tag | Description | Example Quote | Freq |
|-----|-------------|---------------|------|
| `inflation_not_prices` | Believes inflation is about money value or markets, not prices directly | "inflation is changes in interest or value of money, not directly related to expenses" | 3 |
| `inflation_is_gradual_not_rapid` | Disputes "rapidly" qualifier, not the concept | "inflation is generally an ongoing rise, not short-term" | 2 |
| `self_corrects` | Realizes error while writing | "Looking back, I would change my answer to true" | 4 |
| `confused_direction` | General confusion about what inflation means | mixed | 4 |

**Key finding:** 4/16 (25%) self-corrected. Another 2 disputed the word "rapidly" rather than the concept of inflation itself, which is arguably a reasonable reading.

---

### Q5: Emergency Fund (n=30 diagnose)
**Anchor:** Lyle should set aside 3+ months of living expenses. Correct = C (3+ months).

| Tag | Description | Example Quote | Freq |
|-----|-------------|---------------|------|
| `more_is_always_better` | Believes saving more is always the right answer, chose higher option | "the more you have, the better" | 3 |
| `income_based_not_expense_based` | Believes emergency fund should scale with income, not expenses | "if Lyle makes a lot of money, he should save more" | 4 |
| `one_month_sufficient` | Believes one month of rent/expenses is adequate | "one month's rent should be enough" | 5 |
| `fixed_dollar_amount` | Thinks a fixed dollar amount (e.g., $200) is appropriate regardless | "set aside $200" | 3 |
| `self_corrects` | Realizes the answer while explaining | "I accidentally chose B instead of C" | 3 |
| `idk_no_reasoning` | Cannot explain | -- | 1 |

---

### Q6: Inflation Lowering (n=64 diagnose) -- HIGHEST VOLUME
**Anchor:** If inflation decreases, prices rise more slowly (not decrease). Correct = B.

| Tag | Description | Example Quote | Freq |
|-----|-------------|---------------|------|
| `lower_inflation_means_lower_prices` | Core misconception: believes reduced inflation = prices fall | "If inflation decreases, prices will decrease" | 35 |
| `deflation_confusion` | Conflates lower inflation with deflation | "decrease in general level of prices" | 10 |
| `employment_link` | Believes inflation control is about employment, not prices | "increasing employment, the inflation rate should go down" | 5 |
| `purchasing_power_reversal` | Gets the logic partially right but reverses the conclusion | "money would have more purchasing power" (then says prices drop) | 5 |
| `idk_no_reasoning` | Cannot explain | -- | 2 |
| `self_corrects` | Realizes error | -- | 2 |

**Key finding:** This is the single most common misconception in the dataset. 35/64 (55%) clearly believe lower inflation = falling prices. This is the classic "inflation vs. rate of inflation" confusion.

---

### Q7: Inflation and Fixed Income (n=54 diagnose)
**Anchor:** Retirees on fixed income are most hurt by inflation. Correct = C.

| Tag | Description | Example Quote | Freq |
|-----|-------------|---------------|------|
| `young_couples_worst` | Believes young couples suffer most because they have less saved | "young working couples do not have any benefits and need to pay for rent" | 18 |
| `older_workers_worst` | Believes older working couples suffer most due to retirement impact | "forced to put less into retirement funds" | 12 |
| `young_because_employment` | Links inflation to unemployment, younger workers more vulnerable | "employment is going down so its harder for them to keep a job" | 5 |
| `young_because_building` | Young couples are building a life, so more expenses | "working to build a home, comes with a lot of new expenses" | 6 |
| `fixed_income_misunderstood` | Does not understand what "fixed income" means | various | 4 |
| `idk_no_reasoning` | Cannot explain | -- | 2 |

**Key finding:** The dominant misconception pattern (18/54 = 33%) is empathy-driven reasoning: students identify with young people struggling to build a life, overriding the economic logic that fixed income means no ability to earn more.

---

### Q8: Auto Loans Negotiation (n=34 diagnose)
**Anchor:** Both interest rate and down payment can be negotiated. Correct = C (Both).

| Tag | Description | Example Quote | Freq |
|-----|-------------|---------------|------|
| `interest_rate_fixed_by_fed` | Believes interest rates are set by the Fed and cannot be negotiated | "Interest rates cannot be negotiated because the Federal Reserve sets them" | 8 |
| `down_payment_only` | Believes only down payment is negotiable | "the interest rate is set" | 10 |
| `interest_rate_only` | Believes only interest rate is negotiable | "interest rates are negotiable" | 5 |
| `nothing_negotiable` | Believes neither can be negotiated | -- | 2 |
| `idk_no_reasoning` | Cannot explain | "I just guessed" | 3 |
| `correct_reasoning_wrong_answer` | Explains both are negotiable but chose wrong option | "C) Both" in explanation but selected B | 3 |

---

### Q10: Credit Reports (n=48 diagnose)
**Anchor:** Credit reports are NOT provided by a single source (False). Correct = C.

| Tag | Description | Example Quote | Freq |
|-----|-------------|---------------|------|
| `employer_use_confusion` | Does not know employers can check credit | "I don't think employers can see an applicant's credit reports" | 6 |
| `credit_score_confusion` | Confuses credit report with credit score | "multiple sources report your credit score" | 4 |
| `single_source_belief` | Believes credit comes from one source | -- | 2 |
| `correct_reasoning_wrong_answer` | Explains the right concept but selected wrong option | "credit scores come from multiple sources not just one" (then chose B not C) | 8 |
| `misread_question` | Admits reading the question incorrectly | "If I put B, I read the question wrong" | 6 |
| `idk_no_reasoning` | Cannot explain | "I don't know" | 5 |

**Key finding:** 14/48 (29%) either self-corrected, demonstrated correct reasoning with the wrong answer, or admitted misreading. This item has a high error-noise ratio, not purely misconception-driven.

---

### Q11: Diversification, Stock vs. Mutual Fund (n=14 diagnose)
**Anchor:** Single stock is NOT safer than mutual fund. Correct = B (False).

| Tag | Description | Example Quote | Freq |
|-----|-------------|---------------|------|
| `unfamiliar_with_mutual_fund` | Does not know what a mutual fund is | "I don't know what a stock mutual fund is" | 5 |
| `single_stock_safer_belief` | Believes single stock is safer/more committed | "a single mutual fund sounds more committed and more risk of loss" | 2 |
| `idk_no_reasoning` | Cannot explain | "no clue", "idk" | 3 |

**Key finding:** This item's diagnose responses are dominated by knowledge gaps (not knowing what a mutual fund is) rather than structured misconceptions.

---

### Q12: Health Insurance Purpose (n=33 diagnose)
**Anchor:** Primary function of health insurance is protection against large unexpected bills. Correct = A.

| Tag | Description | Example Quote | Freq |
|-----|-------------|---------------|------|
| `routine_care_primary` | Believes health insurance is mainly for routine care | "health insurance is meant to cover routine health care services like checkups" | 22 |
| `insurance_doesnt_cover_large_bills` | Believes insurance does not cover large unexpected expenses | "health insurance does not cover large unexpected bills" | 4 |
| `frequency_over_severity` | Reasons that routine care is used more often, so it must be the primary function | "routine healthcare is more often used for most people" | 5 |
| `idk_no_reasoning` | Cannot explain | -- | 1 |

**Key finding:** Very consistent misconception. 22/33 (67%) clearly believe routine care is the primary purpose. The "frequency = purpose" reasoning (5 students) is a distinct and interesting subtype.

---

### Q13: Insurance Deductible (n=20 diagnose)
**Anchor:** Deductible = amount paid out of pocket before insurance covers rest. Correct = A.

| Tag | Description | Example Quote | Freq |
|-----|-------------|---------------|------|
| `deductible_is_premium` | Confuses deductible with the premium (payment to be covered) | "you pay money to be covered by home insurance" | 4 |
| `deductible_is_max_payout` | Believes deductible is the maximum the insurer pays | "the most the insurance will pay" | 2 |
| `partial_understanding` | Knows you pay something after an incident but cannot define correctly | "you pay $500 after you crash, the insurance pays the rest" (close but chose B) | 3 |
| `idk_no_reasoning` | Cannot explain | "I do not know" | 6 |

**Key finding:** Highest IDK rate for diagnose items (6/20 = 30%). Students who chose wrong here genuinely do not know the term.

---

### Q14: Diversification Principle (n=8 diagnose)
**Anchor:** Spreading money across assets decreases risk. Correct = B (decreases).

| Tag | Description | Example Quote | Freq |
|-----|-------------|---------------|------|
| `more_assets_more_risk` | Believes more assets = more complexity = more risk | "spread out will be a lot to handle especially if they're not doing well" | 3 |
| `more_exposure_more_risk` | Believes investing in more places increases total exposure | "not focused on few companies leading to riskier investments" | 2 |
| `misread_question` | Explains the correct concept but answered A (increase) | "less likely to lose all of it" | 2 |

---

### Q29: Interest Rates and Bonds (n=29 diagnose)
**Anchor:** When interest rates rise, bond prices fall. Correct = B (fall).

| Tag | Description | Example Quote | Freq |
|-----|-------------|---------------|------|
| `positive_correlation_belief` | Believes bond prices rise with interest rates | "if one goes up, so does the other" | 8 |
| `inflation_drives_all_up` | Believes inflation pushes everything up including bonds | "inflation causes everything to rise in price" | 3 |
| `no_relationship_belief` | Believes there is no relationship | "bond prices might be more stable so no relationship" | 2 |
| `idk_no_reasoning` | Cannot explain, including UI issues | "I am not seeing my answer" | 8 |

**Note:** 8/29 (28%) IDK rate, many citing UI issues ("not seeing my answer"). This may warrant investigation.

---

### Q30: Risk-Return Tradeoff (n=21 diagnose)
**Anchor:** High return investments generally have high risk. Correct = A (True).

| Tag | Description | Example Quote | Freq |
|-----|-------------|---------------|------|
| `exceptions_disprove_rule` | Believes because exceptions exist, the general rule is false | "there are low risk strategies that can accompany high rewards" | 10 |
| `time_horizon_negates_risk` | Believes long time horizons eliminate risk | "long time horizons, diversification" make high returns low risk | 3 |
| `prediction_negates_risk` | Believes you can predict high return with low risk | "there are ways to predict high return on something with low risk" | 2 |
| `idk_no_reasoning` | Cannot explain | "I guessed" | 2 |

**Key finding:** The dominant pattern (10/21 = 48%) is a sophisticated-sounding but incorrect argument: "exceptions exist, therefore the general principle is false." This is an important reasoning error, not just a knowledge gap.

---

### Q31: Stock Market Function (n=12 diagnose)
**Anchor:** Primary function of stock market is bringing buyers and sellers together. Correct = C.

| Tag | Description | Example Quote | Freq |
|-----|-------------|---------------|------|
| `guarantees_profit` | Believes the stock market guarantees returns | "the stock market is an attempt to help you grow money" | 3 |
| `capital_raising_primary` | Believes primary function is company fundraising | "give the companies money to work with" | 2 |
| `supply_demand_framing` | Gets close with supply/demand language but chose wrong | "price is based on supply and demand" | 2 |
| `idk_no_reasoning` | Cannot explain | -- | 1 |

---

### Q32: Long-Term Asset Returns (n=11 diagnose)
**Anchor:** Over long periods, stocks have highest average returns. Correct = C (stocks).

| Tag | Description | Example Quote | Freq |
|-----|-------------|---------------|------|
| `bonds_safest_therefore_best` | Equates safety with returns; bonds are safe so they return most | "bonds are safe and consistent sources of investment" | 4 |
| `stocks_too_risky_for_returns` | Believes stock risk means returns cannot be highest | "stocks are more risky so it could not always give the highest return" | 3 |
| `savings_safest_therefore_best` | Believes savings accounts return most because no risk | "saving accounts because there is a lot of risks with stocks" | 1 |
| `idk_no_reasoning` | Cannot explain | -- | 1 |

**Key finding:** Students conflate "safe" with "high returns," essentially inverting the risk-return tradeoff. This connects to Q30 and Q35 misconceptions.

---

### Q33: Probability % to Count (n=2 diagnose)
**Anchor:** 1% of 1,000 ticket holders = 10 expected winners. Correct = C (10).

Small sample. One student answered 5 ("lowest option"), one calculated incorrectly as 10 but chose A.

---

### Q34: Diversification Effect (n=4 diagnose)
**Anchor:** Diversifying across assets decreases risk. Correct = B (decrease).

| Tag | Description | Example Quote | Freq |
|-----|-------------|---------------|------|
| `more_complexity_more_risk` | Believes managing multiple investments is harder and riskier | "putting more money into different assets exposes to more types of risks" | 2 |
| `correct_reasoning_wrong_answer` | Explains the right concept but chose wrong answer | "risk decreases because the money spreads across assets" (chose C) | 1 |

---

### Q35: Risk-Return Relationship (n=9 diagnose)
**Anchor:** Chance to make a lot of money usually comes with chance to lose a lot. Correct = A (True).

| Tag | Description | Example Quote | Freq |
|-----|-------------|---------------|------|
| `real_world_counterexample` | Uses real-life scenarios where high pay is low risk (e.g., pet-sitting) | "house and pet-sitting for a family... no risk" | 3 |
| `exceptions_disprove_rule` | Same pattern as Q30: exceptions invalidate general rules | "a high potential gain does not automatically mean high potential risk" | 3 |
| `trust_based_reasoning` | Frames financial decisions as trust decisions, not risk calculations | "depends on the level of trust I have for someone" | 1 |

---

### Q36: Diversification Principle, Savings (n=50 diagnose)
**Anchor:** Saving in more than one place is generally less risky. Correct = A (True).

| Tag | Description | Example Quote | Freq |
|-----|-------------|---------------|------|
| `correct_reasoning_wrong_answer` | Explains diversification correctly but chose False | "if one investment goes bad you still have the other money" but chose B | 25 |
| `all_places_can_fail` | Believes multiple places can all fail simultaneously | "those places could still face risks at the same time" | 8 |
| `misread_question` | Explicitly says they misread | "I accidentally said false, I actually agree" | 6 |
| `idk_no_reasoning` | Cannot explain | "no" (too short) | 3 |

**CRITICAL FINDING:** 25/50 (50%) of students who answered this wrong actually provided correct reasoning in their explanation. Combined with 6 who explicitly misread, that is 31/50 (62%) who likely understand diversification but made a selection error. This item has the highest noise-to-signal ratio in the entire assessment.

---

### Q37: Insurance Types (n=18 diagnose)
**Anchor:** Auto liability covers injuries to others in an accident. Correct = C.

| Tag | Description | Example Quote | Freq |
|-----|-------------|---------------|------|
| `health_insurance_for_injuries` | Believes health insurance covers accident injuries generally | "health insurance covers things to do with a person and their health" | 7 |
| `auto_liability_for_self` | Believes auto liability covers YOUR injuries, not others' | "auto liability covers you" | 4 |
| `misread_question` | Admits misreading | "I misread the question" | 2 |
| `idk_no_reasoning` | Cannot explain | -- | 2 |

---

### Q38: Inflation Protection (n=19 diagnose)
**Anchor:** 25-year fixed mortgage benefits most from high inflation. Correct = D.

| Tag | Description | Example Quote | Freq |
|-----|-------------|---------------|------|
| `fixed_bond_best` | Believes a fixed bond protects against inflation | "fixed bond because you will continue to earn just as much" | 3 |
| `cd_benefits_from_inflation` | Believes CD rates automatically adjust upward with inflation | "the amount you make when investing in a CD will increase" | 2 |
| `understands_but_wrong_choice` | Explains fixed-rate logic correctly but chose wrong option | "even during sudden increase, they would still pay same interest" (but chose A) | 3 |
| `idk_no_reasoning` | Cannot explain | "I forgot what I put" | 3 |

---

### Q39: Stocks vs. Bonds Risk (n=11 diagnose)
**Anchor:** Stocks are generally riskier than bonds. Correct = A (True).

| Tag | Description | Example Quote | Freq |
|-----|-------------|---------------|------|
| `bonds_contain_stocks` | Believes bonds are bundles of stocks | "bonds encompass several different stocks" | 1 |
| `some_bonds_risky_too` | Argues some bonds are also risky, so stocks aren't always riskier | "high yields or long term bonds can carry significant risks" | 2 |
| `idk_no_reasoning` | Cannot explain | "I'm unsure", "I guessed" | 4 |

---

### Q40: 2008 Financial Crisis (n=9 diagnose)
**Anchor:** Poor risk management contributed to the 2007-2008 crisis. Correct = B.

| Tag | Description | Example Quote | Freq |
|-----|-------------|---------------|------|
| `high_savings_risk` | Believes the crisis was about savings risk | "high savings risk" | 1 |
| `low_borrowing_caused_crash` | Believes low borrowing (opposite of reality) caused the crash | "there was low borrowing, so less money for banks" | 1 |
| `excessive_lending_no_risk_mgmt` | Understands excessive lending but chose wrong label | "handing out mortgages to people without knowing who could pay" but chose A or D | 4 |
| `idk_no_reasoning` | Cannot explain | "I am not sure" | 1 |

---

## 4. Confirm Understanding Patterns (Derived from Real Data)

For confirm responses, we need to assess: Does the explanation demonstrate genuine understanding or lucky guessing?

### Scoring Levels for Confirm

| Level | Label | Criteria |
|-------|-------|----------|
| **Full credit** | `verified_understanding` | Explains the correct mechanism or reasoning clearly |
| **Partial credit** | `partial_understanding` | Gets the general idea right but reasoning is incomplete or has minor errors |
| **No credit** | `likely_guess` | Cannot explain, says "I guessed," or provides incorrect reasoning despite correct answer |

### High-Volume Confirm Items: Understanding Patterns

**Q11 Confirm (n=32):** Diversification (Stock vs. Fund)
- Verified: "mutual fund spreads investment over many companies, reduces risk" (~60%)
- Partial: "you shouldn't buy just one stock" (knows rule but not why) (~25%)
- Likely guess: "I don't know what a mutual fund is" (~15%)

**Q2 Confirm (n=31):** Mortgages
- Verified: "loan paid off faster, interest accrues for fewer years" (~70%)
- Partial: "because you are paying in less amount of time" (correct but no mechanism) (~20%)
- Likely guess: "not sure" (~10%)

**Q13 Confirm (n=29):** Insurance Deductible
- Verified: "the amount you pay out of pocket before insurance covers the rest" (~45%)
- Partial: "no" or very brief agreement (~15%)
- Likely guess: "I got lucky, I don't know how a deductible works" (~25%)
- IDK: "don't know, guessed" (~15%)

**Q40 Confirm (n=23):** 2008 Financial Crisis
- Verified: "banks took on too much risk with risky mortgages" (~55%)
- Partial: "if you don't manage risk you can lose a lot" (generic) (~30%)
- Likely guess: "I don't know but I think low risk management..." (~15%)

**Q3 Confirm (n=18):** Inflation Definition
- Verified: "prices rise, purchasing power decreases" (~75%)
- Partial: "cost of living is higher" (correct but surface level) (~20%)
- Likely guess: -- (~5%)

---

## 5. Cross-Item Findings

### 5a. Misconception Clusters (Connected Patterns)

**Cluster 1: "Lower Inflation = Lower Prices" (Q6)**
The single most prevalent misconception, affecting 35+ students. This is a rate-of-change conceptual error.

**Cluster 2: "Safety = Returns" Inversion (Q30, Q32, Q35)**
Students equate low risk with high returns, or believe exceptions disprove the risk-return tradeoff. 10 students on Q30, 4 on Q32, and 6 on Q35 show variants of this pattern.

**Cluster 3: Empathy-Driven Reasoning (Q7)**
18 students chose "young working couples" for Q7 because they empathize with youth struggles, overriding the economic logic about fixed incomes.

**Cluster 4: Insurance Confusion (Q12, Q13, Q37)**
Consistent confusion about: insurance purpose (routine vs. catastrophic), deductible definition, and liability coverage scope. Q12 shows 67% believe health insurance is primarily for routine care.

**Cluster 5: Diversification Understanding with Selection Errors (Q36, Q14, Q10)**
Q36 shows 62% of "wrong" answers came from students who understand diversification but misread the question or selected the wrong option. Q10 and Q14 show similar patterns.

### 5b. Items with High Noise-to-Signal Ratio

These items have many students who demonstrate correct reasoning despite selecting the wrong answer:

| Item | Correct Reasoning but Wrong Answer | Misread/Self-Corrects | Total Noise % |
|------|------------------------------------|-----------------------|---------------|
| Q36 | 25/50 (50%) | 6/50 (12%) | 62% |
| Q2 | 8/26 (31%) | 3/26 (12%) | 42% |
| Q10 | 8/48 (17%) | 6/48 (13%) | 29% |
| Q8 | 3/34 (9%) | 0/34 (0%) | 9% |

**Recommendation:** For these items, the open-ended response is more diagnostically valid than the anchor score alone. The AI scoring system should flag `correct_reasoning_wrong_answer` cases for potential override in the diagnostic report.

### 5c. Items with High IDK Rates (Confirm)

| Item | IDK Rate | Interpretation |
|------|----------|----------------|
| Q13 Confirm | 14% | Students genuinely guessed the deductible definition |
| Q12 Confirm | 14% | Students cannot explain insurance purpose despite correct answer |
| Q8 Confirm | 13% | Auto loan negotiation is unfamiliar |
| Q10 Confirm | 12% | Credit report knowledge is thin |

These confirm the value of the confirm variant: 12-14% of students who got the anchor right with low confidence truly were guessing.

---

## 6. Scoring Framework Summary

### Diagnose Scoring Output

For each diagnose response, the AI should produce:

```json
{
  "credit": 0 | 50 | 100,
  "primary_tag": "string (from item taxonomy)",
  "secondary_tag": "string | null",
  "classification_confidence": "high | medium | low",
  "flags": ["self_corrects", "correct_reasoning_wrong_answer", "misread_question"],
  "evidence_quote": "string (key phrase from response)",
  "corrected_to_right": true | false | null
}
```

**Credit rules:**
- 100 = Student clearly explains a specific, identifiable misconception (scorable for diagnosis)
- 50 = Response reveals partial misconception or mixed reasoning
- 0 = IDK, blank, too short, or cannot classify

### Confirm Scoring Output

```json
{
  "credit": 0 | 50 | 100,
  "understanding_level": "verified | partial | likely_guess",
  "reasoning_quality": "mechanism_explained | rule_stated | vague | none",
  "classification_confidence": "high | medium | low",
  "evidence_quote": "string (key phrase from response)"
}
```

**Credit rules:**
- 100 = Explains the mechanism or reasoning clearly (verified understanding)
- 50 = States the correct rule or direction without explaining why
- 0 = IDK, guessed, blank, or reasoning is incorrect despite correct answer

---

## 7. Next Steps

1. **Resolve edge case policies** (Section 2): Approve or revise the proposed scoring policies for IDK, self-corrects, short responses, and blanks.
2. **Build AI scoring prompts**: One prompt per item using the taxonomies above, with real example responses as few-shot calibration.
3. **Handle high-noise items**: Decide whether Q36, Q2, Q10 should have special handling for `correct_reasoning_wrong_answer` cases.
4. **Design instructor report**: Use the cross-item findings (Section 5) to structure the diagnostic summary.
5. **Investigate trigger mismatches**: 32 diagnose + 8 confirm assigned under wrong conditions.
