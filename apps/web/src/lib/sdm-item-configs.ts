// SDM-10 Item Configurations for AI Scoring
// Source: _project/source_of_truth/SDM10_AI_Scoring_Implementation_Prompt.md Section 4.3
// All 22 anchor items (Q1-Q14, Q29-Q40) with taxonomy and rubric text

export interface ConfirmRubric {
  accept: string;
  partial: string;
  reject: string;
}

export interface ItemConfig {
  question: string;
  options: string;
  correct_answer: string;
  subdomain: string;
  taxonomy: string;
  rubric: ConfirmRubric;
}

export const ITEM_CONFIGS: Record<string, ItemConfig> = {
  Q1: {
    question: "Suppose you had $100 in a savings account and the interest rate was 2% per year. After 5 years, how much do you think you would have in the account if you left the money to grow?",
    options: "A) More than $102, B) Exactly $102, C) Less than $102, D) Do not know",
    correct_answer: "A) More than $102",
    subdomain: "Compound Interest",
    taxonomy: `Layer 1 Codes: INT-01 (Interest as fee to saver) | INT-02 (No compounding awareness) | INT-KG (Knowledge gap)
Layer 2 Tags:
  - "interest_as_fee" [INT-01]: Student believes interest is a charge to the saver, not earnings
  - "simple_interest_only" [INT-02]: Student calculates 2% x $100 = $2 once, gets exactly $102, ignores compounding over 5 years
  - "confused_direction" [INT-KG]: Student unsure whether interest adds to or subtracts from balance
Knowledge Gap: KG-idk, KG-blank, KG-unfamiliar
Selection Error: SE-selfcorrect (student realizes correct answer while writing), SE-misread`,
    rubric: {
      accept: "Mentions interest earning interest, compounding, or interest accumulating each year on a growing balance",
      partial: '"Interest adds up over time" (vague but directionally correct, no compounding mechanism)',
      reject: "No explanation of why amount exceeds $102, or incorrect reasoning, or admits guessing",
    },
  },

  Q2: {
    question: "A 15-year mortgage typically requires higher monthly payments than a 30-year mortgage, but the total interest paid over the life of the loan will be less. True or false?",
    options: "A) True, B) False, C) Do not know",
    correct_answer: "A) True",
    subdomain: "Borrowing/Mortgages",
    taxonomy: `Layer 1 Codes: INT-03 (Loan term does not affect total interest) | INT-04 (Shorter term = higher total cost)
Layer 2 Tags:
  - "time_irrelevant" [INT-03]: Student believes total payment is identical regardless of loan length.
    Example: "There is no difference between the total amount you pay at the end of the mortgage if you choose 15 or 30 year"
  - "shorter_means_higher_rate" [INT-04]: Student believes a shorter term comes with a higher interest rate, so total cost is more.
    Example: "less mortgage time means you are paying higher interest rate so you can pay off earlier"
  - "monthly_vs_total_confusion" [INT-03]: Confuses higher monthly payment with higher total cost.
    Example: "Because you're still paying a lot of money for the mortgage, just in a shorter period of time"
  - "confused_but_close" [INT-03]: Muddled reasoning, partially on track but conclusion wrong.
Knowledge Gap: KG-idk, KG-blank
Selection Error: SE-selfcorrect, SE-reversal (student explains longer loans accumulate more interest, which is correct reasoning, but chose False)`,
    rubric: {
      accept: "Mentions less time for interest to accumulate, fewer payments, or paying down principal faster reduces total interest",
      partial: '"You pay it off faster" (correct direction but does not explain the interest mechanism)',
      reject: "No explanation or incorrect reasoning",
    },
  },

  Q3: {
    question: "High inflation means that the cost of living is increasing rapidly. True or false?",
    options: "A) True, B) False, C) Do not know",
    correct_answer: "A) True",
    subdomain: "Inflation",
    taxonomy: `Layer 1 Codes: INF-02 (Inflation definition confusion)
Layer 2 Tags:
  - "inflation_not_prices" [INF-02]: Believes inflation is about money value declining, not about prices rising
  - "inflation_is_gradual_not_rapid" [INF-02]: Disputes the word "rapidly" in the question, believes inflation is always gradual
Knowledge Gap: KG-idk, KG-blank, KG-unfamiliar
Selection Error: SE-selfcorrect, SE-reversal`,
    rubric: {
      accept: "Mentions prices rising, things costing more, or money buying less over time",
      partial: '"Things get more expensive" (correct but lacks depth or mechanism)',
      reject: "Incorrect definition or no explanation",
    },
  },

  Q4: {
    question: "You lend $25 to a friend one evening and he gives you $25 back the next day. How much interest has he paid on this loan?",
    options: "A) $25, B) $0, C) Do not know",
    correct_answer: "B) $0",
    subdomain: "Borrowing/Interest",
    taxonomy: `Layer 1 Codes: INT-07 (Principal-interest confusion)
Layer 2 Tags:
  - "principal_is_interest" [INT-07]: Student believes the $25 returned IS the interest (chose A)
  - "interest_definition_error" [INT-07]: Does not know what interest means in a lending context
Knowledge Gap: KG-idk, KG-blank
Selection Error: SE-selfcorrect, SE-misread`,
    rubric: {
      accept: "Mentions he paid back exactly what he borrowed, nothing extra; or interest is the amount above principal",
      partial: '"He just paid back the same amount" (correct but does not define interest)',
      reject: "Incorrect reasoning or no explanation",
    },
  },

  Q5: {
    question: "Lyle has a good job and earns enough to pay his bills comfortably each month. In terms of his emergency savings, how much should he have set aside?",
    options: "A) $200 or so, B) Money equal to his share of one month's rent/mortgage, C) The equivalent of three or more months of living expenses, D) Do not know",
    correct_answer: "C) Three or more months of living expenses",
    subdomain: "Emergency Fund",
    taxonomy: `Layer 1 Codes: BORROW-04 (Income-based not expense-based) | BORROW-05 (Amount underestimated)
Layer 2 Tags:
  - "income_based_not_expense_based" [BORROW-04]: Believes emergency fund should scale with income, not expenses.
    Example: "if lyle makes a lot of money, he should save more because he has more to save. The amount you save should be based on your income"
  - "one_month_sufficient" [BORROW-05]: Believes one month of rent is adequate.
    Example: "I answered B because i feel like that'll be enough to cover for the emergency"
  - "fixed_dollar_amount" [BORROW-05]: A small fixed dollar amount like $200 is sufficient
  - "more_is_always_better" [BORROW-04]: Vague claim that saving more is always better, no specific benchmark
Knowledge Gap: KG-idk, KG-blank
Selection Error: SE-selfcorrect
  Example: "I accidentally chose option B instead of option C. However, option C is more financially responsible because it would protect Lyle"`,
    rubric: {
      accept: "Mentions covering job loss, unexpected expenses, or time needed to find new income source",
      partial: '"In case something bad happens" (correct direction but vague)',
      reject: "No explanation or incorrect reasoning",
    },
  },

  Q6: {
    question: "A successful effort to lower inflation would likely be accompanied by which of the following?",
    options: "A) A decrease in the general level of prices, B) A slower increase in prices, C) An increase in employment, D) Do not know",
    correct_answer: "B) A slower increase in prices",
    subdomain: "Inflation (Lowering)",
    taxonomy: `Layer 1 Codes: INF-01 (Lower inflation = falling prices)
Layer 2 Tags:
  - "lower_inflation_means_lower_prices" [INF-01]: Core misconception. Student states prices decrease when inflation decreases. Confuses the rate of change with the level.
    Example 1: "If overall inflation decreases, prices will decrease as a result because they are directly correlated."
    Example 2: "Inflation is the value of money decreasing over time. If the level of inflation decreased so should the prices of things because your money would have more purchasing power."
    Example 3: "I said A because inflation means higher prices, so in order to combat that, prices need to decrease."
  - "deflation_confusion" [INF-01]: Student describes deflation (prices falling) or uses the word deflation.
    Example: "a decrease in general level of prices would help allow all citizens to afford basic necessities."
  - "employment_link" [INF-01]: Student connects inflation reduction to employment changes rather than prices.
    Example: "I said C because I thought putting more people into the economy creating more jobs would help control prices"
  - "purchasing_power_reversal" [INF-01]: Gets purchasing power logic partially right but reverses the final conclusion.
Knowledge Gap: KG-idk, KG-blank
  Example: "i dont know"
Selection Error: SE-selfcorrect
  Example: "i think it is actually B as there is a target inflation of 2% per year"`,
    rubric: {
      accept: "Mentions inflation is a rate of change not a price level; prices still rise, just more slowly",
      partial: '"Prices don\'t go down, they just go up less" (correct but could be clearer on rate vs level)',
      reject: "Incorrect reasoning or no explanation",
    },
  },

  Q7: {
    question: "Inflation can cause difficulty in many ways. Which group would have the greatest problem during periods of high inflation?",
    options: "A) Young couples with no children who both work, B) Older, working couples saving for retirement, C) Retirees living on a fixed income, D) Do not know",
    correct_answer: "C) Retirees living on a fixed income",
    subdomain: "Inflation (Fixed Income)",
    taxonomy: `Layer 1 Codes: INF-03 (Fixed income impact misunderstood) | INF-05 (Empathy-driven reasoning)
Layer 2 Tags:
  - "young_couples_worst" [INF-05]: Believes young couples suffer most. Often empathy or identification driven.
    Example 1: "I said the couples because they dont have much built up and the jobs could disappear at any moment"
    Example 2: "Young working couples because employment is going down so its harder for them to keep a job."
  - "older_workers_worst" [INF-03]: Believes older working couples suffer most due to retirement impact.
    Example 1: "Older working couples getting hit with rampant inflation will effect them the most"
    Example 2: "the older couple now is forced to put less into their retirement funds in order to keep up with the cost of living today"
  - "young_because_employment" [INF-05]: Links inflation directly to unemployment affecting young workers.
  - "young_because_building" [INF-05]: Young people are building a life, so more expenses hit harder.
    Example: "The young working couples do not have any benefits and need to pay for things like rent."
  - "fixed_income_misunderstood" [INF-03]: Does not understand what "fixed income" means.
Knowledge Gap: KG-idk, KG-blank
Selection Error: SE-selfcorrect, SE-misread`,
    rubric: {
      accept: "Mentions their income does not rise while prices do; purchasing power decreases on fixed income",
      partial: '"Their money is worth less" (correct but does not explain the fixed-income mechanism)',
      reject: "Incorrect reasoning or no explanation",
    },
  },

  Q8: {
    question: "Jayden is shopping for an auto loan. Which of the following can he likely negotiate with the lender?",
    options: "A) The interest rate, B) The required down payment, C) Both, D) Neither, E) Do not know",
    correct_answer: "C) Both",
    subdomain: "Auto Loans",
    taxonomy: `Layer 1 Codes: INT-05 (Interest rates not negotiable)
Layer 2 Tags:
  - "interest_rate_fixed_by_fed" [INT-05]: Believes interest rates are set by the Federal Reserve and cannot be negotiated.
    Example: "Interest rates cannot be negotiated because the Federal Reserve sets them at their discretion."
  - "down_payment_only" [INT-05]: Only the down payment is negotiable, not the rate.
    Example: "I believe it is just the down payment because you are able to negotiate your down payments. Interest rates on the other hand are pretty much fixed."
  - "interest_rate_only" [INT-05]: Only the interest rate is negotiable
  - "nothing_negotiable" [INT-05]: Neither can be negotiated (chose D)
Knowledge Gap: KG-idk, KG-blank
  Example: "I think I said Interest rate, honestly I just guessed I am unsure of what you can negotiate."
Selection Error: SE-selfcorrect, SE-reversal
  Example SE-reversal: "C) Both. Jayden can often negotiate the interest rate and the down payment, so both are typically negotiable." (student chose B but explains Both)`,
    rubric: {
      accept: "Mentions lenders compete for business or borrowers can shop around for better terms",
      partial: '"You can ask for better terms" (correct but does not explain why negotiation works)',
      reject: "Incorrect reasoning or no explanation",
    },
  },

  Q9: {
    question: "Considering the strategy of allocating income, what is the PRIMARY advantage to your household of making a budget?",
    options: "A) Ensures funds are available for bill paying and saving, B) Reduces your taxes, C) Increases rate of return on your investments, D) Do not know",
    correct_answer: "A) Ensures funds are available for bill paying and saving",
    subdomain: "Budgeting",
    taxonomy: `Layer 1 Codes: BORROW-06 (Budgeting purpose misunderstood)
Layer 2 Tags:
  - "tax_confusion" [BORROW-06]: Believes budgeting reduces taxes (chose B)
  - "investment_confusion" [BORROW-06]: Believes budgeting increases investment returns (chose C)
  - "purpose_misunderstanding" [BORROW-06]: General confusion about what budgeting does
Knowledge Gap: KG-idk, KG-blank
Selection Error: SE-selfcorrect`,
    rubric: {
      accept: "Mentions planning spending in advance or knowing where money goes ensures bills and savings are covered",
      partial: '"Helps you not run out of money" (correct effect but does not explain how budgeting achieves this)',
      reject: "Incorrect reasoning or no explanation",
    },
  },

  Q10: {
    question: "Which of the following statements regarding credit reports is FALSE?",
    options: "A) Credit reports are used by employers to screen job applicants, B) A credit report includes an assessment of your worthiness to receive credit, C) Your credit report is provided by a single source, D) Do not know",
    correct_answer: "C) Your credit report is provided by a single source",
    subdomain: "Credit Reports",
    taxonomy: `Layer 1 Codes: BORROW-01 (Credit report vs score confusion) | BORROW-03 (Employer use unknown)
Layer 2 Tags:
  - "employer_use_confusion" [BORROW-03]: Does not know employers can check credit reports. Chose A thinking it is false.
    Example: "I answered A because I don't think employers can see an applicant's credit reports"
  - "credit_score_confusion" [BORROW-01]: Confuses credit report with credit score
  - "single_source_belief" [BORROW-02]: Believes credit data comes from only one source
Knowledge Gap: KG-idk, KG-blank
  Example: "what? I am confused..."
Selection Error: SE-selfcorrect, SE-misread, SE-reversal
  Example SE-selfcorrect: "I realized my answer is incorrect. The answer is C) because multiple sources report your credit score"
  Example SE-reversal: "C, credit scores come from multiple sources not just one. I might be wrong but I believe there is 3 main credit agencies" (student chose B but explains C correctly)
NOTE: This item has a high selection error rate (~29%). The "FALSE" framing is confusing.`,
    rubric: {
      accept: "Mentions there are multiple credit bureaus (e.g. Equifax, Experian, TransUnion)",
      partial: '"There\'s more than one place that does credit reports" (correct but vague, no bureau names)',
      reject: "Incorrect reasoning or no explanation",
    },
  },

  Q11: {
    question: "Please tell me whether this statement is true or false: Buying a single company's stock usually provides a safer return than a stock mutual fund.",
    options: "A) True, B) False, C) Do not know",
    correct_answer: "B) False",
    subdomain: "Diversification (Stock vs Fund)",
    taxonomy: `Layer 1 Codes: RISK-05 (Single stock safer) | RISK-06 (Mutual fund unfamiliarity)
Layer 2 Tags:
  - "single_stock_safer_belief" [RISK-05]: Believes owning one stock is safer than a fund
  - "unfamiliar_with_mutual_fund" [RISK-06]: Does not know what a mutual fund is
Knowledge Gap: KG-idk, KG-unfamiliar (dominant pattern)
Selection Error: SE-selfcorrect, SE-reversal`,
    rubric: {
      accept: "Mentions spreading risk across many companies or diversification reduces risk",
      partial: '"Don\'t have all your eggs in one basket" (correct metaphor but could be more specific)',
      reject: "Incorrect reasoning or no explanation",
    },
  },

  Q12: {
    question: "Which of the following best describes the PRIMARY function of health insurance?",
    options: "A) Protect against the possibility of large unexpected medical bills, B) Cover the cost of routine health care expenses, C) Pay for elective medical procedures, D) Do not know",
    correct_answer: "A) Protect against large unexpected medical bills",
    subdomain: "Health Insurance Purpose",
    taxonomy: `Layer 1 Codes: INS-01 (Insurance for routine care) | INS-02 (Frequency = purpose)
Layer 2 Tags:
  - "routine_care_primary" [INS-01]: Believes insurance is primarily for routine doctor visits and checkups.
    Example 1: "Health insurance is meant to cover for routine health care services like short check ups or vaccine shots."
    Example 2: "I answered B because health insurance does not cover large unexpected bills, and mainly function with routine health care."
  - "frequency_over_severity" [INS-02]: Because routine care is used more often, it must be the primary function.
    Example: "Routine health care is more often used for most people than the other options."
  - "insurance_doesnt_cover_large_bills" [INS-01]: Believes insurance does not cover large unexpected expenses.
    Example: "when you get into accidents they do not fully cover all expenses"
Knowledge Gap: KG-idk, KG-blank
Selection Error: SE-selfcorrect`,
    rubric: {
      accept: "Mentions large medical bills can be financially devastating without insurance; insurance is catastrophic protection",
      partial: '"So you don\'t go broke if you get sick" (correct idea but informal, no mechanism)',
      reject: "Incorrect reasoning or no explanation",
    },
  },

  Q13: {
    question: "What does a home insurance deductible represent?",
    options: "A) Amount you pay before insurance covers damages, B) Monthly premium for coverage, C) Maximum amount insurance will pay, D) Do not know",
    correct_answer: "A) Amount you pay before insurance covers damages",
    subdomain: "Insurance Deductible",
    taxonomy: `Layer 1 Codes: INS-03 (Deductible definition wrong)
Layer 2 Tags:
  - "deductible_is_premium" [INS-03]: Confuses deductible with monthly premium (chose B)
  - "deductible_is_max_payout" [INS-03]: Believes deductible is the maximum amount insurance will pay (chose C)
  - "partial_understanding" [INS-03]: Close to correct but imprecise or confused
Knowledge Gap: KG-idk, KG-unfamiliar (dominant pattern; many students chose D)
Selection Error: SE-selfcorrect`,
    rubric: {
      accept: "Mentions paying the deductible amount out of pocket first, then insurance covers the rest",
      partial: '"You pay some, insurance pays the rest" (correct but vague on the order or threshold mechanism)',
      reject: "Incorrect reasoning or no explanation",
    },
  },

  Q14: {
    question: "When an investor spreads money among different assets, the risk of losing money usually:",
    options: "A) Increases, B) Decreases, C) Stays the same, D) Do not know",
    correct_answer: "B) Decreases",
    subdomain: "Diversification Principle",
    taxonomy: `Layer 1 Codes: RISK-03 (Diversification increases risk)
Layer 2 Tags:
  - "more_assets_more_risk" [RISK-03]: More assets = more complexity = more things that can go wrong
  - "more_exposure_more_risk" [RISK-03]: Spreading across places = more total exposure to risk
Knowledge Gap: KG-idk, KG-blank
Selection Error: SE-misread, SE-selfcorrect`,
    rubric: {
      accept: "Mentions if one investment fails, others can offset the loss; not all assets move together",
      partial: '"Don\'t put all eggs in one basket" (correct metaphor but does not explain WHY)',
      reject: "Incorrect reasoning or no explanation",
    },
  },

  Q29: {
    question: "If interest rates rise, what will typically happen to bond prices?",
    options: "A) They will rise, B) They will fall, C) They will stay the same, D) There is no relationship, E) Do not know",
    correct_answer: "B) They will fall",
    subdomain: "Interest Rates and Bonds",
    taxonomy: `Layer 1 Codes: INT-06 (Bond price/rate relationship reversed)
Layer 2 Tags:
  - "positive_correlation_belief" [INT-06]: Believes bond prices rise when interest rates rise.
    Example 1: "Bond prices have a positive correlation with interest rates."
    Example 2: "The bond prices rise because inflation causes everything to rise in price"
    Example 3: "You typically pay an interest rate on a bond... if one goes up, so does the other."
  - "inflation_drives_all_up" [INT-06]: Inflation pushes all asset prices up, including bonds
  - "no_relationship_belief" [INT-06]: Believes there is no relationship (chose D)
Knowledge Gap: KG-idk, KG-blank, KG-unfamiliar (dominant)
  Example: "I said i dont know."
Selection Error: SE-selfcorrect
  Example: "when interest rates rise, bonds offer higher yields making them less wantable" (chose E but reasoning suggests B)
NOTE: Some students reported UI issues ("I am not seeing my answer"). Tag these as KG-idk.`,
    rubric: {
      accept: "Mentions existing bonds become less attractive compared to new higher-rate bonds, so their price falls",
      partial: '"New bonds are better so old ones are worth less" (correct direction but could be clearer)',
      reject: "Incorrect reasoning or no explanation",
    },
  },

  Q30: {
    question: "An investment with a high return is likely to be high risk. True or false?",
    options: "A) True, B) False, C) Do not know",
    correct_answer: "A) True",
    subdomain: "Risk-Return Tradeoff",
    taxonomy: `Layer 1 Codes: RISK-02 (Exceptions disprove general rule)
Layer 2 Tags:
  - "exceptions_disprove_rule" [RISK-02]: Student argues exceptions exist so the general principle is false.
    Example 1: "I answered false because this may not always be the case. There are low risk strategies that can accompany high rewards."
    Example 2: "a high return does not automatically mean high risk in every case. Some investments can have strong returns due to factors like long time horizons, diversification"
  - "time_horizon_negates_risk" [RISK-02]: Long time horizon eliminates risk entirely
  - "prediction_negates_risk" [RISK-02]: Skill eliminates risk
Knowledge Gap: KG-idk, KG-blank
Selection Error: SE-selfcorrect
NOTE: Dominant pattern is RISK-02. Students interpret "likely" as "always" and argue exceptions invalidate the principle.`,
    rubric: {
      accept: "Mentions you must take more risk to have the chance of earning more; the risk-return tradeoff",
      partial: '"More reward means more risk" (correct but does not explain why)',
      reject: "Incorrect reasoning or no explanation",
    },
  },

  Q31: {
    question: "Which of the following best describes what the stock market does?",
    options: "A) Results in a gain in wealth for investors, B) Creates liquidity by guaranteeing investors a profit, C) Brings people who want to buy stocks together with those who want to sell stocks, D) Do not know",
    correct_answer: "C) Brings buyers and sellers together",
    subdomain: "Stock Market Function",
    taxonomy: `Layer 1 Codes: RISK-07 (Stock market guarantees returns)
Layer 2 Tags:
  - "guarantees_profit" [RISK-07]: Believes the stock market guarantees investors a profit (chose B)
  - "wealth_creation_primary" [RISK-07]: Believes stock market's main function is creating wealth (chose A)
  - "capital_raising_primary" [RISK-07]: Believes primary function is helping companies raise money
Knowledge Gap: KG-idk, KG-blank, KG-vague
Selection Error: SE-reversal, SE-selfcorrect`,
    rubric: {
      accept: "Mentions it allows people to buy ownership in companies or sell when they need money; provides liquidity",
      partial: '"So people can trade stocks" (correct but does not explain why this marketplace function matters)',
      reject: "Incorrect reasoning or no explanation",
    },
  },

  Q32: {
    question: "Considering a long time period (e.g., 10-20 years), which asset normally gives the highest return?",
    options: "A) Savings accounts, B) Bonds, C) Stocks, D) Do not know",
    correct_answer: "C) Stocks",
    subdomain: "Long-Term Asset Returns",
    taxonomy: `Layer 1 Codes: RISK-01 (Safety = highest returns)
Layer 2 Tags:
  - "bonds_safest_therefore_best" [RISK-01]: Believes safer assets produce highest returns (chose B)
  - "stocks_too_risky_for_returns" [RISK-01]: Stocks are too risky, so returns cannot be highest
  - "savings_safest_therefore_best" [RISK-01]: Zero-risk returns the most (chose A)
Knowledge Gap: KG-idk, KG-blank
Selection Error: SE-selfcorrect`,
    rubric: {
      accept: "Mentions stocks are riskier so they offer higher potential returns; or stocks represent ownership in growing companies",
      partial: '"Stocks go up more over time" (correct but does not explain why)',
      reject: "Incorrect reasoning or no explanation",
    },
  },

  Q33: {
    question: "In the BIG BUCKS LOTTERY, the chance of winning a $10 prize is 1%. What is your best guess about how many people would win a $10 prize if 1,000 people each buy a single ticket?",
    options: "A) 5, B) 8, C) 10, D) 12, E) Do not know",
    correct_answer: "C) 10",
    subdomain: "Probability (Percentage to Frequency)",
    taxonomy: `Layer 1 Codes: NUM-01 (Percentage calculation error)
Layer 2 Tags:
  - "calculation_error" [NUM-01]: Student miscalculates 1% of 1,000
  - "probability_misunderstanding" [NUM-01]: Does not understand percentage-to-count conversion
Knowledge Gap: KG-idk, KG-blank
Selection Error: SE-selfcorrect`,
    rubric: {
      accept: "Mentions 1% of 1,000 is 10, or 0.01 x 1,000 = 10",
      partial: '"1% means 1 out of 100, so 10 out of 1,000" (correct reasoning shown)',
      reject: "Incorrect calculation or no explanation",
    },
  },

  Q34: {
    question: "When an investor spreads money among different assets, does the risk of losing money usually increase, decrease, or stay the same?",
    options: "A) Increase, B) Decrease, C) Stay the same, D) Do not know",
    correct_answer: "B) Decrease",
    subdomain: "Diversification Effect",
    taxonomy: `Layer 1 Codes: RISK-03 (Diversification increases risk)
Layer 2 Tags:
  - "more_complexity_more_risk" [RISK-03]: More investments = more complexity = more risk
  - "more_exposure_more_risk" [RISK-03]: More places = more total exposure
Knowledge Gap: KG-idk, KG-blank
Selection Error: SE-selfcorrect, SE-reversal`,
    rubric: {
      accept: "Mentions losses in one investment can be offset by gains in others",
      partial: '"Not all eggs in one basket" (correct idea but does not explain the offsetting mechanism)',
      reject: "Incorrect reasoning or no explanation",
    },
  },

  Q35: {
    question: "If someone offers you the chance to make a lot of money, it is likely that there is also a chance that you will lose a lot of money. True or false?",
    options: "A) True, B) False, C) Do not know",
    correct_answer: "A) True",
    subdomain: "Risk-Return Relationship",
    taxonomy: `Layer 1 Codes: RISK-02 (Exceptions disprove rule) | RISK-10 (Real-world counterexamples)
Layer 2 Tags:
  - "real_world_counterexample" [RISK-10]: Uses non-financial scenarios (jobs, promotions) to disprove a financial principle.
    Example 1: "Not every situation is high risk. If a company offers you a better position that pays a lot more, it doesn't mean that you are going to lose that money"
    Example 2: "if you just show up to a chanced high paying job... you wouldn't lose any money because you didn't give any money"
  - "exceptions_disprove_rule" [RISK-02]: Same as Q30 pattern.
    Example: "a high potential gain does not automatically mean a high potential risk."
  - "trust_based_reasoning" [RISK-02]: Frames the scenario as a trust or scam decision
Knowledge Gap: KG-idk, KG-blank
Selection Error: SE-selfcorrect`,
    rubric: {
      accept: "Mentions risk and reward are linked; you cannot have high potential gain without accepting high potential loss",
      partial: '"No free lunch" or "nothing is guaranteed" (correct direction but vague)',
      reject: "Incorrect reasoning or no explanation",
    },
  },

  Q36: {
    question: "True or false: It is less likely that you will lose all of your money if you save it in more than one place.",
    options: "A) True, B) False, C) Do not know",
    correct_answer: "A) True",
    subdomain: "Diversification Principle",
    taxonomy: `Layer 1 Codes: RISK-03 (Diversification increases risk) | RISK-04 (Understood but misapplied)
Layer 2 Tags:
  - "correct_reasoning_wrong_answer" [SE-reversal]: Student explains diversification CORRECTLY but chose False. Very common.
    Example 1: "i actually think it's true. because it will be in separate places"
    Example 2: "I actually meant to put the other option because I was confused, I believe this is true."
    Example 3: "if one of the investments, or places you put your money goes bad and you loose the money, you still have the other money" (chose False)
    Example 4: "I remember my finance teacher said its better to invest in multiple instead of one place" (chose False)
  - "all_places_can_fail" [RISK-03]: Argues multiple places can all fail simultaneously.
    Example: "wherever you save the money could still go wrong like save money in different banks and the banks go through financial struggle"
  - "not_guaranteed" [RISK-03]: Spreading reduces but does not eliminate risk, so the statement is False.
    Example: "spreading money out can help, it does not completely eliminate the chance of losing it"
  - "misread_question" [SE-misread]: Student explicitly says they misread the question
Knowledge Gap: KG-idk, KG-blank
CRITICAL NOTE: This item has 62% selection error rate. The T/F framing with "less likely you will lose" causes widespread confusion. Most students who chose False actually understand diversification. Pay extra attention to selection error classification.`,
    rubric: {
      accept: "Mentions if one institution or investment fails, you do not lose everything because money is elsewhere",
      partial: '"Safer to spread it out" (correct but does not explain why)',
      reject: "Incorrect reasoning or no explanation",
    },
  },

  Q37: {
    question: "Which of the following insurance policies is most likely to protect you if you cause an accident that injures someone?",
    options: "A) Health insurance, B) Homeowner's or renter's insurance, C) Auto insurance liability coverage, D) Do not know",
    correct_answer: "C) Auto insurance liability coverage",
    subdomain: "Insurance Types",
    taxonomy: `Layer 1 Codes: INS-04 (Liability coverage scope wrong)
Layer 2 Tags:
  - "health_insurance_for_injuries" [INS-04]: Believes health insurance covers injuries you cause to others (chose A)
  - "auto_liability_for_self" [INS-04]: Confuses liability coverage with personal injury coverage
  - "homeowner_covers_accidents" [INS-04]: Believes homeowner's insurance covers all accident injuries (chose B)
Knowledge Gap: KG-idk, KG-blank
Selection Error: SE-misread, SE-selfcorrect`,
    rubric: {
      accept: "Mentions liability coverage specifically covers damage or injury you cause to OTHERS",
      partial: '"Covers accidents you cause" (correct but could specify what liability pays for)',
      reject: "Incorrect reasoning or no explanation",
    },
  },

  Q38: {
    question: "Which of the following types of investment would best protect the purchasing power of a family's savings in the event of a sudden increase in inflation?",
    options: "A) A 10-year bond paying a fixed rate of interest, B) A certificate of deposit at a bank, C) A 25-year home mortgage at a fixed rate, D) A house financed with a fixed-rate mortgage, E) Do not know",
    correct_answer: "D) A house financed with a fixed-rate mortgage",
    subdomain: "Inflation Protection",
    taxonomy: `Layer 1 Codes: INF-04 (Inflation protection confusion)
Layer 2 Tags:
  - "fixed_bond_best" [INF-04]: Believes a fixed-rate bond protects against inflation (chose A)
  - "cd_benefits_from_inflation" [INF-04]: Believes CD rates adjust upward automatically (chose B)
  - "debt_is_bad" [INF-04]: Avoided mortgage options because debt is inherently negative
  - "mortgage_not_house" [INF-04]: Chose C (the mortgage/debt) rather than D (the house/asset). Understands concept but picked wrong framing.
Knowledge Gap: KG-idk, KG-blank, KG-unfamiliar
Selection Error: SE-selfcorrect, SE-reversal
NOTE: Options C and D are very close. C is the mortgage (debt instrument), D is the house (real asset with fixed-cost financing). C-choosers may understand the concept but picked the wrong framing. Classify carefully.`,
    rubric: {
      accept: "Mentions the mortgage payment stays fixed while the home's value and income rise with inflation",
      partial: '"Houses go up in value" (correct but does not explain the fixed-mortgage payment benefit)',
      reject: "Incorrect reasoning or no explanation",
    },
  },

  Q39: {
    question: "True or false: Stocks are generally riskier than bonds.",
    options: "A) True, B) False, C) Do not know",
    correct_answer: "A) True",
    subdomain: "Stocks vs Bonds Risk",
    taxonomy: `Layer 1 Codes: RISK-08 (Stocks vs bonds risk confusion)
Layer 2 Tags:
  - "bonds_contain_stocks" [RISK-08]: Believes bonds are bundles of stocks or contain stocks
  - "some_bonds_risky_too" [RISK-08]: Argues some bonds are risky, so stocks are not always riskier
Knowledge Gap: KG-idk, KG-unfamiliar (dominant pattern)
Selection Error: SE-selfcorrect, SE-reversal`,
    rubric: {
      accept: "Mentions stocks have more price volatility, bigger swings in value, or greater uncertainty than bonds",
      partial: '"Stocks go up and down more" (correct but does not explain why)',
      reject: "Incorrect reasoning or no explanation",
    },
  },

  Q40: {
    question: "What was a key factor contributing to the 2007 to 2008 financial crisis?",
    options: "A) Strong regulation of mortgage lending, B) Widespread failure to properly assess and manage financial risk, C) High household savings rates, D) Low levels of borrowing by households",
    correct_answer: "B) Widespread failure to properly assess and manage financial risk",
    subdomain: "Crisis/Systemic Risk",
    taxonomy: `Layer 1 Codes: CRISIS-01 (Cause reversed) | CRISIS-02 (Savings focus)
Layer 2 Tags:
  - "regulation_caused_crisis" [CRISIS-01]: Believes strong regulation caused the crisis (chose A).
  - "low_borrowing_caused_crash" [CRISIS-01]: Believes low borrowing caused the crisis (chose D).
  - "high_savings_risk" [CRISIS-02]: Believes the crisis was about savings losing value (chose C)
Knowledge Gap: KG-idk, KG-blank
Selection Error: SE-selfcorrect, SE-reversal
  Example SE-reversal: Student understands excessive/risky lending occurred but chose A thinking regulation failed`,
    rubric: {
      accept: "Mentions risky mortgages given to people who could not repay, or financial risks were hidden, underestimated, or spread throughout the system",
      partial: '"Banks took too many risks" (correct direction but could be more specific)',
      reject: "Incorrect reasoning or no explanation",
    },
  },
};
