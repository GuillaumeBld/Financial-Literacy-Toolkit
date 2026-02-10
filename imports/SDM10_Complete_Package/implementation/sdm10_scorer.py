"""
SDM-10 AI Scoring System
Scores open-ended responses using OpenRouter API with item-specific prompts.

Usage:
    python sdm10_scorer.py \
        --input open_questions.csv \
        --output scored_responses.csv \
        --api-key YOUR_OPENROUTER_API_KEY \
        --model anthropic/claude-sonnet-4

Requirements:
    pip install openai
"""

import json
import csv
import sys
import time
import argparse
from pathlib import Path

# --- SYSTEM PROMPT ---
SYSTEM_PROMPT = """You are a financial literacy assessment scorer. Your job is to classify student open-ended responses from an adaptive financial literacy assessment.

CONTEXT:
Students completed a 40-item financial literacy assessment. For items where they answered incorrectly with high confidence, they were asked to explain their reasoning (Diagnose). For items where they answered correctly with low confidence, they were asked to explain why their answer is correct (Confirm).

YOUR TASK:
Classify each response using the three-way diagnostic system and the item-specific taxonomy provided. Output a JSON object only. No additional text.

DECISION TREE FOR DIAGNOSE:
Step 1: Is the response blank, "IDK," "I don't know," or under 20 characters with no reasoning?
  -> YES: knowledge_gap, credit=0
Step 2: Does the response demonstrate correct reasoning for the anchor item?
  -> YES: selection_error, credit=100
Step 3: Does the student self-correct to the right answer while writing?
  -> YES: selection_error, credit=100
Step 4: Does the response reveal a specific wrong mental model from the item taxonomy?
  -> YES: misconception, credit=100
Step 5: Is the reasoning muddled but shows a direction?
  -> YES: misconception, credit=50
Step 6: Cannot classify.
  -> knowledge_gap, credit=0

CREDIT SCORING (measures diagnostic value, NOT correctness):
- 100: Clear misconception identified OR clear selection error documented.
- 50: Partial/muddled misconception, reasoning shows a direction.
- 0: IDK, blank, too short, or unclassifiable.

IMPORTANT:
- Output ONLY the JSON object. No explanations, no markdown, no code fences.
- evidence_quote must be a direct excerpt (max 30 words).
- Informal language, slang, or typos: classify the underlying reasoning.
- Detailed wrong explanations get credit=100 (high diagnostic value).
"""

# --- ITEM CONFIGS ---
# Each item has: question text, options, correct answer, subdomain, and taxonomy

DIAGNOSE_ITEMS = {
    "Q1": {
        "question": 'Suppose you had $100 in a savings account and the interest rate was 2% per year. After 5 years, how much do you think you would have in the account if you left the money to grow?',
        "options": "A) More than $102, B) Exactly $102, C) Less than $102, D) Do not know",
        "correct": "A",
        "subdomain": "Compound Interest",
        "taxonomy": """Layer 1: INT-01 (Interest as fee) | INT-02 (No compounding)
Tags: interest_as_fee [INT-01], simple_interest_only [INT-02], confused_direction [INT-KG]
KG: KG-idk, KG-blank  |  SE: SE-selfcorrect, SE-misread"""
    },
    "Q2": {
        "question": 'A 15-year mortgage typically requires higher monthly payments than a 30-year mortgage, but the total interest paid over the life of the loan will be less. True or false?',
        "options": "A) True, B) False, C) Do not know",
        "correct": "A (True)",
        "subdomain": "Borrowing/Mortgages",
        "taxonomy": """Layer 1: INT-03 (Term irrelevant) | INT-04 (Shorter = higher cost)
Tags:
  time_irrelevant [INT-03]: Total payment same regardless of term
  shorter_means_higher_rate [INT-04]: Shorter term = higher rate = more cost
  confused_but_close [INT-03]: Muddled but partially on track
KG: KG-idk, KG-blank
SE: SE-selfcorrect, SE-reversal (explains longer loans = more interest, but chose False)"""
    },
    "Q3": {
        "question": 'High inflation means that the cost of living is increasing rapidly. True or false?',
        "options": "A) True, B) False, C) Do not know",
        "correct": "A (True)",
        "subdomain": "Inflation",
        "taxonomy": """Layer 1: INF-02 (Definition confusion)
Tags: inflation_not_prices [INF-02], inflation_is_gradual_not_rapid [INF-02]
KG: KG-idk, KG-blank  |  SE: SE-selfcorrect, SE-reversal"""
    },
    "Q5": {
        "question": 'Lyle has a good job and earns enough to pay his bills comfortably each month. In terms of his emergency savings, how much should he have set aside?',
        "options": "A) $200 or so, B) Money equal to one month's rent/mortgage, C) Three or more months of living expenses, D) Do not know",
        "correct": "C",
        "subdomain": "Emergency Fund",
        "taxonomy": """Layer 1: BORROW-04 (Income-based) | BORROW-05 (Amount too low)
Tags:
  income_based_not_expense_based [BORROW-04]: Fund scales with income
  one_month_sufficient [BORROW-05]: One month is adequate
  fixed_dollar_amount [BORROW-05]: $200 is sufficient
  more_is_always_better [BORROW-04]: Saving more is always better
KG: KG-idk, KG-blank  |  SE: SE-selfcorrect"""
    },
    "Q6": {
        "question": 'A successful effort to lower inflation would likely be accompanied by which of the following?',
        "options": "A) A decrease in the general level of prices, B) A slower increase in prices, C) An increase in employment, D) Do not know",
        "correct": "B",
        "subdomain": "Inflation (Lowering)",
        "taxonomy": """Layer 1: INF-01 (Lower inflation = falling prices)
Tags:
  lower_inflation_means_lower_prices [INF-01]: Prices decrease when inflation decreases
  deflation_confusion [INF-01]: Describes deflation
  employment_link [INF-01]: Connects to employment changes
  purchasing_power_reversal [INF-01]: Partially correct logic, reversed conclusion
KG: KG-idk, KG-blank  |  SE: SE-selfcorrect"""
    },
    "Q7": {
        "question": 'Inflation can cause difficulty in many ways. Which group would have the greatest problem during periods of high inflation?',
        "options": "A) Young couples with no children who both work, B) Older working couples saving for retirement, C) Retirees living on a fixed income, D) Do not know",
        "correct": "C",
        "subdomain": "Inflation (Fixed Income)",
        "taxonomy": """Layer 1: INF-03 (Fixed income misunderstood) | INF-05 (Empathy-driven)
Tags:
  young_couples_worst [INF-05]: Young couples suffer most (empathy driven)
  older_workers_worst [INF-03]: Older workers suffer most (retirement impact)
  young_because_employment [INF-05]: Links inflation to unemployment for young
  young_because_building [INF-05]: Young people building a life = more expenses
  fixed_income_misunderstood [INF-03]: Does not understand "fixed income"
KG: KG-idk, KG-blank  |  SE: SE-selfcorrect, SE-misread"""
    },
    "Q8": {
        "question": 'Jayden is shopping for an auto loan. Which of the following can he likely negotiate with the lender?',
        "options": "A) Interest rate, B) Down payment, C) Both, D) Neither, E) Do not know",
        "correct": "C (Both)",
        "subdomain": "Auto Loans",
        "taxonomy": """Layer 1: INT-05 (Rates not negotiable)
Tags:
  interest_rate_fixed_by_fed [INT-05]: Fed sets consumer rates
  down_payment_only [INT-05]: Only down payment negotiable
  interest_rate_only [INT-05]: Only rate negotiable
  nothing_negotiable [INT-05]: Neither negotiable
KG: KG-idk, KG-blank  |  SE: SE-selfcorrect, SE-reversal"""
    },
    "Q10": {
        "question": 'Which of the following statements regarding credit reports is FALSE?',
        "options": "A) Employers use them to screen applicants, B) Includes credit worthiness assessment, C) Provided by a single source, D) Do not know",
        "correct": "C",
        "subdomain": "Credit Reports",
        "taxonomy": """Layer 1: BORROW-01 (Report/score confusion) | BORROW-03 (Employer use unknown)
Tags:
  employer_use_confusion [BORROW-03]: Employers cannot check credit
  credit_score_confusion [BORROW-01]: Conflates report and score
  single_source_belief [BORROW-02]: Credit from one source
KG: KG-idk, KG-blank
SE: SE-selfcorrect, SE-misread, SE-reversal
NOTE: High selection error (29%). "FALSE" framing is confusing."""
    },
    "Q11": {
        "question": "Buying a single company's stock usually provides a safer return than a stock mutual fund. True or false?",
        "options": "A) True, B) False, C) Do not know",
        "correct": "B (False)",
        "subdomain": "Diversification (Stock vs Fund)",
        "taxonomy": """Layer 1: RISK-05 (Single stock safer) | RISK-06 (Mutual fund unfamiliar)
Tags: single_stock_safer_belief [RISK-05], unfamiliar_with_mutual_fund [RISK-06]
KG: KG-idk, KG-unfamiliar (dominant)  |  SE: SE-selfcorrect, SE-reversal"""
    },
    "Q12": {
        "question": 'Which of the following best describes the PRIMARY function of health insurance?',
        "options": "A) Protect against large unexpected medical bills, B) Cover routine health care, C) Pay for elective procedures, D) Do not know",
        "correct": "A",
        "subdomain": "Health Insurance Purpose",
        "taxonomy": """Layer 1: INS-01 (Routine care primary) | INS-02 (Frequency = purpose)
Tags:
  routine_care_primary [INS-01]: Insurance mainly for routine care
  frequency_over_severity [INS-02]: Used more often = primary function
  insurance_doesnt_cover_large_bills [INS-01]: Insurance does not cover major expenses
KG: KG-idk, KG-blank  |  SE: SE-selfcorrect"""
    },
    "Q13": {
        "question": 'What does a home insurance deductible represent?',
        "options": "A) Amount you pay before insurance covers damages, B) Monthly premium, C) Maximum insurance will pay, D) Do not know",
        "correct": "A",
        "subdomain": "Insurance Deductible",
        "taxonomy": """Layer 1: INS-03 (Deductible definition wrong)
Tags:
  deductible_is_premium [INS-03]: Confuses deductible with premium (chose B)
  deductible_is_max_payout [INS-03]: Deductible is max insurer pays (chose C)
  partial_understanding [INS-03]: Close but imprecise
KG: KG-idk, KG-unfamiliar (dominant, many chose D)  |  SE: SE-selfcorrect"""
    },
    "Q14": {
        "question": 'When an investor spreads money among different assets, the risk of losing money usually:',
        "options": "A) Increases, B) Decreases, C) Stays the same, D) Do not know",
        "correct": "B",
        "subdomain": "Diversification Principle",
        "taxonomy": """Layer 1: RISK-03 (Diversification increases risk)
Tags: more_assets_more_risk [RISK-03], more_exposure_more_risk [RISK-03]
KG: KG-idk, KG-blank  |  SE: SE-misread, SE-selfcorrect"""
    },
    "Q29": {
        "question": 'If interest rates rise, what will typically happen to bond prices?',
        "options": "A) Rise, B) Fall, C) Stay same, D) No relationship, E) Do not know",
        "correct": "B",
        "subdomain": "Interest Rates and Bonds",
        "taxonomy": """Layer 1: INT-06 (Bond price/rate reversed)
Tags:
  positive_correlation_belief [INT-06]: Bond prices rise with rates
  inflation_drives_all_up [INT-06]: Inflation pushes all prices up
  no_relationship_belief [INT-06]: No relationship
KG: KG-idk, KG-blank, KG-unfamiliar (dominant, many chose E)
SE: SE-selfcorrect
NOTE: UI issues reported. Students saying "I am not seeing my answer" -> tag KG-idk with flag ui_issue."""
    },
    "Q30": {
        "question": 'An investment with a high return is likely to be high risk. True or false?',
        "options": "A) True, B) False, C) Do not know",
        "correct": "A (True)",
        "subdomain": "Risk-Return Tradeoff",
        "taxonomy": """Layer 1: RISK-02 (Exceptions disprove rule)
Tags:
  exceptions_disprove_rule [RISK-02]: Because exceptions exist, rule is false
  time_horizon_negates_risk [RISK-02]: Long time = no risk
  prediction_negates_risk [RISK-02]: Predictability eliminates risk
KG: KG-idk, KG-blank  |  SE: SE-selfcorrect
NOTE: Dominant pattern is RISK-02. Students argue exceptions invalidate general principles."""
    },
    "Q31": {
        "question": 'Which of the following best describes what the stock market does?',
        "options": "A) Results in gains for investors, B) Guarantees profit, C) Brings buyers and sellers together, D) Do not know",
        "correct": "C",
        "subdomain": "Stock Market Function",
        "taxonomy": """Layer 1: RISK-07 (Guarantees returns)
Tags: guarantees_profit [RISK-07], capital_raising_primary [RISK-07]
KG: KG-idk, KG-blank, KG-vague  |  SE: SE-reversal, SE-selfcorrect"""
    },
    "Q32": {
        "question": 'Considering a long time period (10-20 years), which asset normally gives the highest return?',
        "options": "A) Savings accounts, B) Bonds, C) Stocks, D) Do not know",
        "correct": "C",
        "subdomain": "Long-Term Asset Returns",
        "taxonomy": """Layer 1: RISK-01 (Safety = highest returns)
Tags:
  bonds_safest_therefore_best [RISK-01]: Safety = highest returns (chose B)
  stocks_too_risky_for_returns [RISK-01]: Risk means returns cannot be highest
  savings_safest_therefore_best [RISK-01]: No-risk = most returns (chose A)
KG: KG-idk, KG-blank  |  SE: SE-selfcorrect"""
    },
    "Q35": {
        "question": 'If someone offers you the chance to make a lot of money, it is likely that there is also a chance that you will lose a lot of money. True or false?',
        "options": "A) True, B) False, C) Do not know",
        "correct": "A (True)",
        "subdomain": "Risk-Return Relationship",
        "taxonomy": """Layer 1: RISK-02 (Exceptions disprove rule) | RISK-10 (Real-world counterexamples)
Tags:
  real_world_counterexample [RISK-10]: Non-financial scenarios to disprove principle
  exceptions_disprove_rule [RISK-02]: Same as Q30
  trust_based_reasoning [RISK-02]: Risk as trust decision
KG: KG-idk, KG-blank  |  SE: SE-selfcorrect"""
    },
    "Q36": {
        "question": 'True or false: It is less likely that you will lose all of your money if you save it in more than one place.',
        "options": "A) True, B) False, C) Do not know",
        "correct": "A (True)",
        "subdomain": "Diversification Principle",
        "taxonomy": """Layer 1: RISK-03 (Diversification increases risk) | RISK-04 (Understood but misapplied)
Tags:
  correct_reasoning_wrong_answer [SE-reversal]: Explains diversification correctly but chose False
  all_places_can_fail [RISK-03]: Multiple places can all fail simultaneously
  misread_question [SE-misread]: Explicitly says misread
KG: KG-idk, KG-blank
NOTE: 62% selection error rate. True/False + negative phrasing causes confusion. Most who chose False understand diversification."""
    },
    "Q37": {
        "question": 'Which insurance protects you if you cause an accident that injures someone?',
        "options": "A) Health insurance, B) Homeowner's insurance, C) Auto liability coverage, D) Do not know",
        "correct": "C",
        "subdomain": "Insurance Types",
        "taxonomy": """Layer 1: INS-04 (Liability scope wrong)
Tags:
  health_insurance_for_injuries [INS-04]: Health insurance covers all injuries
  auto_liability_for_self [INS-04]: Liability covers own injuries
  homeowner_covers_accidents [INS-04]: Homeowner's covers accident injuries
KG: KG-idk, KG-blank  |  SE: SE-misread, SE-selfcorrect"""
    },
    "Q38": {
        "question": 'Which investment best protects purchasing power during sudden high inflation?',
        "options": "A) 10-year fixed bond, B) Bank CD, C) 25-year fixed mortgage, D) House with fixed mortgage, E) Do not know",
        "correct": "D",
        "subdomain": "Inflation Protection",
        "taxonomy": """Layer 1: INF-04 (Inflation protection confusion)
Tags:
  fixed_bond_best [INF-04]: Fixed bond protects (chose A)
  cd_benefits_from_inflation [INF-04]: CD adjusts upward (chose B)
  debt_is_bad [INF-04]: Avoided mortgage because debt is negative
  understands_but_wrong_choice [SE-reversal]: Explains fixed-rate logic, chose wrong option
KG: KG-idk, KG-blank, KG-unfamiliar
SE: SE-selfcorrect, SE-reversal
NOTE: C vs D confusion. C=mortgage(debt), D=house(asset). Students choosing C may understand concept."""
    },
    "Q39": {
        "question": 'True or false: Stocks are generally riskier than bonds.',
        "options": "A) True, B) False, C) Do not know",
        "correct": "A (True)",
        "subdomain": "Stocks vs Bonds Risk",
        "taxonomy": """Layer 1: RISK-08 (Stocks/bonds risk confusion)
Tags: bonds_contain_stocks [RISK-08], some_bonds_risky_too [RISK-08]
KG: KG-idk, KG-unfamiliar (dominant)  |  SE: SE-selfcorrect, SE-reversal"""
    },
    "Q40": {
        "question": 'What was a key factor contributing to the 2007-2008 financial crisis?',
        "options": "A) Strong regulation, B) Failure to manage risk, C) High savings rates, D) Low borrowing",
        "correct": "B",
        "subdomain": "Crisis/Systemic Risk",
        "taxonomy": """Layer 1: CRISIS-01 (Cause reversed) | CRISIS-02 (Savings risk)
Tags:
  low_borrowing_caused_crash [CRISIS-01]: Low borrowing caused crisis (chose D)
  high_savings_risk [CRISIS-02]: Crisis about savings losing value (chose C)
  excessive_lending_no_risk_mgmt [SE-reversal]: Understands lending but chose A
KG: KG-idk, KG-blank  |  SE: SE-selfcorrect, SE-reversal"""
    },
}

# Items Q4, Q9, Q33, Q34 have very small samples (<6) but are included for completeness
DIAGNOSE_ITEMS["Q4"] = {
    "question": 'You lend $25 to a friend and he gives you $25 back the next day. How much interest has he paid?',
    "options": "A) $25, B) $0, C) Do not know",
    "correct": "B",
    "subdomain": "Borrowing/Interest",
    "taxonomy": """Layer 1: INT-07 (Zero interest confusion)
Tags: principal_interest_confusion [INT-07]: Believes $25 is the interest
KG: KG-idk  |  SE: SE-selfcorrect"""
}
DIAGNOSE_ITEMS["Q9"] = {
    "question": 'What is the PRIMARY advantage of making a household budget?',
    "options": "A) Ensures funds for bills and saving, B) Reduces taxes, C) Increases investment returns, D) Do not know",
    "correct": "A",
    "subdomain": "Budgeting",
    "taxonomy": """Layer 1: BORROW-06 (Budgeting purpose)
Tags: bills_only [BORROW-06], tax_confusion [BORROW-06], investment_confusion [BORROW-06]
KG: KG-idk  |  SE: SE-selfcorrect"""
}
DIAGNOSE_ITEMS["Q33"] = {
    "question": 'If 1,000 people each buy a lottery ticket with 1% chance of winning, how many winners expected?',
    "options": "A) 5, B) 8, C) 10, D) 12, E) Do not know",
    "correct": "C (10)",
    "subdomain": "Probability",
    "taxonomy": """Layer 1: NUM-01 (Percentage calculation error)
Tags: calculation_error [NUM-01]
KG: KG-idk  |  SE: SE-selfcorrect"""
}
DIAGNOSE_ITEMS["Q34"] = {
    "question": 'When an investor spreads money among different assets, does risk increase, decrease, or stay the same?',
    "options": "A) Increase, B) Decrease, C) Stay same, D) Do not know",
    "correct": "B",
    "subdomain": "Diversification Effect",
    "taxonomy": """Layer 1: RISK-03 (Diversification increases risk)
Tags: more_complexity_more_risk [RISK-03]
KG: KG-idk  |  SE: SE-selfcorrect, SE-reversal"""
}

# --- CONFIRM RUBRICS ---
CONFIRM_RUBRICS = {
    "Q1":  {"accept": "Mentions compounding or interest on interest", "partial": "Interest adds up over time (vague)", "reject": "No explanation or incorrect"},
    "Q2":  {"accept": "Less time for interest to accumulate, paying principal faster", "partial": "You pay it off faster (no mechanism)", "reject": "No explanation or incorrect"},
    "Q3":  {"accept": "Prices rising, things costing more, money buying less", "partial": "Things get more expensive (lacks depth)", "reject": "Incorrect definition or no explanation"},
    "Q5":  {"accept": "Covers job loss, unexpected expenses, time to find income", "partial": "In case something bad happens (vague)", "reject": "No explanation or incorrect"},
    "Q6":  {"accept": "Inflation is rate of change; prices still rise, just slower", "partial": "Prices don't go down, go up less (correct but vague)", "reject": "Incorrect or no explanation"},
    "Q7":  {"accept": "Income doesn't rise while prices do; purchasing power decreases", "partial": "Their money is worth less (no mechanism)", "reject": "Incorrect or no explanation"},
    "Q8":  {"accept": "Lenders compete; borrowers can shop around", "partial": "You can ask for better terms (no why)", "reject": "Incorrect or no explanation"},
    "Q10": {"accept": "Multiple credit bureaus (Equifax, Experian, TransUnion)", "partial": "More than one place does credit reports (vague)", "reject": "Incorrect or no explanation"},
    "Q11": {"accept": "Spreading risk across many companies / diversification", "partial": "Don't put all eggs in one basket (metaphor only)", "reject": "Incorrect or no explanation"},
    "Q12": {"accept": "Large medical bills can be financially devastating", "partial": "So you don't go broke if sick (informal)", "reject": "Incorrect or no explanation"},
    "Q13": {"accept": "Pay deductible first, then insurance covers the rest", "partial": "You pay some, insurance pays rest (vague on order)", "reject": "Incorrect or no explanation"},
    "Q14": {"accept": "If one fails, others offset the loss", "partial": "Don't put all eggs in one basket (no why)", "reject": "Incorrect or no explanation"},
    "Q29": {"accept": "Existing bonds less attractive vs new higher-rate bonds", "partial": "New bonds better so old worth less (correct direction)", "reject": "Incorrect or no explanation"},
    "Q30": {"accept": "Must take more risk for chance of earning more", "partial": "More reward means more risk (no why)", "reject": "Incorrect or no explanation"},
    "Q31": {"accept": "Buy ownership or sell when needed; provides liquidity", "partial": "So people can trade stocks (no importance)", "reject": "Incorrect or no explanation"},
    "Q32": {"accept": "Stocks riskier so offer higher potential returns", "partial": "Stocks go up more over time (no why)", "reject": "Incorrect or no explanation"},
    "Q33": {"accept": "1% of 1,000 = 10, or 0.01 x 1,000", "partial": "1 out of 100 so 10 out of 1,000", "reject": "Incorrect calculation or no explanation"},
    "Q35": {"accept": "Risk and reward are linked", "partial": "No free lunch / nothing guaranteed (vague)", "reject": "Incorrect or no explanation"},
    "Q36": {"accept": "If one institution fails, don't lose everything", "partial": "Safer to spread out (no why)", "reject": "Incorrect or no explanation"},
    "Q37": {"accept": "Liability covers damage/injury you cause to others", "partial": "Covers accidents you cause (could specify)", "reject": "Incorrect or no explanation"},
    "Q38": {"accept": "Mortgage fixed while home value and income rise", "partial": "Houses go up in value (no fixed-mortgage benefit)", "reject": "Incorrect or no explanation"},
    "Q39": {"accept": "Stocks have more price volatility / bigger swings", "partial": "Stocks go up and down more (no why)", "reject": "Incorrect or no explanation"},
    "Q40": {"accept": "Risky mortgages to people who couldn't repay; risks hidden", "partial": "Banks took too many risks (could be specific)", "reject": "Incorrect or no explanation"},
}


def build_diagnose_prompt(item_config, student_answer, response_text):
    """Build the user prompt for a diagnose response."""
    return f"""ITEM CONTEXT:
  Anchor Question: {item_config['question']}
  Options: {item_config['options']}
  Correct Answer: {item_config['correct']}
  Student's Answer: {student_answer}
  Subdomain: {item_config['subdomain']}

MISCONCEPTION TAXONOMY:
{item_config['taxonomy']}

STUDENT RESPONSE:
"{response_text}"

Classify this response. Output JSON only:
{{"diagnosis_type": "misconception|knowledge_gap|selection_error", "layer1_code": "string", "layer2_tag": "string|null", "credit": 0|50|100, "classification_confidence": "high|medium|low", "evidence_quote": "key phrase", "reasoning_summary": "one sentence"}}"""


def build_confirm_prompt(item_id, question_text, correct_answer, subdomain, response_text):
    """Build the user prompt for a confirm response."""
    rubric = CONFIRM_RUBRICS.get(item_id, {})
    return f"""ITEM CONTEXT:
  Anchor Question: {question_text}
  Correct Answer: {correct_answer}
  Student answered correctly with low confidence.
  Subdomain: {subdomain}

RUBRIC:
  Full credit (verified, credit=100): {rubric.get('accept', 'Explains mechanism correctly')}
  Partial credit (partial, credit=50): {rubric.get('partial', 'Correct direction, vague')}
  No credit (likely_guess, credit=0): {rubric.get('reject', 'No explanation or incorrect')}

STUDENT RESPONSE:
"{response_text}"

Classify this response. Output JSON only:
{{"understanding_level": "verified|partial|likely_guess", "credit": 0|50|100, "reasoning_quality": "mechanism_explained|rule_stated|vague|none", "classification_confidence": "high|medium|low", "evidence_quote": "key phrase", "reasoning_summary": "one sentence"}}"""


def parse_ai_response(text):
    """Parse JSON from AI response, handling common formatting issues."""
    text = text.strip()
    # Remove markdown code fences if present
    if text.startswith("```"):
        text = text.split("\n", 1)[1] if "\n" in text else text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
    if text.startswith("json"):
        text = text[4:].strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return {"error": "Failed to parse JSON", "raw": text[:200]}


def score_responses(input_path, output_path, api_key, model="anthropic/claude-sonnet-4"):
    """Score all open-ended responses from the CSV via OpenRouter."""
    try:
        from openai import OpenAI
    except ImportError:
        print("ERROR: pip install openai")
        sys.exit(1)

    client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=api_key,
    )

    # Read input
    with open(input_path, 'r') as f:
        rows = list(csv.DictReader(f))

    # Clean quotes
    for r in rows:
        for k in r:
            if r[k] and r[k].startswith("'") and r[k].endswith("'"):
                r[k] = r[k][1:-1]

    # Filter valid diagnose and confirm
    diagnose_rows = [r for r in rows if r['type'] == 'diagnose' and r['anchor_score'] == '0.00']
    confirm_rows = [r for r in rows if r['type'] == 'confirm' and r['anchor_score'] == '100.00']

    results = []
    total = len(diagnose_rows) + len(confirm_rows)
    processed = 0

    print(f"Scoring {len(diagnose_rows)} diagnose + {len(confirm_rows)} confirm = {total} responses")
    print(f"Model: {model}")
    print(f"Endpoint: OpenRouter")

    # Score diagnose responses
    for row in diagnose_rows:
        item_id = row['item_id'].replace('_Open_Diagnose', '')
        response_text = row.get('answer', '').strip()
        student_answer = row.get('anchor_answer', '')

        config = DIAGNOSE_ITEMS.get(item_id)
        if not config:
            results.append({**row, 'ai_score': json.dumps({"error": f"No config for {item_id}"})})
            processed += 1
            continue

        user_prompt = build_diagnose_prompt(config, student_answer, response_text)

        try:
            response = client.chat.completions.create(
                model=model,
                max_tokens=300,
                temperature=0,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt}
                ],
            )
            ai_text = response.choices[0].message.content
            parsed = parse_ai_response(ai_text)
            results.append({**row, 'ai_score': json.dumps(parsed)})
        except Exception as e:
            results.append({**row, 'ai_score': json.dumps({"error": str(e)})})
            time.sleep(2)

        processed += 1
        if processed % 50 == 0:
            print(f"  {processed}/{total} scored...")
        time.sleep(0.3)  # Rate limiting

    # Score confirm responses
    for row in confirm_rows:
        item_id = row['item_id'].replace('_Open_Confirm', '')
        response_text = row.get('answer', '').strip()
        subdomain = row.get('subdomain', '')

        config = DIAGNOSE_ITEMS.get(item_id)
        if not config:
            results.append({**row, 'ai_score': json.dumps({"error": f"No config for {item_id}"})})
            processed += 1
            continue

        user_prompt = build_confirm_prompt(
            item_id, config['question'], config['correct'], subdomain, response_text
        )

        try:
            response = client.chat.completions.create(
                model=model,
                max_tokens=300,
                temperature=0,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt}
                ],
            )
            ai_text = response.choices[0].message.content
            parsed = parse_ai_response(ai_text)
            results.append({**row, 'ai_score': json.dumps(parsed)})
        except Exception as e:
            results.append({**row, 'ai_score': json.dumps({"error": str(e)})})
            time.sleep(2)

        processed += 1
        if processed % 50 == 0:
            print(f"  {processed}/{total} scored...")
        time.sleep(0.3)

    # Write output
    if results:
        fieldnames = list(results[0].keys())
        with open(output_path, 'w', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(results)

    print(f"\nDone. {len(results)} responses scored -> {output_path}")

    # Summary
    scored = [r for r in results if 'error' not in r.get('ai_score', '')]
    errors = [r for r in results if 'error' in r.get('ai_score', '')]
    print(f"  Successful: {len(scored)}")
    print(f"  Errors: {len(errors)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="SDM-10 AI Scoring System")
    parser.add_argument("--input", required=True, help="Input CSV (open_questions)")
    parser.add_argument("--output", default="scored_responses.csv", help="Output CSV")
    parser.add_argument("--api-key", required=True, help="Anthropic API key")
    parser.add_argument("--model", default="anthropic/claude-sonnet-4", help="OpenRouter model ID")
    args = parser.parse_args()

    score_responses(args.input, args.output, args.api_key, args.model)
