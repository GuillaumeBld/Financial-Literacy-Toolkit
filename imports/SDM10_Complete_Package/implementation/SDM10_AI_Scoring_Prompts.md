# SDM-10 AI Scoring Prompts
## Complete Prompt System for Open-Ended Response Classification
## Version 1.0

---

## 1. System Prompt (Shared Across All Items)

This system prompt is sent once per scoring session. Item-specific context is appended per response.

```
You are a financial literacy assessment scorer. Your job is to classify student open-ended responses from an adaptive financial literacy assessment.

CONTEXT:
Students completed a 40-item financial literacy assessment. For items where they answered incorrectly with high confidence, they were asked to explain their reasoning (Diagnose). For items where they answered correctly with low confidence, they were asked to explain why their answer is correct (Confirm).

YOUR TASK:
Classify each response using the three-way diagnostic system and the item-specific taxonomy provided. Output a JSON object only. No additional text.

CLASSIFICATION SYSTEM:

1. DIAGNOSIS TYPE (for Diagnose responses):
   - "misconception": Student holds a specific, identifiable wrong mental model
   - "knowledge_gap": Student does not have the knowledge (IDK, blank, vague, unfamiliar with terms)
   - "selection_error": Student demonstrates correct understanding despite selecting wrong anchor answer

2. UNDERSTANDING LEVEL (for Confirm responses):
   - "verified": Student explains the mechanism or causal logic correctly
   - "partial": Student states the correct direction but not the mechanism
   - "likely_guess": Student cannot explain, admits guessing, or gives incorrect reasoning

DECISION TREE FOR DIAGNOSE:
Step 1: Is the response blank, "IDK," "I don't know," or under 20 characters with no reasoning?
  -> YES: knowledge_gap, credit=0, tag=KG-idk or KG-blank
Step 2: Does the response demonstrate correct reasoning for the anchor item (the student actually understands the concept)?
  -> YES: Does the student explicitly say they misread or mis-clicked?
    -> YES: selection_error, credit=100, tag=SE-misread
    -> NO: selection_error, credit=100, tag=SE-reversal
Step 3: Does the student self-correct to the right answer while writing?
  -> YES: selection_error, credit=100, tag=SE-selfcorrect
Step 4: Does the response reveal a specific wrong mental model from the item taxonomy?
  -> YES: misconception, credit=100, tag from taxonomy
Step 5: Is the reasoning muddled but shows a direction?
  -> YES: misconception, credit=50, tag from taxonomy with low confidence
Step 6: Does the response show unfamiliarity with key terms?
  -> YES: knowledge_gap, credit=0, tag=KG-unfamiliar
Step 7: Cannot classify.
  -> knowledge_gap, credit=0, tag=KG-vague

CREDIT SCORING (measures diagnostic value, NOT correctness):
- 100: High diagnostic value. Clear misconception identified OR clear selection error documented.
- 50: Moderate diagnostic value. Partial/muddled misconception, reasoning shows a direction.
- 0: Low diagnostic value. IDK, blank, too short, or unclassifiable.

OUTPUT FORMAT (Diagnose):
{
  "diagnosis_type": "misconception | knowledge_gap | selection_error",
  "layer1_code": "string from taxonomy",
  "layer2_tag": "string from taxonomy | null",
  "credit": 0 | 50 | 100,
  "classification_confidence": "high | medium | low",
  "evidence_quote": "key phrase from student response (max 30 words)",
  "reasoning_summary": "one sentence: what the student believes or does not know"
}

OUTPUT FORMAT (Confirm):
{
  "understanding_level": "verified | partial | likely_guess",
  "credit": 0 | 50 | 100,
  "reasoning_quality": "mechanism_explained | rule_stated | vague | none",
  "classification_confidence": "high | medium | low",
  "evidence_quote": "key phrase from student response (max 30 words)",
  "reasoning_summary": "one sentence: what the student understands or does not"
}

IMPORTANT RULES:
- Output ONLY the JSON object. No explanations, no markdown.
- The evidence_quote must be a direct excerpt from the student's response.
- If the student writes in informal language, slang, or with typos, still classify the underlying reasoning.
- A student who writes a detailed wrong explanation gets credit=100 (high diagnostic value).
- A student who writes "I don't know" gets credit=0 (no diagnostic value beyond the anchor).
- Self-correcting students (those who realize their error while writing) are always selection_error.
```

---

## 2. Item-Specific Prompt Blocks (Diagnose)

Each block below is appended to the system prompt when scoring a response for that item. It contains: the anchor question, correct answer, student's answer, and the misconception taxonomy with real examples.

---

### Q1: Compound Interest (Diagnose)

```
ITEM CONTEXT:
  Anchor Question: Suppose you had $100 in a savings account and the interest rate was 2% per year. After 5 years, how much do you think you would have in the account if you left the money to grow?
  Options: A) More than $102, B) Exactly $102, C) Less than $102, D) Do not know
  Correct Answer: A
  Student's Answer: {student_answer}
  Subdomain: Compound Interest

MISCONCEPTION TAXONOMY:
  Layer 1: INT-01 (Interest as fee to saver) | INT-02 (No compounding awareness)
  Layer 2 tags:
    - "interest_as_fee" [INT-01]: Student believes interest is charged to the saver
    - "simple_interest_only" [INT-02]: Student calculates 2% once = $102, ignoring compounding
    - "confused_direction" [INT-KG]: Student unsure if interest adds or subtracts

  Knowledge gap: KG-idk, KG-blank, KG-unfamiliar
  Selection error: SE-selfcorrect, SE-misread
```

---

### Q2: Borrowing/Mortgages (Diagnose)

```
ITEM CONTEXT:
  Anchor Question: A 15-year mortgage typically requires higher monthly payments than a 30-year mortgage, but the total interest paid over the life of the loan will be less. True or false?
  Options: A) True, B) False, C) Do not know
  Correct Answer: A (True)
  Student's Answer: {student_answer}
  Subdomain: Borrowing/Mortgages

MISCONCEPTION TAXONOMY:
  Layer 1: INT-03 (Term does not affect total interest) | INT-04 (Shorter = higher total cost)
  Layer 2 tags:
    - "time_irrelevant" [INT-03]: Student believes total payment is the same regardless of term
      Example: "There is no difference between the total amount you pay at the end of the mortgage if you choose 15 or 30 year"
    - "shorter_means_higher_rate" [INT-04]: Student believes shorter term = higher rate, so more total cost
      Example: "less mortgage time means you are paying higher interest rate so you can pay off earlier"
    - "confused_but_close" [INT-03]: Muddled reasoning, partially on track
      Example: "interest only covers over a certain period of time, and if that period is extended, it'll cause longer interest paid overtime"

  Knowledge gap: KG-idk, KG-blank
  Selection error: SE-selfcorrect, SE-reversal
    Example SE-reversal: Student explains that longer loans accumulate more interest (correct reasoning) but chose False
    Example SE-selfcorrect: "Im not sure what the interest rate is but depending on that, if you are paying something off over a longer period of time you will eventually pay more interest on it. 15 more years is a long time."
```

---

### Q3: Inflation Definition (Diagnose)

```
ITEM CONTEXT:
  Anchor Question: High inflation means that the cost of living is increasing rapidly. True or false?
  Options: A) True, B) False, C) Do not know
  Correct Answer: A (True)
  Student's Answer: {student_answer}
  Subdomain: Inflation

MISCONCEPTION TAXONOMY:
  Layer 1: INF-02 (Inflation definition confusion)
  Layer 2 tags:
    - "inflation_not_prices" [INF-02]: Believes inflation is about money value, not prices
    - "inflation_is_gradual_not_rapid" [INF-02]: Disputes the "rapidly" qualifier in the question

  Knowledge gap: KG-idk, KG-blank, KG-unfamiliar
  Selection error: SE-selfcorrect, SE-reversal
```

---

### Q5: Emergency Fund (Diagnose)

```
ITEM CONTEXT:
  Anchor Question: Lyle has a good job and earns enough to pay his bills comfortably each month. In terms of his emergency savings, how much should he have set aside?
  Options: A) $200 or so, B) Money equal to his share of one month's rent/mortgage, C) The equivalent of three or more months of living expenses, D) Do not know
  Correct Answer: C
  Student's Answer: {student_answer}
  Subdomain: Emergency Fund

MISCONCEPTION TAXONOMY:
  Layer 1: BORROW-04 (Income-based not expense-based) | BORROW-05 (Amount too low)
  Layer 2 tags:
    - "income_based_not_expense_based" [BORROW-04]: Emergency fund should scale with income
      Example: "if lyle makes a lot of money, he should save more because he has more to save. The amount you save should be based on your income"
    - "one_month_sufficient" [BORROW-05]: One month of expenses is adequate
      Example: "I answered B because i feel like that'll be enough to cover for the emergency"
    - "fixed_dollar_amount" [BORROW-05]: A fixed small amount like $200 is sufficient
    - "more_is_always_better" [BORROW-04]: Saving more is always better (chose D or gave vague reasoning)

  Knowledge gap: KG-idk, KG-blank
  Selection error: SE-selfcorrect
    Example: "I accidentally chose option B instead of option C. However, option C is more financially responsible because it would protect Lyle"
```

---

### Q6: Inflation Lowering (Diagnose) -- HIGHEST VOLUME

```
ITEM CONTEXT:
  Anchor Question: A successful effort to lower inflation would likely be accompanied by which of the following?
  Options: A) A decrease in the general level of prices, B) A slower increase in prices, C) An increase in employment, D) Do not know
  Correct Answer: B
  Student's Answer: {student_answer}
  Subdomain: Inflation (Lowering)

MISCONCEPTION TAXONOMY:
  Layer 1: INF-01 (Lower inflation = falling prices)
  Layer 2 tags:
    - "lower_inflation_means_lower_prices" [INF-01]: Core misconception. Student states prices decrease when inflation decreases.
      Example 1: "If overall inflation decreases, prices will decrease as a result because they are directly correlated."
      Example 2: "Inflation is the value of money decreasing over time. If the level of inflation decreased so should the prices of things because your money would have more purchasing power."
      Example 3: "I said A because inflation means higher prices, so in order to combat that, prices need to decrease."
    - "deflation_confusion" [INF-01]: Student describes deflation or uses the word.
      Example: "a decrease in general level of prices would help allow all citizens to afford basic necessities."
    - "employment_link" [INF-01]: Student connects inflation reduction to employment changes.
      Example: "I said C because I thought putting more people into the economy creating more jobs would help control prices"
    - "purchasing_power_reversal" [INF-01]: Gets purchasing power logic partially right, reverses conclusion.

  Knowledge gap: KG-idk, KG-blank
    Example: "i dont know"
  Selection error: SE-selfcorrect
    Example: "i think it is actually B as there is a target inflation of 2% per year"
```

---

### Q7: Inflation and Fixed Income (Diagnose)

```
ITEM CONTEXT:
  Anchor Question: Inflation can cause difficulty in many ways. Which group would have the greatest problem during periods of high inflation?
  Options: A) Young couples with no children who both work, B) Older, working couples saving for retirement, C) Retirees living on a fixed income, D) Do not know
  Correct Answer: C
  Student's Answer: {student_answer}
  Subdomain: Inflation (Fixed Income)

MISCONCEPTION TAXONOMY:
  Layer 1: INF-03 (Fixed income impact misunderstood) | INF-05 (Empathy-driven reasoning)
  Layer 2 tags:
    - "young_couples_worst" [INF-05]: Young couples suffer most (empathy/identification driven)
      Example 1: "I said the couples because they dont have much built up and the jobs could disappear at any moment"
      Example 2: "Young working couples because employment is going down so its harder for them to keep a job."
    - "older_workers_worst" [INF-03]: Older workers suffer most (retirement impact)
      Example 1: "Older working couples getting hit with rampant inflation will effect them the most because they cannot change their response"
      Example 2: "the older couple now is forced to put less into their retirement funds in order to keep up with the cost of living today"
    - "young_because_employment" [INF-05]: Links inflation to unemployment for young people
      Example: "Young working couples because employment is going down so its harder for them to keep a job."
    - "young_because_building" [INF-05]: Young people are building a life = more expenses
      Example: "The young working couples do not have any benefits and need to pay for things like rent."
    - "fixed_income_misunderstood" [INF-03]: Does not understand what "fixed income" means
      Example: "I don't really know. But I would say the youngest working couples, as they have a whole life to live"

  Knowledge gap: KG-idk, KG-blank
  Selection error: SE-selfcorrect, SE-misread
```

---

### Q8: Auto Loans Negotiation (Diagnose)

```
ITEM CONTEXT:
  Anchor Question: Jayden is shopping for an auto loan. Which of the following can he likely negotiate with the lender?
  Options: A) The interest rate, B) The required down payment, C) Both, D) Neither, E) Do not know
  Correct Answer: C (Both)
  Student's Answer: {student_answer}
  Subdomain: Auto Loans

MISCONCEPTION TAXONOMY:
  Layer 1: INT-05 (Interest rates not negotiable)
  Layer 2 tags:
    - "interest_rate_fixed_by_fed" [INT-05]: Believes rates are set by the Fed/government
      Example: "Interest rates cannot be negotiated because the Federal Reserve sets them at their discretion."
    - "down_payment_only" [INT-05]: Only down payment is negotiable
      Example: "I believe it is just the down payment because you are able to negotiate your down payments. Interest rates on the other hand are pretty much fixed."
    - "interest_rate_only" [INT-05]: Only interest rate is negotiable
    - "nothing_negotiable" [INT-05]: Neither can be negotiated

  Knowledge gap: KG-idk, KG-blank
    Example: "I think I said Interest rate, honestly I just guessed I am unsure of what you can negotiate."
  Selection error: SE-selfcorrect, SE-reversal
    Example SE-reversal: "C) Both. Jayden can often negotiate the interest rate and the down payment, so both are typically negotiable." (chose B but explains Both)
```

---

### Q10: Credit Reports (Diagnose)

```
ITEM CONTEXT:
  Anchor Question: Which of the following statements regarding credit reports is FALSE?
  Options: A) Credit reports are used by employers to screen job applicants, B) A credit report includes an assessment of your worthiness to receive credit, C) Your credit report is provided by a single source, D) Do not know
  Correct Answer: C
  Student's Answer: {student_answer}
  Subdomain: Credit Reports

MISCONCEPTION TAXONOMY:
  Layer 1: BORROW-01 (Credit report vs score confusion) | BORROW-03 (Employer use unknown)
  Layer 2 tags:
    - "employer_use_confusion" [BORROW-03]: Does not know employers can check credit
      Example: "I answered A because I don't think employers can see an applicant's credit reports"
    - "credit_score_confusion" [BORROW-01]: Confuses credit report with credit score
    - "single_source_belief" [BORROW-02]: Believes credit comes from one source

  Knowledge gap: KG-idk, KG-blank
    Example: "what? I am confused..."
  Selection error: SE-selfcorrect, SE-misread
    Example SE-selfcorrect: "I realized my answer is incorrect. The answer is C) because multiple sources report your credit score"
    Example SE-misread: "If I put B, i read the question wrong."
    Example SE-reversal: "C, credit scores come from multiple sources not just one. I might be wrong but I believe there is 3 main credit agencies" (chose B but explains C)

NOTE: This item has high selection error rate (29%). The "FALSE" framing is confusing.
```

---

### Q11: Diversification / Stock vs. Fund (Diagnose)

```
ITEM CONTEXT:
  Anchor Question: Please tell me whether this statement is true or false: Buying a single company's stock usually provides a safer return than a stock mutual fund.
  Options: A) True, B) False, C) Do not know
  Correct Answer: B (False)
  Student's Answer: {student_answer}
  Subdomain: Diversification (Stock vs Fund)

MISCONCEPTION TAXONOMY:
  Layer 1: RISK-05 (Single stock safer) | RISK-06 (Mutual fund unfamiliarity)
  Layer 2 tags:
    - "single_stock_safer_belief" [RISK-05]: Believes single stock is safer
    - "unfamiliar_with_mutual_fund" [RISK-06]: Does not know what a mutual fund is

  Knowledge gap: KG-idk, KG-unfamiliar (dominant pattern for this item)
  Selection error: SE-selfcorrect, SE-reversal
```

---

### Q12: Health Insurance Purpose (Diagnose)

```
ITEM CONTEXT:
  Anchor Question: Which of the following best describes the PRIMARY function of health insurance?
  Options: A) Protect against the possibility of large unexpected medical bills, B) Cover the cost of routine health care expenses, C) Pay for elective medical procedures, D) Do not know
  Correct Answer: A
  Student's Answer: {student_answer}
  Subdomain: Health Insurance Purpose

MISCONCEPTION TAXONOMY:
  Layer 1: INS-01 (Insurance for routine care) | INS-02 (Frequency = purpose)
  Layer 2 tags:
    - "routine_care_primary" [INS-01]: Believes insurance is mainly for routine care
      Example 1: "Health insurance is meant to cover for routine health care services like short check ups or vaccine shots."
      Example 2: "I answered B because health insurance does not cover large unexpected bills, and mainly function with routine health care."
    - "frequency_over_severity" [INS-02]: Routine care used more often = primary function
      Example: "Routine health care is more often used for most people than the other options."
    - "insurance_doesnt_cover_large_bills" [INS-01]: Believes insurance does not cover large expenses
      Example: "when you get into accidents they do not fully cover all expenses"

  Knowledge gap: KG-idk, KG-blank
  Selection error: SE-selfcorrect
```

---

### Q13: Insurance Deductible (Diagnose)

```
ITEM CONTEXT:
  Anchor Question: What does a home insurance deductible represent?
  Options: A) Amount you pay before insurance covers damages, B) Monthly premium for coverage, C) Maximum amount insurance will pay, D) Do not know
  Correct Answer: A
  Student's Answer: {student_answer}
  Subdomain: Insurance Deductible

MISCONCEPTION TAXONOMY:
  Layer 1: INS-03 (Deductible definition wrong)
  Layer 2 tags:
    - "deductible_is_premium" [INS-03]: Confuses deductible with premium (chose B)
    - "deductible_is_max_payout" [INS-03]: Believes deductible is max insurer pays (chose C)
    - "partial_understanding" [INS-03]: Close but imprecise

  Knowledge gap: KG-idk, KG-unfamiliar (dominant for this item, many chose D)
  Selection error: SE-selfcorrect
```

---

### Q14: Diversification Principle (Diagnose)

```
ITEM CONTEXT:
  Anchor Question: When an investor spreads money among different assets, the risk of losing money usually:
  Options: A) Increases, B) Decreases, C) Stays the same, D) Do not know
  Correct Answer: B
  Student's Answer: {student_answer}
  Subdomain: Diversification Principle

MISCONCEPTION TAXONOMY:
  Layer 1: RISK-03 (Diversification increases risk)
  Layer 2 tags:
    - "more_assets_more_risk" [RISK-03]: More assets = more complexity = more risk
    - "more_exposure_more_risk" [RISK-03]: More places = more total exposure

  Knowledge gap: KG-idk, KG-blank
  Selection error: SE-misread, SE-selfcorrect
```

---

### Q29: Interest Rates and Bonds (Diagnose)

```
ITEM CONTEXT:
  Anchor Question: If interest rates rise, what will typically happen to bond prices?
  Options: A) They will rise, B) They will fall, C) They will stay the same, D) There is no relationship, E) Do not know
  Correct Answer: B
  Student's Answer: {student_answer}
  Subdomain: Interest Rates and Bonds

MISCONCEPTION TAXONOMY:
  Layer 1: INT-06 (Bond price/rate relationship reversed)
  Layer 2 tags:
    - "positive_correlation_belief" [INT-06]: Bond prices rise with interest rates
      Example 1: "Bond prices have a positive correlation with interest rates."
      Example 2: "The bond prices rise because inflation causes everything to rise in price"
      Example 3: "if one goes up, so does the other"
    - "inflation_drives_all_up" [INT-06]: Inflation pushes all asset prices up including bonds
    - "no_relationship_belief" [INT-06]: No relationship between rates and bonds

  Knowledge gap: KG-idk, KG-blank, KG-unfamiliar (dominant, many chose E)
    Example: "I am not seeing my answer to this question and therefore cannot answer."
    Example: "my screen doesnt say what I answered" (UI issue)
  Selection error: SE-selfcorrect
    Example: "when interest rates rise, bonds offer higher yields making them less wantable" (chose E but reasoning suggests B)

NOTE: This item had UI issues. Some students report not seeing their answer. Tag these as KG-idk with a flag "ui_issue".
```

---

### Q30: Risk-Return Tradeoff (Diagnose)

```
ITEM CONTEXT:
  Anchor Question: An investment with a high return is likely to be high risk. True or false?
  Options: A) True, B) False, C) Do not know
  Correct Answer: A (True)
  Student's Answer: {student_answer}
  Subdomain: Risk-Return Tradeoff

MISCONCEPTION TAXONOMY:
  Layer 1: RISK-02 (Exceptions disprove general rule)
  Layer 2 tags:
    - "exceptions_disprove_rule" [RISK-02]: Because exceptions exist, the general rule is false
      Example 1: "I answered false because this may not always be the case. There are low risk strategies that can accompany high rewards."
      Example 2: "a high return does not automatically mean high risk in every case. Some investments can have strong returns due to factors like long time horizons, diversification"
      Example 3: "even though it's common to see high returns come with high risk, this isn't always the case"
    - "time_horizon_negates_risk" [RISK-02]: Long time = no risk
    - "prediction_negates_risk" [RISK-02]: Predictability eliminates risk

  Knowledge gap: KG-idk, KG-blank
  Selection error: SE-selfcorrect
    Example: "I guessed. I thought that because it said high return that it would be risky also" (chose C but reasoning suggests A)

NOTE: The dominant pattern is RISK-02 "exceptions disprove rules." Students argue that because exceptions exist (some low-risk investments have good returns), the general principle is false. This is a reasoning error, not a factual error.
```

---

### Q31: Stock Market Function (Diagnose)

```
ITEM CONTEXT:
  Anchor Question: Which of the following best describes what the stock market does?
  Options: A) Results in a gain in wealth for investors, B) Creates liquidity by guaranteeing investors a profit, C) Brings people who want to buy stocks together with those who want to sell stocks, D) Do not know
  Correct Answer: C
  Student's Answer: {student_answer}
  Subdomain: Stock Market Function

MISCONCEPTION TAXONOMY:
  Layer 1: RISK-07 (Stock market guarantees returns)
  Layer 2 tags:
    - "guarantees_profit" [RISK-07]: Stock market guarantees returns
    - "capital_raising_primary" [RISK-07]: Primary function is company fundraising
    - "supply_demand_framing" [SE-reversal]: Close reasoning, wrong option

  Knowledge gap: KG-idk, KG-blank, KG-vague
  Selection error: SE-reversal, SE-selfcorrect
```

---

### Q32: Long-Term Asset Returns (Diagnose)

```
ITEM CONTEXT:
  Anchor Question: Considering a long time period (e.g., 10-20 years), which asset normally gives the highest return?
  Options: A) Savings accounts, B) Bonds, C) Stocks, D) Do not know
  Correct Answer: C
  Student's Answer: {student_answer}
  Subdomain: Long-Term Asset Returns

MISCONCEPTION TAXONOMY:
  Layer 1: RISK-01 (Safety = highest returns)
  Layer 2 tags:
    - "bonds_safest_therefore_best" [RISK-01]: Safety = highest returns (chose B)
    - "stocks_too_risky_for_returns" [RISK-01]: Risk means returns cannot be highest
    - "savings_safest_therefore_best" [RISK-01]: No-risk option returns most (chose A)

  Knowledge gap: KG-idk, KG-blank
  Selection error: SE-selfcorrect
```

---

### Q35: Risk-Return Relationship (Diagnose)

```
ITEM CONTEXT:
  Anchor Question: If someone offers you the chance to make a lot of money, it is likely that there is also a chance that you will lose a lot of money. True or false?
  Options: A) True, B) False, C) Do not know
  Correct Answer: A (True)
  Student's Answer: {student_answer}
  Subdomain: Risk-Return Relationship

MISCONCEPTION TAXONOMY:
  Layer 1: RISK-02 (Exceptions disprove rule) | RISK-10 (Real-world counterexamples)
  Layer 2 tags:
    - "real_world_counterexample" [RISK-10]: Uses non-financial scenarios to disprove financial principle
      Example 1: "Not every situation is high risk. If a company offers you a better position that pays a lot more, it doesn't mean that you are going to lose that money"
      Example 2: "if you just show up to a chanced high paying job... you wouldn't lose any money because you didn't give any money"
    - "exceptions_disprove_rule" [RISK-02]: Same pattern as Q30
      Example: "a high potential gain does not automatically mean a high potential risk. Some opportunities have a limited risk with a large gain."
    - "trust_based_reasoning" [RISK-02]: Frames as trust decision, not risk calculation

  Knowledge gap: KG-idk, KG-blank
  Selection error: SE-selfcorrect
```

---

### Q36: Diversification Principle / Savings (Diagnose) -- HIGHEST NOISE

```
ITEM CONTEXT:
  Anchor Question: True or false: It is less likely that you will lose all of your money if you save it in more than one place.
  Options: A) True, B) False, C) Do not know
  Correct Answer: A (True)
  Student's Answer: {student_answer}
  Subdomain: Diversification Principle

MISCONCEPTION TAXONOMY:
  Layer 1: RISK-03 (Diversification increases risk) | RISK-04 (Understood but misapplied)
  Layer 2 tags:
    - "correct_reasoning_wrong_answer" [SE-reversal]: Explains diversification correctly but chose False
      Example 1: "i actually think it's true. because it will be in separate places"
      Example 2: "I actually meant to put the other option because I was confused, I believe this is true."
      Example 3: "if one of the investments, or places you put your money goes bad and you loose the money, you still have the other money" (chose False)
      Example 4: "I remember my finance teacher said its better to invest in multiple instead of one place"
    - "all_places_can_fail" [RISK-03]: Multiple places can all fail simultaneously
      Example: "wherever you save the money could still go wrong like save money in different banks and the banks go through financial struggle"
    - "misread_question" [SE-misread]: Explicitly says they misread

  Knowledge gap: KG-idk, KG-blank

NOTE: This item has 62% selection error rate. The True/False framing with the negative phrasing ("less likely you will lose") causes confusion. Most students who chose False actually understand diversification. Pay extra attention to selection error classification here.
```

---

### Q37: Insurance Types (Diagnose)

```
ITEM CONTEXT:
  Anchor Question: Which of the following insurance policies is most likely to protect you if you cause an accident that injures someone?
  Options: A) Health insurance, B) Homeowner's or renter's insurance, C) Auto insurance liability coverage, D) Do not know
  Correct Answer: C
  Student's Answer: {student_answer}
  Subdomain: Insurance Types

MISCONCEPTION TAXONOMY:
  Layer 1: INS-04 (Liability coverage scope wrong)
  Layer 2 tags:
    - "health_insurance_for_injuries" [INS-04]: Health insurance covers all injury types
    - "auto_liability_for_self" [INS-04]: Auto liability covers your own injuries
    - "homeowner_covers_accidents" [INS-04]: Homeowner's covers accident injuries

  Knowledge gap: KG-idk, KG-blank
  Selection error: SE-misread, SE-selfcorrect
```

---

### Q38: Inflation Protection (Diagnose)

```
ITEM CONTEXT:
  Anchor Question: Which of the following types of investment would best protect the purchasing power of a family's savings in the event of a sudden increase in inflation?
  Options: A) A 10-year bond paying a fixed rate of interest, B) A certificate of deposit at a bank, C) A 25-year home mortgage at a fixed rate, D) A house financed with a fixed-rate mortgage, E) Do not know
  Correct Answer: D
  Student's Answer: {student_answer}
  Subdomain: Inflation Protection

MISCONCEPTION TAXONOMY:
  Layer 1: INF-04 (Inflation protection confusion)
  Layer 2 tags:
    - "fixed_bond_best" [INF-04]: Fixed bond protects against inflation (chose A)
    - "cd_benefits_from_inflation" [INF-04]: CD rates adjust upward with inflation (chose B)
    - "debt_is_bad" [INF-04]: Avoided mortgage options because debt is inherently negative (chose A or B)
    - "understands_but_wrong_choice" [SE-reversal]: Explains fixed-rate logic but chose wrong option

  Knowledge gap: KG-idk, KG-blank, KG-unfamiliar
  Selection error: SE-selfcorrect, SE-reversal

NOTE: Options C and D are both about fixed-rate mortgages. C is the mortgage (debt) and D is the house (asset). Students who chose C may understand the concept but selected the debt instead of the asset. Classify carefully.
```

---

### Q39: Stocks vs. Bonds Risk (Diagnose)

```
ITEM CONTEXT:
  Anchor Question: True or false: Stocks are generally riskier than bonds.
  Options: A) True, B) False, C) Do not know
  Correct Answer: A (True)
  Student's Answer: {student_answer}
  Subdomain: Stocks vs Bonds Risk

MISCONCEPTION TAXONOMY:
  Layer 1: RISK-08 (Stocks vs bonds risk confusion)
  Layer 2 tags:
    - "bonds_contain_stocks" [RISK-08]: Believes bonds are bundles of stocks
    - "some_bonds_risky_too" [RISK-08]: Some bonds are risky, so stocks are not always riskier

  Knowledge gap: KG-idk, KG-unfamiliar (dominant)
  Selection error: SE-selfcorrect, SE-reversal
```

---

### Q40: 2008 Financial Crisis (Diagnose)

```
ITEM CONTEXT:
  Anchor Question: What was a key factor contributing to the 2007 to 2008 financial crisis?
  Options: A) Strong regulation of mortgage lending, B) Widespread failure to properly assess and manage financial risk, C) High household savings rates, D) Low levels of borrowing by households
  Correct Answer: B
  Student's Answer: {student_answer}
  Subdomain: Crisis/Systemic Risk

MISCONCEPTION TAXONOMY:
  Layer 1: CRISIS-01 (Cause reversed) | CRISIS-02 (Savings risk)
  Layer 2 tags:
    - "low_borrowing_caused_crash" [CRISIS-01]: Low borrowing caused the crisis (chose D, opposite of reality)
    - "high_savings_risk" [CRISIS-02]: Crisis was about savings losing value (chose C)
    - "excessive_lending_no_risk_mgmt" [SE-reversal]: Understands excessive lending but chose wrong label (chose A)

  Knowledge gap: KG-idk, KG-blank
  Selection error: SE-selfcorrect, SE-reversal
```

---

## 3. Item-Specific Prompt Blocks (Confirm)

Confirm prompts follow a simpler pattern. The taxonomy is the same across items: verified, partial, or likely_guess. The item-specific rubric defines what counts as each level.

### Template (used for all Confirm items):

```
ITEM CONTEXT:
  Anchor Question: {question_text}
  Correct Answer: {correct_answer}
  Student answered correctly with low confidence.
  Subdomain: {subdomain}

RUBRIC:
  Full credit (verified, credit=100):
    {rubric_accept}
  Partial credit (partial, credit=50):
    {rubric_partial}
  No credit (likely_guess, credit=0):
    {rubric_reject}
```

### Rubric Table (insert per item):

| Item | Rubric Accept (verified, 100) | Rubric Partial (partial, 50) | Rubric Reject (likely_guess, 0) |
|------|------|------|------|
| Q1 | Mentions interest earning interest, compounding, or accumulating each year on growing balance | "Interest adds up over time" (vague but directionally correct) | No explanation of why it exceeds $102, or incorrect reasoning |
| Q2 | Mentions less time for interest to accumulate, fewer payments, or paying down principal faster | "You pay it off faster" (correct direction but no interest mechanism) | No explanation or incorrect reasoning |
| Q3 | Mentions prices rising, things costing more, or money buying less | "Things get more expensive" (correct but lacks depth) | Incorrect definition or no explanation |
| Q5 | Mentions covering job loss, unexpected expenses, or time needed to find new income | "In case something bad happens" (vague) | No explanation or incorrect reasoning |
| Q6 | Mentions inflation is a rate of change, not price level; prices still rise, just more slowly | "Prices don't go down, they just go up less" (correct but could be clearer) | Incorrect reasoning or no explanation |
| Q7 | Mentions income doesn't rise while prices do; purchasing power decreases | "Their money is worth less" (correct but could explain mechanism) | Incorrect reasoning or no explanation |
| Q8 | Mentions lenders compete for business; borrowers can shop around | "You can ask for better terms" (doesn't explain why it works) | Incorrect reasoning or no explanation |
| Q10 | Mentions multiple credit bureaus (Equifax, Experian, TransUnion) | "There's more than one place that does credit reports" (correct but vague) | Incorrect reasoning or no explanation |
| Q11 | Mentions spreading risk across many companies / diversification | "Don't have all your eggs in one basket" (correct metaphor but could be more specific) | Incorrect reasoning or no explanation |
| Q12 | Mentions large medical bills can be financially devastating | "So you don't go broke if you get sick" (correct idea but informal) | Incorrect reasoning or no explanation |
| Q13 | Mentions paying the deductible amount first, then insurance covers the rest | "You pay some, insurance pays the rest" (correct but vague on order) | Incorrect reasoning or no explanation |
| Q14 | Mentions if one investment fails, others can offset the loss | "Don't put all eggs in one basket" (correct metaphor but could explain why) | Incorrect reasoning or no explanation |
| Q29 | Mentions existing bonds become less attractive vs. new higher-rate bonds | "New bonds are better so old ones are worth less" (correct direction) | Incorrect reasoning or no explanation |
| Q30 | Mentions must take more risk to have chance of earning more; risk-return tradeoff | "More reward means more risk" (correct but could explain why) | Incorrect reasoning or no explanation |
| Q31 | Mentions buy ownership in companies or sell when needed; provides liquidity | "So people can trade stocks" (correct but doesn't explain importance) | Incorrect reasoning or no explanation |
| Q32 | Mentions stocks are riskier so offer higher potential returns; ownership in growing companies | "Stocks go up more over time" (correct but doesn't explain why) | Incorrect reasoning or no explanation |
| Q33 | Mentions 1% of 1,000 is 10, or 0.01 x 1,000 = 10 | "1% means 1 out of 100, so 10 out of 1,000" (correct reasoning) | Incorrect calculation or no explanation |
| Q35 | Mentions risk and reward are linked | "No free lunch" or "nothing is guaranteed" (correct direction but vague) | Incorrect reasoning or no explanation |
| Q36 | Mentions if one institution fails, you don't lose everything | "Safer to spread it out" (correct but doesn't explain why) | Incorrect reasoning or no explanation |
| Q37 | Mentions liability covers damage or injury you cause to others | "Covers accidents you cause" (could specify what it pays for) | Incorrect reasoning or no explanation |
| Q38 | Mentions mortgage payment is fixed while home value and income rise with inflation | "Houses go up in value" (correct but doesn't explain fixed-mortgage benefit) | Incorrect reasoning or no explanation |
| Q39 | Mentions stocks have more price volatility or bigger swings | "Stocks go up and down more" (correct but could explain why) | Incorrect reasoning or no explanation |
| Q40 | Mentions risky mortgages to people who couldn't repay; risks hidden/spread | "Banks took too many risks" (correct direction, could be more specific) | Incorrect reasoning or no explanation |

### Real Confirm Examples for Calibration:

**Q13 (Deductible) -- Likely Guess:**
- "I got lucky on that one I don't know how a deductible works" -> likely_guess, credit=0
- "Okay honestly i don't know at all i guessed." -> likely_guess, credit=0
- "Don't know, guessed" -> likely_guess, credit=0

**Q11 (Mutual Fund) -- Partial:**
- "I don't know what a mutual fund is but I know that you shouldn't buy just one single stock, you should diversify your portfolio." -> partial, credit=50 (knows diversification principle but not the vehicle)

**Q2 (Mortgage) -- Verified:**
- "Total interest is lower on the shorter mortgage because the loan is being paid off in shorter time frame which leads interest to accrue for less years" -> verified, credit=100

**Q7 (Fixed Income) -- Verified:**
- "Retirees living on a fixed income may struggle the most because when you retire you put aside a certain amount of income to live comfortably, so with the rise of inflation, living expenses to get very expensive" -> verified, credit=100

---

## 4. Implementation Notes

### Batch Processing

Score one response at a time. Do not batch multiple responses in a single API call. This ensures consistent classification quality.

### API Configuration

- Model: anthropic/claude-sonnet-4 via OpenRouter (recommended for balance of speed and quality)
- Temperature: 0 (deterministic classification)
- Max tokens: 300 (JSON output is compact)
- System prompt: Section 1 above (shared)
- User prompt: Item-specific block + "STUDENT RESPONSE:\n{response_text}"
- Dependency: `pip install openai` (OpenRouter uses the OpenAI-compatible endpoint)

### Quality Checks

After scoring all responses, run these validation checks:

1. **Distribution check:** Compare AI classification distribution to manual review distribution from the analysis document. Major deviations (>10% difference in any category) indicate prompt calibration needed.

2. **Edge case audit:** Manually review all responses classified with classification_confidence="low" (expect ~5-10%).

3. **Selection error validation:** For all responses classified as selection_error, verify that the evidence_quote actually demonstrates correct reasoning.

4. **Cross-item consistency:** Students classified with RISK-02 on Q30 should have similar reasoning patterns if they also appear on Q35.

### Estimated Volume

| Type | Valid Responses | Estimated Scoring Time (API) |
|------|----------------|------------------------------|
| Diagnose | 556 | ~3 minutes at 3 responses/sec |
| Confirm | 336 | ~2 minutes |
| Total | 892 | ~5 minutes |

### Cost Estimate

At ~500 tokens per call (system + user + output):
- 892 calls x 500 tokens = ~446K input tokens + ~270 output tokens per call
- Via OpenRouter (anthropic/claude-sonnet-4): check current pricing at openrouter.ai/models
