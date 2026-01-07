# Independent Study: Financial Literacy Assessment Evaluation

## Introduction

Financial literacy is commonly defined as the ability to understand and use financial concepts and quantitative information to make informed decisions about saving, borrowing, investing, and managing risk. In the human capital framework, these competencies influence participation in credit and asset markets, portfolio choice, and resilience to shocks. For university students, financial literacy is immediately consequential because many begin managing debt, credit, and consumption decisions under limited experience and imperfect information. Small misunderstandings in compounding, interest-rate mechanics, inflation, diversification, and insurance can translate into persistent debt burdens, fragile liquidity positions, and suboptimal portfolio choices.

Despite broad recognition of its importance, financial literacy is unevenly distributed across student populations. Students arrive with heterogeneous prior exposure to personal finance concepts, differences in numeracy, and unequal access to credible guidance through households, schools, employers, and digital sources. Learning is further shaped by behavioral and contextual constraints, including time scarcity, employment intensity, financial stress, risk preferences, and prior exposure to financial products. Consequently, evaluation of financial literacy instruction should address both average learning gains and the determinants of variation in learning across students.

This independent study evaluates learning outcomes in Quinn 102 (Financial Literacy) during the 2026 offering through structured questionnaires administered in the second week of class and on the last day of class. The purpose of administering the questionnaire for Quinn 102 in 2026 is twofold. First, it is designed to measure the overall level of learning achieved, and its distribution across different categories of financial literacy, demographics, and socio-economic characteristics of the sample. Second, it is designed to determine which factors affect the level and magnitude of learning in order to inform the development of more effective courses in the future. In specifying the determinants of learning, the study emphasizes behavioral and contextual variables that affect students' learning in domains such as borrowing, investment, and risk management.

### Research Questions

To sharpen the study's contribution as an independent research project, the evaluation is organized around two research questions:

- **RQ1 (Learning gains)**: What is the magnitude of student learning in Quinn 102, overall and within the domains of borrowing and credit, investment, and risk management, as measured by pre to post changes in knowledge?
- **RQ2 (Heterogeneity)**: Which baseline behavioral and contextual variables predict heterogeneity in learning gains across students, and do these predictors differ by domain?

### Assessment Design

The assessment instrument is organized to capture mastery across core domains covered in Quinn 102. Borrowing and credit items target concepts such as interest mechanics, amortization, repayment schedules, and the implications of fees and minimum payments. Investment items emphasize compound growth, diversification, and the risk return trade-off. Risk management items capture decision-making under uncertainty and the role of insurance and other protective behaviors. Learning is operationalized primarily as the percentage of correct responses overall and by domain, complemented by domain-level diagnostics that identify where gains are concentrated or limited.

The pre to post design supports a clear estimate of course-associated learning gains at the student level. At the same time, because the design does not employ a randomized control group, the study interprets results as evidence of learning associated with course participation under standardized measurement conditions. This framing preserves analytic credibility while still producing actionable evidence for instructional refinement and for building subsequent, more strongly identified evaluations.

Beyond average effects, the study is designed to explain heterogeneity in outcomes. Baseline measures collected alongside the second-week administration capture student characteristics and circumstances plausibly associated with learning trajectories, including demographic and socioeconomic background, prior exposure to financial products and experiences, and behavioral indicators such as confidence, financial stress, and time constraints. These measures enable analyses of baseline disparities, differential learning gains, and whether the course narrows or widens gaps in domain mastery.

### Platform Infrastructure

To ensure standardized delivery and data integrity at scale, the questionnaire is administered through a dedicated web platform developed for this study, the Financial Literacy Toolkit (platform reference available in the project documentation). The platform provides a consistent workflow for pre and post administration, including consent capture, controlled assessment availability, and time-stamped submissions. Students initiate an attempt by entering a course code and identifier, and the system is designed to preserve confidentiality by transforming identifiers into pseudonymous keys prior to storage, with access controls intended to restrict data visibility to authorized instructional personnel. This digital delivery mechanism reduces administrative friction, strengthens reproducibility of administration conditions, and supports analysis-ready exports aligned with the study's domain and covariate structure.

### AI and NLP Extensions

A further motivation for purpose-built administration is to enable measurement and instructional extensions that leverage AI and natural language processing (NLP) in a governed, research-appropriate manner. The platform architecture is designed to support, when implemented and validated, scalable scoring of short-answer explanations using rubric-aligned NLP features, misconception detection and cohort-level diagnostics derived from response text and error patterns, and controlled feedback experiences that deliver targeted explanations or resources without compromising assessment integrity during active windows. In this independent study, AI and NLP components are framed as extensions that can enrich measurement and support instruction, rather than substitutes for the primary pre to post evaluation design. Their use requires explicit transparency, version control for rubrics and models, and human review pathways for low-confidence classifications.

#### Adaptive Assessment Sequence

Concretely, the assessment can be implemented as an adaptive sequence in which each multiple choice item is paired with (i) a brief confidence rating on a 1 to 5 scale and (ii) a corresponding short-answer prompt that is available as a follow-up. Students first select an answer and then report confidence. The platform then uses the combination of correctness and confidence to decide whether to "probe underlying understanding" by presenting the short-answer question. For example, an incorrect answer with high confidence can indicate a stable misconception and can trigger a short prompt such as, "In one or two sentences, explain your reasoning." Likewise, a correct answer with low confidence can trigger the same follow-up to distinguish genuine understanding from guessing. In contrast, correct answers reported with high confidence can be treated as evidence of mastery and may not require additional probing, subject to design constraints and windowing. From the student's perspective, this appears as a targeted follow-up presented only when the correctness-confidence combination indicates uncertainty, guessing, or potential misconception, rather than as an added writing requirement after every item.

Behind the scenes, the system uses item-level correctness and the reported confidence score to assign a diagnostic state (for example, likely misconception, likely guessing, or likely mastery). When the short-answer follow-up is triggered, NLP methods compare the response to a rubric, detect whether key ideas are present, identify common misconception patterns, and generate structured tags that are stored with the attempt record. Low-confidence automated classifications can be flagged for human review. Aggregated across students, these correctness-confidence patterns and NLP-derived tags provide higher-resolution evidence on how students understand borrowing, investment, and risk management concepts, complementing percent-correct outcomes with interpretable indicators of reasoning quality and misconception types.

### Psychometric Validation

Critically, while AI and NLP technologies can provide sophisticated enhancements to assessment and feedback, rigorous psychometric validation remains foundational. Exploratory Factor Analysis (EFA) and internal consistency reliability metrics such as Cronbach's alpha (α) provide classical evidence that questionnaire items measure coherent and reliable constructs. In this study, EFA is used to verify that items within each domain load on intended latent factors and to assess dimensionality, that is, how many underlying constructs the item set appears to measure. Cronbach's alpha is used to evaluate internal consistency, indicating whether items intended to measure the same construct exhibit adequate correlation. Together, these methods identify items or domains requiring refinement, support reliability across different student populations and assessment occasions, and establish replicable benchmarks that facilitate future research and institutional comparisons. This integration of EFA and α with the platform's AI/NLP framework is intended to preserve measurement rigor while enabling contemporary innovation in assessment design and diagnostics.

### Study Contribution

Collectively, this independent study contributes an empirically grounded evaluation of Quinn 102's association with student financial literacy gains, a structured approach to diagnosing domain-level strengths and weaknesses, and an operational infrastructure for repeatable, privacy-aware measurement. The results are intended to support continuous course improvement and to provide evidence on which student characteristics and constraints are most predictive of learning gains in borrowing, investment, and risk management.

---

## Assessment Structure Summary

| Category | Subcategory | Count | Q# |
|----------|-------------|-------|-----|
| **Baseline Covariates (Not Scored)** | Demographic Characteristics | 5 | 1–5 |
| | Financial Background & Context | 3 | 6–8 |
| **Borrowing, Interest Rates, and Financial Numeracy Knowledge (13 items)** | Compound Interest | 1 | 1 |
| | Inflation | 3 | 2, 3, 4 |
| | Borrowing/Mortgages | 1 | 5 |
| | Borrowing/Interest | 1 | 6 |
| | Borrowing | 1 | 7 |
| | Borrowing/Credit | 1 | 8 |
| | Saving | 1 | 9 |
| | Saving/Budgeting | 1 | 10 |
| | Earning | 1 | 11 |
| | Numeracy | 2 | 12, 13 |
| **Behavioral and Risk Management Knowledge (10 items)** | Insurance | 2 | 14, 15 |
| | Risk Diversification | 1 | 16 |
| | Retirement/Annuities | 1 | 17 |
| | Loss Aversion | 1 | 18 |
| | Risk Choice | 1 | 19 |
| | Social Influence and Herding | 1 | 20 |
| | Decision Style | 1 | 21 |
| | Risk Confidence | 1 | 22 |
| | Scam Skepticism | 1 | 23 |
| **Risk and Return Knowledge (7 items)** | Investing/Risk-Return | 3 | 24, 25, 26 |
| | Crisis/Systemic Risk | 1 | 27 |
| | Conditional Probability | 1 | 28 |
| | Expected Value | 1 | 29 |
| | Base Rate/Bayes | 1 | 30 |
| **TOTAL** | **8 Baseline + 30 Scored** | **38** | — |

---

## Baseline Covariates (Not Scored)

These questions collect demographic and background information for heterogeneity analysis. They are not scored.

### Demographic Characteristics (Q1–Q5)

**Question B1.** What is your gender? [Demographic Characteristics]

- A) Female
- B) Male
- C) Prefer not to say

**Question B2.** Which category best describes your racial or ethnic background? [Demographic Characteristics]

- A) White or Caucasian
- B) Asian
- C) Black or African American
- D) Hispanic or Latino
- E) Native Hawaiian or Pacific Islander
- F) Native American or Alaska Native
- G) Two or more racial or ethnic backgrounds
- H) Other
- I) Prefer not to say

**Question B3.** What is your age range? [Demographic Characteristics]

- A) 20 or under
- B) Above 20

**Question B4.** What is your first language? [Demographic Characteristics]

- A) English
- B) Spanish
- C) Chinese (any dialect)
- D) French
- E) Russian
- F) Dutch
- G) Other (please specify): ________

**Question B5.** Do you have work experience? [Demographic Characteristics]

- A) No work experience
- B) Part-time employment
- C) Full-time employment

### Financial Background & Context (Q6–Q8)

**Question B6.** Prior to enrolling in this course, had you personally used any of the following financial products? (Select all that apply) [Financial Background & Context]

- A) Credit card
- B) Student loan
- C) Auto loan
- D) Investment account (stocks, ETFs, mutual funds)
- E) Insurance policy in your own name
- F) None of the above

**Question B7.** Before enrolling in this course, how would you rate your overall financial knowledge? [Financial Background & Context]

- A) Very low
- B) Low
- C) Moderate
- D) High
- E) Very high

**Question B8.** How often do you feel financially stressed? [Financial Background & Context]

- A) Never
- B) Rarely
- C) Sometimes
- D) Often
- E) Always

---

## Borrowing, Interest Rates, and Financial Numeracy Knowledge

**(Scored: Q1–Q13, 13 items)**

These questions assess knowledge of compound interest, inflation, borrowing, saving, and basic numeracy.

**Question 1.** Suppose you had $100 in a savings account and the interest rate was 2% per year. After 5 years, how much do you think you would have in the account if you left the money to grow? [Compound Interest]

- A) More than $102
- B) Exactly $102
- C) Less than $102
- D) Do not know

**Correct Answer:** A

**Question 2.** Imagine that the interest rate on your savings account was 1% per year and inflation was 2% per year. After 1 year, how much would you be able to buy with the money in this account? [Inflation]

- A) More than today
- B) Exactly the same
- C) Less than today
- D) Do not know

**Correct Answer:** C

**Question 3.** A successful effort to lower inflation would likely be accompanied by which of the following? [Inflation]

- A) A decrease in the general level of prices
- B) A slower increase in prices
- C) An increase in employment
- D) Do not know

**Correct Answer:** B

**Question 4.** Inflation can cause difficulty in many ways. Which group would have the greatest problem during periods of high inflation? [Inflation]

- A) Young couples with no children who both work
- B) Older, working couples saving for retirement
- C) Retirees living on a fixed income
- D) Do not know

**Correct Answer:** C

**Question 5.** A 15-year mortgage typically requires higher monthly payments than a 30-year mortgage, but the total interest paid over the life of the loan will be less. True or false? [Borrowing/Mortgages]

- A) True
- B) False
- C) Do not know

**Correct Answer:** A

**Question 6.** You lend $25 to a friend one evening and he gives you $25 back the next day. How much interest has he paid on this loan? [Borrowing/Interest]

- A) $25
- B) $0
- C) Do not know

**Correct Answer:** B

**Question 7.** Jayden is shopping for an auto loan. Which of the following can he likely negotiate with the lender? [Borrowing]

- A) The interest rate
- B) The required down payment
- C) Both
- D) Neither
- E) Do not know

**Correct Answer:** C

**Question 8.** Which of the following statements regarding credit reports is FALSE? [Borrowing/Credit]

- A) Credit reports are used by employers to screen job applicants
- B) A credit report includes an assessment of your worthiness to receive credit
- C) Your credit report is provided by a single source
- D) Do not know

**Correct Answer:** C

**Question 9.** Lyle has a good job and earns enough to pay his bills comfortably each month. In terms of his emergency savings, how much should he have set aside? [Saving]

- A) $200 or so
- B) Money equal to his share of one month's rent/mortgage
- C) The equivalent of three or more months of living expenses
- D) Do not know

**Correct Answer:** C

**Question 10.** If a young person with a long-term investment horizon has money to invest, which will typically produce the best returns? [Saving/Budgeting]

- A) Savings account
- B) Government bonds
- C) Stocks
- D) Do not know

**Correct Answer:** C

**Question 11.** Considering the strategy of allocating income, what is the PRIMARY advantage to your household of making a budget? [Earning]

- A) Ensures funds are available for bill paying and saving
- B) Reduces your taxes
- C) Increases rate of return on your investments
- D) Do not know

**Correct Answer:** A

**Question 12.** Imagine that five friends are given a gift of $1,000. If the friends have to share the money equally, how much does each one get? [Numeracy]

- A) $100
- B) $150
- C) $200
- D) $250
- E) Do not know

**Correct Answer:** C

**Question 13.** A family member tells Wendy that her hourly wage will be cut 10% if she stays at her current job. In addition, her work hours would also be cut 10%. What best describes how her paycheck would change? [Numeracy]

- A) It would decrease by less than 20%
- B) It would decrease by 20%
- C) It would decrease by more than 20%
- D) Do not know

**Correct Answer:** A

---

## Behavioral and Risk Management Knowledge

**(Scored: Q14–Q23, 10 items)**

These questions assess understanding of insurance, diversification, retirement planning, and behavioral tendencies. Behavioral items (Q18–Q23) have no objectively correct answer.

**Question 14.** Which of the following best describes the PRIMARY function of health insurance? [Insurance]

- A) Protect against the possibility of large unexpected medical bills
- B) Cover the cost of routine health care expenses
- C) Pay for elective medical procedures
- D) Do not know

**Correct Answer:** A

**Question 15.** What does a home insurance deductible represent? [Insurance]

- A) Amount you pay before insurance covers damages
- B) Monthly premium for coverage
- C) Maximum amount insurance will pay
- D) Do not know

**Correct Answer:** A

**Question 16.** When an investor spreads money among different assets, the risk of losing money usually: [Risk Diversification]

- A) Increases
- B) Decreases
- C) Stays the same
- D) Do not know

**Correct Answer:** B

**Question 17.** Which of the following statements about annuities is TRUE? [Retirement/Annuities]

- A) An annuity provides income in retirement that one cannot outlive
- B) An annuity lets you invest in stocks without risk
- C) An annuity is guaranteed by the FDIC
- D) Do not know

**Correct Answer:** A

**Question 18.** Your retirement account drops 20% due to a market downturn. How do you react? [Loss Aversion]

- A) Sell everything, I can't risk losing more
- B) Do nothing, markets recover over time
- C) Invest more, buy while prices are low
- D) Move funds to safer options like bonds or cash

**Question 19.** You're offered a 50/50 chance to either win $1,000 or lose $500. What do you choose? [Risk Choice]

- A) Take the risk, the reward is worth it
- B) Decline, I don't like the idea of losing money
- C) Only accept if I have money to spare
- D) Ask others what they would do

**Question 20.** You hear that everyone is investing in a new crypto asset. What do you do? [Social Influence and Herding]

- A) Invest quickly, don't miss out
- B) Put in a small amount just in case
- C) Research carefully before acting
- D) Stay out, I avoid hype

**Question 21.** When faced with a complex financial decision, how do you typically proceed? [Decision Style]

- A) Do extensive research and consider all outcomes
- B) Go with your intuition or gut feeling
- C) Rely on advice from friends or family
- D) Delay the decision until you feel more confident

**Question 22.** How confident are you in recognizing when an investment is too risky for your situation? [Risk Confidence]

- A) Very confident, I understand my risk limits
- B) Somewhat confident, I can tell when it's extreme
- C) Not very confident, I often second-guess
- D) I usually rely on others to decide for me

**Question 23.** If an investment opportunity promises unusually high returns with little explanation of how, what do you do? [Scam Skepticism]

- A) Invest a small amount just to test it
- B) Ask for more details and do research
- C) Avoid it, it seems too good to be true
- D) Immediately take advantage before it's gone

---

## Risk and Return Knowledge

**(Scored: Q24–Q30, 7 items)**

These questions assess investing knowledge, crisis awareness, and statistical numeracy including probability reasoning and expected value calculations.

**Question 24.** If interest rates rise, what will typically happen to bond prices? [Investing/Risk-Return]

- A) They will rise
- B) They will fall
- C) They will stay the same
- D) There is no relationship
- E) Do not know

**Correct Answer:** B

**Question 25.** Which of the following best describes what the stock market does? [Investing/Risk-Return]

- A) Results in a gain in wealth for investors
- B) Creates liquidity by guaranteeing investors a profit
- C) Brings people who want to buy stocks together with those who want to sell stocks
- D) Do not know

**Correct Answer:** C

**Question 26.** Considering a long time period (e.g., 10-20 years), which asset normally gives the highest return? [Investing/Risk-Return]

- A) Savings accounts
- B) Bonds
- C) Stocks
- D) Do not know

**Correct Answer:** C

**Question 27.** What was a key factor contributing to the 2007 to 2008 financial crisis? [Crisis/Systemic Risk]

- A) Strong regulation of mortgage lending
- B) Widespread failure to properly assess and manage financial risk
- C) High household savings rates
- D) Low levels of borrowing by households

**Correct Answer:** B

**Question 28.** Out of 1,000 people in a small town 500 are members of a choir. Out of these 500 members in the choir 100 are men. Out of the 500 inhabitants that are not in the choir 300 are men. What is the probability that a randomly drawn man is a member of the choir? Please indicate the probability in percent. [Conditional Probability]

- A) 12.5%
- B) 15%
- C) 25%
- D) 35%
- E) Do not know

**Correct Answer:** C

**Question 29.** There's a 50/50 chance that Malik's car will need engine repairs within the next six months which would cost $1,000. At the same time there is a 10% chance that he will need to replace the air conditioning unit in his house, which would cost $4,000. Which poses the greater financial risk for Malik? [Expected Value]

- A) The car engine repairs
- B) The air conditioning replacement
- C) Both pose the same financial risk
- D) Do not know

**Correct Answer:** A

**Question 30.** A disease affects 1 in 1,000 people. A test for the disease is 99% accurate (it correctly identifies 99% of people who have the disease and 99% of people who don't have it). If a person tests positive, what is the approximate probability they actually have the disease? [Base Rate/Bayes]

- A) About 99%
- B) About 50%
- C) About 10%
- D) About 1%
- E) Do not know

**Correct Answer:** C
