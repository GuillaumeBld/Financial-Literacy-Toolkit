# Developing a Risk Literacy Diagnostic for QUIN 102: Instrument Design, Platform Implementation, and SDM-10 Diagnostic Findings

**Loyola University Chicago**
**Independent Study -- Spring 2026**

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Related Work](#2-related-work)
   - 2.1 [Financial Literacy: Definitions and Measurement](#21-financial-literacy-definitions-and-measurement)
   - 2.2 [Domain-Specific Knowledge Gaps](#22-domain-specific-knowledge-gaps)
   - 2.3 [Confidence Calibration and Overconfidence](#23-confidence-calibration-and-overconfidence)
   - 2.4 [Gaps in the Literature](#24-gaps-in-the-literature)
3. [Instrument and Measurement Model](#3-instrument-and-measurement-model)
   - 3.1 [Assessment Structure](#31-assessment-structure)
   - 3.2 [Scoring Methodology](#32-scoring-methodology)
   - 3.3 [Risk Literacy Emphasis](#33-risk-literacy-emphasis)
4. [SDM-10 Diagnostic Module](#4-sdm-10-diagnostic-module)
   - 4.1 [Selection Algorithm and Need Score](#41-selection-algorithm-and-need-score)
   - 4.2 [Variant Types and Three-Way Classification](#42-variant-types-and-three-way-classification)
   - 4.3 [AI-Assisted Scoring Pipeline](#43-ai-assisted-scoring-pipeline)
   - 4.4 [Diagnostic Findings](#44-diagnostic-findings)
     - 4.4.1 [Open-Ended Response Overview](#441-open-ended-response-overview)
     - 4.4.2 [Diagnose Classification Results](#442-diagnose-classification-results)
     - 4.4.3 [Confirm Classification Results](#443-confirm-classification-results)
     - 4.4.4 [Misconception Analysis by Domain](#444-misconception-analysis-by-domain)
     - 4.4.5 [Selection Error Patterns](#445-selection-error-patterns)
     - 4.4.6 [Validation Against Manual Analysis](#446-validation-against-manual-analysis)
     - 4.4.7 [Cross-Item Patterns](#447-cross-item-patterns)
5. [Platform and Governance Design](#5-platform-and-governance-design)
   - 5.1 [Technology Stack](#51-technology-stack)
   - 5.2 [Student Authentication and Data Minimization](#52-student-authentication-and-data-minimization)
   - 5.3 [Consent Mechanics](#53-consent-mechanics)
6. [Pilot Operations and Descriptive Statistics](#6-pilot-operations-and-descriptive-statistics)
   - 6.1 [Participation and Completion](#61-participation-and-completion)
   - 6.2 [Anchor Score Context](#62-anchor-score-context)
   - 6.3 [Assessment Duration](#63-assessment-duration)
7. [Discussion](#7-discussion)
8. [Limitations](#8-limitations)
9. [Paper 2: IRB-Approved Pre-Post Study Protocol](#9-paper-2-irb-approved-pre-post-study-protocol)
- [References](#references)
- [Declaration of AI and AI-Assisted Technologies](#declaration-of-ai-and-ai-assisted-technologies)
- [Appendix A: SDM-10 Selection Algorithm and Burden Controls](#appendix-a-sdm-10-selection-algorithm-and-burden-controls)
- [Appendix B: Assessment Items (Full Question Bank)](#appendix-b-assessment-items-full-question-bank)
- [Appendix C: Financial Literacy Misconception Taxonomy (Layer 1)](#appendix-c-financial-literacy-misconception-taxonomy-layer-1)
- [Appendix D: AI Scorer Model Selection Protocol](#appendix-d-ai-scorer-model-selection-protocol)

---

## 1. Introduction

Financial literacy is commonly defined as the ability to understand and use financial concepts and quantitative information to make informed decisions about saving, borrowing, investing, and managing risk. In the human capital framework, these competencies influence participation in credit and asset markets, portfolio choice, and resilience to shocks. For university students, financial literacy is immediately consequential because many begin managing debt, credit, and consumption decisions under limited experience and imperfect information. Small misunderstandings in compounding, interest-rate mechanics, inflation, diversification, and insurance can translate into persistent debt burdens, fragile liquidity positions, and suboptimal portfolio choices.

Recent policy debate on consumer credit highlights why financial literacy matters for borrowing outcomes. Creditworthiness is partly a function of financial literacy education, and improving consumers' understanding of borrowing mechanics can reduce delinquency and compounding penalty dynamics that raise effective borrowing costs. From this perspective, expanding access to bona fide financial literacy education is not only consumer protection but also a market-relevant intervention, because stronger credit profiles can reduce risk-based pricing pressure and contribute to lower rates over time for both borrowers and lenders.

Despite broad recognition of its importance, financial literacy is unevenly distributed across student populations. Students arrive with heterogeneous prior exposure to personal finance concepts, differences in numeracy, and unequal access to credible guidance through households, schools, employers, and digital sources. Learning is further shaped by behavioral and contextual constraints, including time scarcity, employment intensity, financial stress, risk preferences, and prior exposure to financial products. Consequently, evaluation of financial literacy instruction should address both average learning gains and the determinants of variation in learning across students.

This independent study develops and pilots a diagnostic instrument for evaluating financial and risk literacy in QUIN 102 (Financial Literacy) during the Spring 2026 offering. The instrument comprises a 40-item anchor assessment covering financial knowledge and attitudes, paired with a 10-item Supplemental Diagnostic Module (SDM-10) that adaptively probes areas of weakness identified in the anchor responses. The assessment is administered through a purpose-built web platform with coded student identifiers and structured consent mechanics.

More specifically, the independent study is organized around two research questions that frame the overall project:

- **RQ1 (Learning gains):** What is the magnitude of student learning in QUIN 102, overall and within the domains of borrowing and credit, investment, and risk management, as measured by pre- to post-course changes in knowledge?

- **RQ2 (Heterogeneity):** Which baseline behavioral and contextual variables predict heterogeneity in learning gains across students, and do these predictors differ by domain?

RQ1 and RQ2 require paired pre-post data and will be addressed following the post-course assessment administration at the end of the Spring 2026 semester. This paper (Paper 1) focuses on the instrument design, platform implementation, and diagnostic findings from the SDM-10 module administered during the pre-course assessment (February 2--9, 2026). The SDM-10's three-way classification of open-ended responses (misconception, knowledge gap, selection error) provides diagnostic information that standard multiple-choice instruments cannot capture -- in particular, the finding that a substantial fraction of incorrect answers reflect selection errors rather than genuine misconceptions, and that a meaningful fraction of correct answers reflect lucky guesses rather than genuine understanding. These findings demonstrate that raw MCQ scores both overstate and understate student knowledge in systematic ways, with implications for instrument design and instructional targeting.

---

## 2. Related Work

### 2.1 Financial Literacy: Definitions and Measurement

Financial literacy has been the subject of growing scholarly attention since the early 2000s. Lusardi and Mitchell (2014) provide the foundational theoretical framework, defining financial literacy as knowledge of interest compounding, inflation, and risk diversification, and demonstrating that it functions as a form of human capital investment with measurable effects on saving, investing, and wealth accumulation. Their "Big Three" questions have become the most widely adopted instrument for assessing basic financial literacy and form the conceptual basis for most subsequent measurement efforts, including the assessment categories used in the present study.

Despite broad recognition of its importance, the field has lacked a standardized instrument analogous to established health literacy measures. Huston (2010) reviewed the heterogeneous measurement landscape and proposed that financial literacy instruments should contain 12--20 items spanning four content areas: money basics (time value of money, purchasing power), borrowing, investing, and asset protection. Our assessment's coverage of borrowing/credit, investment/risk, and behavioral risk management closely mirrors Huston's recommended framework. More recently, the OECD (2022) OECD/INFE toolkit has provided a standardized questionnaire measuring three dimensions of financial literacy -- knowledge, behavior, and attitudes -- deployed across dozens of countries to enable cross-national comparisons.

Hastings, Madrian, and Skimmyhorn (2013) assessed how financial literacy is measured in existing research and found that the "Big Five" questions -- covering interest rates, inflation, diversification, compound interest, and bond pricing -- are broadly accepted as reliable indicators of financial competence, though they noted significant methodological challenges in establishing causal links between literacy and outcomes. Lusardi (2019) further documented that globally, only about one-third of adults demonstrate familiarity with basic financial concepts, with illiteracy especially concentrated among women, minorities, the young, and those with lower educational attainment.

Among college students specifically, Chen and Volpe (1998) established early baseline evidence, finding that 924 college students answered only about 53% of financial literacy questions correctly, with non-business majors, women, and students with limited work experience scoring significantly lower.

### 2.2 Domain-Specific Knowledge Gaps

Research has documented uneven financial literacy across knowledge domains. Lusardi and Tufano (2015) established the concept of "debt literacy" as distinct from general financial literacy, finding that only about one-third of Americans comprehend interest compounding or credit card mechanics, and estimating that as much as one-third of charges and fees paid by less-knowledgeable individuals can be attributed to ignorance. Stango and Zinman (2009) identified the cognitive mechanism underlying many borrowing mistakes -- exponential growth bias, the pervasive tendency to linearize exponential functions -- which leads consumers to underestimate interest rates on loans and underestimate future values of investments.

In the investment domain, van Rooij, Lusardi, and Alessie (2011) found that while most respondents demonstrated basic financial knowledge (interest compounding, inflation, time value of money), very few understood differences between bonds and stocks, bond price-interest rate relationships, or risk diversification basics. Individuals with low advanced financial literacy were significantly less likely to participate in the stock market.

Among college students specifically, Akers and Chingos (2014) found striking levels of student loan illiteracy: 28% of first-year students with federal loans reported having no federal debt, and nearly half seriously underestimated their total student debt. These findings underscore why the present assessment includes borrowing/credit as a major knowledge domain.

### 2.3 Confidence Calibration and Overconfidence

The relationship between perceived and actual financial literacy has emerged as a critical dimension of financial competence. Allgood and Walstad (2016) demonstrated, using a national survey of 28,146 U.S. adults, that both actual (objective) and perceived (subjective) financial literacy independently influence financial behaviors across five domains. The combined measure of both perceived and actual literacy provides greater explanatory power than either alone, supporting the QUIN 102 assessment's design that generates an overconfidence index from both measures.

Robb and Woodyard (2011) found that subjective financial knowledge had a larger relative impact on financial behavior than objective knowledge, underscoring the importance of measuring confidence calibration. Porto and Xiao (2016) found that over 11% of respondents in a nationally representative sample displayed financial literacy overconfidence -- scoring above average on perceived knowledge but failing basic literacy questions -- and that these overconfident consumers were less likely to seek professional financial advice in domains where they most needed it.

In a study closely comparable to the present research, Ipatova and Merheb (2023) examined overconfidence among 169 undergraduates and confirmed the Dunning-Kruger effect in financial literacy contexts: students with lower financial proficiency systematically overestimated their knowledge and competence. Kramer (2016) provided additional evidence that confidence operates independently of knowledge in shaping financial behavior, finding that higher confidence reduces advice-seeking while no relationship exists between objective literacy and advice-seeking.

### 2.4 Gaps in the Literature

The literature review reveals several gaps that the present instrument addresses. First, most financial literacy measurement studies rely on fixed multiple-choice instruments that cannot distinguish between genuine misconceptions, knowledge gaps, and selection errors -- a limitation that affects both diagnostic accuracy and instructional targeting. Second, the use of adaptive diagnostic instruments that probe areas of weakness identified in an anchor assessment is novel in the financial literacy evaluation literature. Third, the simultaneous measurement of knowledge, confidence, and behavioral covariates enables analysis of confidence calibration, directly addressing Willis's (2011) concern about "confident incompetence." The present study contributes to filling these gaps by developing a diagnostic instrument that combines a fixed anchor assessment with an adaptive diagnostic module, enabling finer-grained classification of student responses than traditional MCQ-only approaches.

---

## 3. Instrument and Measurement Model

### 3.1 Assessment Structure

The instrument comprises three components:

1. A demographic and socioeconomic baseline questionnaire (13 items) administered during onboarding
2. A fixed 40-item core (anchor) assessment covering financial knowledge and attitudes
3. A 10-item Supplemental Diagnostic Module (SDM-10) selected from a pre-written item bank based on students' anchor responses

**Table 3.1: Item Distribution**

| Component | Items | Content | Scored |
| --- | --- | --- | --- |
| Baseline covariates | 13 | Demographics, financial background, debt status | No |
| Anchor knowledge items | 26 | Q1--Q14, Q29--Q40 (borrowing, investment, risk) | Yes |
| Anchor preference items | 14 | Q15--Q28 (attitudes, risk tolerance, behavior) | No |
| SDM-10 adaptive items | 10 | Selected from 156-variant item bank | Diagnostic only |

Out of the 40 anchor items, 26 are knowledge items scored as correct/incorrect and used to compute learning gains. The remaining 14 are preference items (Q15--Q28) that assess behavioral tendencies and serve as unscored covariates for heterogeneity analysis. Each anchor item is paired with a confidence rating on a 1--3 scale (low, medium, high). The combination of correctness and confidence determines whether additional diagnostic measurement is warranted in the SDM-10.

The question bank was developed by adapting and synthesizing items from established financial literacy and numeracy instruments, including the Berlin Numeracy Test, Lipkus Numeracy Scale, the "Big Three" (Lusardi and Mitchell), the FINRA National Financial Capability Study item sets, the OECD/INFE Toolkit (2022), the P-Fin Index, and related decision science instruments. An initial pool of approximately 80 candidate items was curated and refined to a 40-item anchor assessment.

### 3.2 Scoring Methodology

Knowledge items (Q1--Q14, Q29--Q40) are scored as correct/incorrect (binary). Overall percent-correct scores and domain-level percent-correct scores are computed for three instructional domains:

- **Borrowing, Interest Rates, and Financial Numeracy Knowledge** (10 items: Q1--Q10)
- **Behavioral and Risk Management Knowledge** (4 scored items: Q11--Q14)
- **Risk and Return Knowledge** (12 items: Q29--Q40)

Confidence ratings are recorded for each anchor item and used for secondary analyses (calibration and diagnostic interpretation) but do not change the primary scoring. The SDM-10 is diagnostic only and does not contribute to the student's course grade.

### 3.3 Risk Literacy Emphasis

The instrument emphasizes risk literacy as a core construct, consistent with the independent study's objectives. Risk literacy encompasses not only factual knowledge of diversification, insurance, and risk-return tradeoffs (assessed through scored knowledge items) but also students' self-assessed confidence in recognizing and managing risk (assessed through confidence ratings and preference items). The SDM-10 module provides a deeper diagnostic layer by probing whether incorrect answers on risk-related items reflect misconceptions (specific wrong mental models), knowledge gaps (absence of knowledge), or selection errors (correct understanding with wrong answer choice). This three-level diagnostic architecture -- knowledge score, confidence calibration, and open-ended classification -- enables measurement of both quantitative and qualitative dimensions of risk literacy.

The instrument is designed to be internally consistent and transferable: piloted first with Loyola University Chicago students in QUIN 102, the item bank, scoring framework, and diagnostic module are intended for adaptation to broader student populations in future work.

---

## 4. SDM-10 Diagnostic Module

### 4.1 Selection Algorithm and Need Score

The Supplemental Diagnostic Module (SDM-10) is an adaptive follow-up administered immediately after the 40-item anchor assessment. For each student, the module selects 10 items from a pre-written bank of 156 variants (6 variants per anchor knowledge item) using an information deficit model that prioritizes subcategories where the anchor response left the most residual uncertainty about the student's understanding. The SDM-10 draws only from knowledge items (Q1--Q14, Q29--Q40). Preference items (Q15--Q28) do not trigger adaptive follow-up because they assess attitudes rather than factual knowledge.

The selection algorithm computes a Need score (0--5) for each of the 26 knowledge subcategories based on three signals from the anchor response: correctness, confidence (1--3 scale), and item format (True/False vs. multiple choice). Higher Need scores indicate greater residual uncertainty. The format-aware adjustment addresses differential guessing probability: a correct True/False response with moderate confidence is assigned a higher Need (Need = 2) than the equivalent multiple-choice response (Need = 1), reflecting the 50% versus approximately 25% chance-level baseline. Incorrect responses with high confidence receive the maximum Need score (Need = 5), signaling a likely misconception requiring open-ended diagnostic follow-up.

**Table 4.1: Need Score Mapping (Correctness x Confidence x Format)**

| Confidence | Correct (MCQ) | Correct (T/F) | Incorrect (MCQ) | Incorrect (T/F) |
| --- | --- | --- | --- | --- |
| 1 (Low) | 2 | 3 | 3 | 3 |
| 2 (Mid) | 1 | 2 | 4 | 4 |
| 3 (High) | 0 | 0 | 5 | 5 |

The 10-item selection follows a three-phase procedure. Phase 1 enforces domain minimums (at least 2 items per scoring domain). Phase 2 fills remaining slots in descending Need order. Phase 3 provides fallback if fewer than 10 subcategories have Need > 0, using mastery-probing items from the strongest subcategories. Open-ended items are capped at 3 per student to limit response burden. The complete algorithm specification is presented in Appendix A.

### 4.2 Variant Types and Three-Way Classification

**Table 4.2: Variant Assignment Rules**

| Anchor Response Pattern | Assigned Variant Type | Diagnostic Goal |
| --- | --- | --- |
| Incorrect + High confidence | Open_Diagnose | Surface misconception |
| Incorrect + Mid confidence | Lower_MCQ | Test foundational understanding |
| Incorrect + Low confidence | Lower_TF | Confirm basic recognition |
| Correct + Low confidence | Open_Confirm | Verify understanding vs. guessing |
| Correct + Mid confidence | Same_MCQ | Confirm at same difficulty |
| Correct + High confidence | Higher_MCQ | Probe deeper application |

Every open-ended response is classified into one of three categories:

- **Misconception**: The student holds a specific wrong mental model (e.g., believing lower inflation means falling prices, or that insurance exists primarily for routine care). Layer 1 and Layer 2 taxonomy codes are assigned.
- **Knowledge gap**: The student lacks knowledge -- blank responses, "I don't know," or inability to articulate reasoning about the topic.
- **Selection error**: The student demonstrates correct understanding in the explanation but selected the wrong anchor answer, typically due to misreading, misclick, or True/False reversal.

This three-way classification drives differentiated instructional follow-up: misconceptions require targeted correction of the specific wrong belief, knowledge gaps require instruction from foundational principles, and selection errors flag potential item ambiguity for revision rather than student remediation.

**Misconception Taxonomy.** A two-layer taxonomy structures the classification. Layer 1 contains 37 generalizable financial literacy misconception families organized into seven categories (Appendix C). Layer 2 contains item-specific tags derived from observed student response patterns. Layer 1 codes are designed to transfer across assessment contexts and student populations.

### 4.3 AI-Assisted Scoring Pipeline

Open-ended responses are scored using GPT-4.1 (OpenAI) accessed via the OpenRouter API. The model was selected through a multi-model concordance protocol in which 11 large language models from seven providers scored the same 20 responses and were evaluated on five quality criteria: schema compliance, error rate, classification nuance, throughput, and cost (Appendix D).

Each response is processed with an item-specific prompt containing: the anchor question context, the student's selected answer and confidence level, the applicable Layer 1 misconception families with Layer 2 tags, calibration examples drawn from manually reviewed responses, and a structured decision tree for three-way classification. The model returns a structured JSON classification including diagnosis type, taxonomy codes, credit score (0/50/100 measuring diagnostic value), classification confidence (high/medium/low), an evidence quote, and a reasoning summary.

This approach follows established practices for LLM-based assessment scoring (Mizumoto & Eguchi, 2024; Yavuz, 2025) and adopts the collaborative human-AI scoring model in which the LLM serves as a second rater whose low-confidence outputs are flagged for instructor adjudication (Olivos, Kamelski, & Ascui-Gac, 2025). All item selection decisions are deterministic and rule-based; the language model is used only for open-ended response classification.

### 4.4 Diagnostic Findings

**Important caveat:** The SDM-10 open-ended items are administered only to students whose anchor responses triggered high-Need subcategories (incorrect + high confidence for diagnose, or correct + low confidence for confirm). The open-ended sample therefore reflects the tails of the confidence-accuracy distribution, not a random cross-section of the class. Misconception prevalence estimates from the SDM-10 should not be generalized to the full cohort without accounting for this conditioning.

All analyses in this section are restricted to the research-consented subset (n = 354 of 431 submitted students, 82.1%).

#### 4.4.1 Open-Ended Response Overview

Of the 354 consented students who submitted the assessment, 306 (86.4%) received at least one open-ended item, generating 781 open-ended responses. The AI scoring pipeline processed 778 of these responses with zero errors.

**Table 4.3: SDM-10 Open-Ended Summary (Consented Sample)**

| Metric | Value |
| --- | --- |
| Consented students completing SDM-10 | 354 |
| Students receiving open-ended items | 306 (86.4%) |
| Total open-ended responses | 781 |
| Responses scored by AI | 778 |
| Diagnose responses scored | 479 |
| Confirm responses scored | 299 |
| AI scoring model | GPT-4.1 (OpenAI via OpenRouter) |
| AI scoring error rate | 0 / 778 (0%) |

**Response Quality.** Among diagnose responses, 89.2% were substantive (providing reasoning beyond "I don't know" or blank responses), indicating strong student engagement with the open-ended format despite its diagnostic-only (ungraded) status. Confirm responses showed even higher quality at 93.8% substantive. This engagement rate is notable given that students were not informed that the SDM-10 was a separate module from the anchor assessment and received no grade incentive to provide detailed explanations.

#### 4.4.2 Diagnose Classification Results

**Table 4.4: Diagnose Three-Way Classification (Consented, n = 479)**

| Classification | n | % | Interpretation |
| --- | --- | --- | --- |
| Misconception | 258 | 53.9% | Active incorrect belief confirmed |
| Selection error | 153 | 31.9% | Correct understanding, wrong answer |
| Knowledge gap | 68 | 14.2% | Acknowledged uncertainty, no model |

Over half of diagnose responses (53.9%) reflected identifiable misconceptions -- specific wrong mental models that can be targeted through instruction. Nearly a third (31.9%) were selection errors, meaning the student demonstrated correct understanding in the explanation despite selecting the wrong anchor answer. This is a central finding: among students who answered incorrectly with high confidence (the SDM-10 diagnose trigger condition), almost one in three does not hold a misconception at all, but rather experienced a mismatch between their knowledge and the item format or phrasing. These rates reflect the high-confidence-incorrect subsample, not the full class (see Section 4.4 caveat).

**Table 4.5: Diagnose Classification by Item (Consented, items with n >= 5, sorted by diagnose volume)**

| Item | Subdomain | n | Misc. | Misc.% | KG | SE | SE% | Top Tag |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Q7 | Inflation (Fixed Income) | 54 | 34 | 63% | 5 | 14 | 26% | older_workers_worst |
| Q6 | Inflation (Lowering) | 53 | 42 | 79% | 4 | 6 | 11% | lower_inflation_means_lower_prices |
| Q36 | Diversification Principle | 42 | 6 | 14% | 2 | 34 | 81% | SE-reversal |
| Q10 | Credit Reports | 39 | 16 | 41% | 7 | 16 | 41% | SE-selfcorrect |
| Q8 | Auto Loans | 34 | 19 | 56% | 4 | 10 | 29% | down_payment_only |
| Q5 | Emergency Fund | 31 | 15 | 48% | 1 | 8 | 26% | one_month_sufficient |
| Q12 | Health Insurance Purpose | 28 | 23 | 82% | 1 | 4 | 14% | routine_care_primary |
| Q29 | Interest Rates & Bonds | 24 | 11 | 46% | 8 | 4 | 17% | positive_correlation_belief |
| Q2 | Borrowing/Mortgages | 22 | 7 | 32% | 8 | 7 | 32% | monthly_vs_total_confusion |
| Q13 | Insurance Deductible | 19 | 10 | 53% | 6 | 3 | 16% | deductible_is_max_payout |
| Q30 | Risk-Return Tradeoff | 17 | 14 | 82% | 1 | 0 | 0% | exceptions_disprove_rule |
| Q37 | Insurance Types | 17 | 7 | 41% | 3 | 7 | 41% | SE-selfcorrect |
| Q38 | Inflation Protection | 14 | 7 | 50% | 2 | 5 | 36% | fixed_bond_best |
| Q11 | Stock vs. Mutual Fund | 13 | 4 | 31% | 7 | 2 | 15% | KG-unfamiliar |
| Q3 | Inflation (Definition) | 13 | 4 | 31% | 3 | 6 | 46% | SE-reversal |
| Q32 | Long-Term Returns | 11 | 8 | 73% | 1 | 2 | 18% | bonds_safest_therefore_best |
| Q31 | Stock Market Function | 10 | 6 | 60% | 1 | 3 | 30% | wealth_creation_primary |
| Q35 | Risk-Return Relationship | 9 | 7 | 78% | 0 | 2 | 22% | real_world_counterexample |
| Q39 | Stocks vs. Bonds Risk | 9 | 5 | 56% | 2 | 2 | 22% | some_bonds_risky_too |
| Q14 | Diversification | 7 | 2 | 29% | 0 | 5 | 71% | SE-selfcorrect |
| Q9 | Budgeting | 6 | 1 | 17% | 0 | 5 | 83% | SE-selfcorrect |
| Q40 | 2008 Financial Crisis | 6 | 3 | 50% | 1 | 2 | 33% | SE-reversal |
| Q1 | Compound Interest | 5 | 3 | 60% | 1 | 0 | 0% | interest_as_fee |

Items with the highest misconception density (> 70%) are Q12 (Health Insurance, 82%), Q30 (Risk-Return Tradeoff, 82%), Q6 (Inflation Lowering, 79%), Q35 (Risk-Return, 78%), and Q32 (Long-Term Returns, 73%). These represent topics where student errors are overwhelmingly driven by active incorrect beliefs rather than confusion or carelessness, and where instructional intervention will have the greatest impact. Items with the highest selection error rates are Q9 (83%, small n), Q36 (81%), Q14 (71%), and Q3 (46%), all sharing True/False format with negative or double-negative phrasing.

#### 4.4.3 Confirm Classification Results

**Table 4.6: Confirm Three-Way Classification (Consented, n = 299)**

| Classification | n | % |
| --- | --- | --- |
| Verified | 140 | 46.8% |
| Partial | 119 | 39.8% |
| Likely guess | 40 | 13.4% |

Among students who answered correctly but with low confidence (the SDM-10 confirm trigger condition), 46.8% demonstrated genuine understanding in their explanation (verified), 39.8% showed partial understanding, and 13.4% were classified as likely guesses -- their explanations showed no understanding of the underlying concept despite selecting the correct answer. Because confirm items are triggered only for low-confidence correct answers, the 13.4% guess rate applies to that conditioned subsample, not to all correct responses. Nonetheless, this finding validates the SDM-10's approach of probing low-confidence correct answers: on items where guessing is plausible, anchor scores alone overestimate true comprehension.

**Table 4.7: Confirm Items with Highest Likely-Guess Rates (Consented, confirm n >= 5)**

| Item | Subdomain | Confirm n | Guess n | Guess % |
| --- | --- | --- | --- | --- |
| Q29 | Interest Rates & Bonds | 12 | 4 | 33.3% |
| Q13 | Insurance Deductible | 22 | 7 | 31.8% |
| Q10 | Credit Reports | 15 | 4 | 26.7% |
| Q8 | Auto Loans | 13 | 3 | 23.1% |
| Q11 | Stock vs. Mutual Fund | 26 | 6 | 23.1% |
| Q30 | Risk-Return Tradeoff | 10 | 2 | 20.0% |
| Q37 | Insurance Types | 10 | 2 | 20.0% |

Q29 (Bonds & Interest Rates) and Q13 (Insurance Deductible) have the highest guess rates among correct respondents. These topics may warrant additional instructional attention despite appearing well-understood based on raw anchor scores alone.

**Table 4.8: Credit Score Distribution (All Consented Scored, n = 778)**

| Credit Score | n | % |
| --- | --- | --- |
| 100 (full diagnostic value) | 541 | 69.5% |
| 50 (partial diagnostic value) | 129 | 16.6% |
| 0 (no diagnostic value) | 108 | 13.9% |

#### 4.4.4 Misconception Analysis by Domain

The AI-assisted classification revealed distinct misconception patterns across assessment domains. All per-item rates below are conditional on the SDM-10 diagnose trigger (incorrect + high confidence); they characterize the composition of high-confidence errors, not class-wide misconception prevalence.

**Inflation and Purchasing Power.** The most prevalent misconception was INF-01 (lower inflation equals falling prices), identified in 42 consented diagnose responses -- the single most frequent misconception code in the dataset. Students systematically confused a decrease in the rate of price increase with an actual decrease in prices. On Q7 (which group is most hurt by inflation), empathy-driven reasoning (INF-05, n = 17) led students to select "young couples" because they identified personally with that demographic rather than analyzing fixed-income vulnerability.

**Risk, Return, and Diversification.** On Q36 (diversification principle), 81.0% of diagnose responses from consented students were classified as selection errors -- the highest selection error rate of any item. Students who answered incorrectly could explain why spreading money across assets reduces risk, but selected "False" on the True/False item, likely due to negation confusion or overthinking the word "all." On Q35 (risk-return relationship), students used real-world counterexamples from non-financial domains to argue against the general financial principle (RISK-10), indicating reasoning by analogy rather than domain-specific knowledge.

**Insurance and Risk Management.** On Q12 (primary purpose of health insurance), 82.1% of diagnose responses reflected the misconception that routine care is the primary function of insurance (INS-01, n = 23 of 28), with many students applying frequency-over-severity reasoning: because routine visits are more common, they must be the primary purpose (INS-02). Q13 (deductible definition) showed a high knowledge gap rate (31.6%), indicating unfamiliarity with this technical insurance term rather than a specific misconception.

**Borrowing and Credit.** Credit report knowledge (Q10) showed a 41.0% selection error rate, indicating that many students possessed the correct understanding but were confused by the question's "which is FALSE" framing. On Q2 (mortgage term length and total interest), 31.8% of incorrect responses were selection errors.

**Table 4.9: Top 10 Misconception Codes (Consented Diagnose Responses)**

| Code | Misconception Family | n |
| --- | --- | --- |
| INF-01 | Lower inflation = falling prices | 42 |
| INT-05 | Interest rates not negotiable | 19 |
| INS-01 | Insurance for routine care | 18 |
| INF-05 | Empathy-driven inflation reasoning | 17 |
| INF-03 | Fixed income impact misunderstood | 17 |
| RISK-02 | Exceptions disprove general rule | 16 |
| BORROW-05 | Emergency fund amount too low | 14 |
| BORROW-03 | Employer credit check unknown | 12 |
| INT-06 | Bond price-interest rate relationship reversed | 11 |
| INS-03 | Deductible definition wrong | 10 |

#### 4.4.5 Selection Error Patterns

The selection error finding is one of the paper's central contributions. Three items showed selection error rates exceeding 30%:

**Table 4.10: High Selection Error Items (Consented Diagnose)**

| Item | Topic | Format | SE Rate | n | Implication |
| --- | --- | --- | --- | --- | --- |
| Q36 | Diversification principle | T/F | 81.0% | 34/42 | T/F format confounds; consider MCQ revision |
| Q10 | Credit reports (which is FALSE) | MCQ | 41.0% | 16/39 | Negation framing causes errors |
| Q37 | Insurance types | MCQ | 41.2% | 7/17 | Item phrasing ambiguity |
| Q2 | Mortgage term and total interest | T/F | 31.8% | 7/22 | T/F reversal common |

**The Q36 case study.** Q36 merits special attention. This True/False item asks whether placing savings in multiple locations (bank, stocks, and bonds) is safer than putting all savings in one place. The correct answer is True. Among consented students, 127 of 354 (35.9%) answered incorrectly. When the SDM-10 probed 42 of the diagnosed students who were both incorrect and confident, 34 (81%) demonstrated correct understanding of diversification. Typical student explanations confirmed they understood the principle of spreading risk across asset classes but had misread or second-guessed the question. The evidence strongly suggests the True/False format or negative phrasing, rather than a lack of knowledge, caused the errors. Q36 should be revised for the post-assessment: the question can be rephrased as a standard multiple-choice item to reduce format-induced errors.

These findings demonstrate that raw MCQ scores materially understate student knowledge on these items. When a student answers incorrectly but explains the concept correctly, the anchor score of 0% misrepresents their understanding.

#### 4.4.6 Validation Against Manual Analysis

Prior to AI scoring, a manual analysis of response patterns was conducted on a calibration sample. Table 4.11 compares the predicted dominant misconception rates from manual analysis with the AI-scored results for the consented sample.

**Table 4.11: Manual Prediction vs. AI Scoring Results (Consented Sample)**

| Item | Metric | Predicted | Actual | Assessment |
| --- | --- | --- | --- | --- |
| Q6 | lower_inflation_means_lower_prices | 78% | 56% | Confirmed. AI distributed more to employment_link (21%). |
| Q36 | Selection error rate | 62% | 81% | Confirmed. Higher than predicted. |
| Q10 | employer_use_confusion | 33% | 31% | Near-exact match. |
| Q12 | routine_care_primary | 64% | 56% | Confirmed. Slight redistribution to frequency_over_severity. |
| Q30 | exceptions_disprove_rule | 67% | 71% | Confirmed. Slightly higher than predicted. |

All five validation benchmarks were confirmed. Three showed exact or near-exact alignment (Q10, Q30, Q12), and two showed the AI distributing classifications more granularly across subtags within the same misconception family (Q6, Q36). The taxonomy is performing as designed: the scoring model produces classifications consistent with human-defined categories while offering finer-grained discrimination within misconception families.

#### 4.4.7 Cross-Item Patterns

Five dominant patterns emerged across the assessment:

1. **Inflation mechanics confusion** -- centered on the distinction between lower inflation rates and lower prices (Q6, Q7), representing the single largest misconception cluster
2. **Risk-return reasoning from exceptions** -- students cited specific counterexamples to invalidate general financial principles (Q30, Q35), applying inductive reasoning where deductive understanding is required
3. **Insurance purpose confusion** -- equating frequency of use with primary function (Q12), reflecting a consumer experience bias
4. **Empathy-driven financial reasoning** -- selecting answers based on personal identification with demographic groups rather than economic logic (Q7)
5. **Format-induced errors** -- particularly on True/False items (Q36, Q2) where correct knowledge led to incorrect answers due to negation confusion or reversed logic

---

## 5. Platform and Governance Design

### 5.1 Technology Stack

The assessment is administered through a dedicated web platform -- the Financial Literacy Toolkit -- developed for this study. The platform is built on Next.js 14 (App Router) with PostgreSQL 15 as the data store, accessed through PgBouncer connection pooling to support concurrent users. The complete source code is publicly available in the project repository (Bolivard, 2026).

### 5.2 Student Authentication and Data Minimization

Students access the platform by entering their course code and student ID. The platform immediately transforms each student ID into a one-way cryptographic hash (SHA-256 with a per-course pepper) and discards the raw identifier; all subsequent data storage and analysis use only the hashed key. No raw student ID numbers, names, email addresses, or other personally identifiable information are stored in the research dataset. The per-course pepper isolates student hashes across courses, preventing cross-course linkage. Age is collected as a categorical range rather than exact date of birth, and geographic identifiers are not collected.

### 5.3 Consent Mechanics

The platform implements a two-part consent flow before data collection:

1. **Course requirement acknowledgment (mandatory).** Students review and acknowledge that the assessment is a required course assignment and that their answers are not graded for correctness.

2. **Research consent (voluntary).** Students are presented with a separate research consent screen asking whether their de-identified responses may be used for research evaluating course learning outcomes. The screen explicitly states that declining has no impact on grades, course standing, or access to feedback. The consent decision, timestamp, and version identifier are recorded. Students may withdraw research consent at any time; withdrawn data are excluded from subsequent analyses.

The consent flow structurally separates the course requirement from the research opt-in: a student can complete the assessment (fulfilling the course obligation) without consenting to research use. This separation is the primary safeguard of voluntariness. A privacy notice displayed during onboarding describes the hashing process, data separation, and the student's right to withdraw.

**Consent accounting.** Of the 431 students who submitted completed assessments, 354 (82.1%) provided affirmative research consent. Zero students explicitly declined. The remaining 77 (17.9%) have a NULL consent status because they completed the assessment during the first days of the assessment window before the research consent screen was deployed in the platform. Following standard research ethics practice, students with NULL consent are treated as non-consented for all research analyses -- absence of affirmative consent is treated as non-consent, regardless of the reason.

**Representativeness check.** The consented subsample (n = 354) closely mirrors the full cohort (N = 431). The consented group has a mean anchor score of 65.8% (full cohort: 66.3%), and diagnostic classification distributions within 1 percentage point of the full-cohort values across all categories. The 77 non-consented students are not systematically different on observable assessment characteristics, indicating that the NULL-consent cohort reflects deployment timing rather than a self-selected subgroup.

All analyses in this paper use only the research-consented subset (n = 354). For instructional purposes, all 431 students receive SDM-10 diagnostics and dashboard feedback regardless of consent status; consent governs only research publication, not educational use.

---

## 6. Pilot Operations and Descriptive Statistics

This section reports operational statistics from the pre-course assessment window (February 2--9, 2026) as quality assurance context for interpreting the SDM-10 diagnostic findings. These are descriptive operational summaries of assessment administration, not inferential research results. No subgroup comparisons, hypothesis tests, or claims about population parameters are made in this section. Subgroup analyses require IRB approval and are deferred to Paper 2.

### 6.1 Participation and Completion

A total of 443 students onboarded onto the platform, of whom 431 submitted completed assessments, yielding a completion rate of 97.3%. Twelve students abandoned the assessment without submission; all abandoned sessions had been idle for more than 45 hours at the time of window closure. All 431 students who submitted the anchor assessment also completed the SDM-10 module (100% SDM completion rate among submitters).

The following demographic summary describes the composition of the consented sample for operational context only. No subgroup performance comparisons are reported in Paper 1.

**Table 6.1: Sample Demographics (Consented, n = 354)**

| Characteristic | n | % |
| --- | --- | --- |
| Female | 213 | 60.2% |
| Male | 139 | 39.3% |
| Prefer not to say | 2 | 0.6% |
| English first language | 278 | 78.5% |
| Spanish first language | 44 | 12.4% |
| Other languages | 32 | 9.0% |

### 6.2 Anchor Score Context

The following score summaries provide operational context for interpreting SDM-10 diagnostic patterns. They are not inferential claims about population-level financial literacy.

For the consented subset (n = 354), the mean anchor score was 65.8% (SD = 16.4%, median = 66.7%) across 26 scored knowledge items. Domain-level means were:

**Table 6.2: Mean Accuracy by Domain (Consented, n = 354)**

| Domain | Items | Mean % Correct |
| --- | --- | --- |
| Behavioral and Risk Management Knowledge | 4 | 72.2% |
| Borrowing, Interest Rates, and Financial Numeracy Knowledge | 10 | 69.2% |
| Risk and Return Knowledge | 12 | 63.5% |

Investment and Risk was the weakest domain, driven primarily by low performance on Q38 (Inflation Protection) and Q6 (Inflation Lowering). However, Investment and Risk also has the highest selection error count (56), suggesting some of this weakness is artefactual.

**Table 6.3: Score Distribution by Performance Band (Consented, n = 354)**

| Band | n | % of Sample | Status |
| --- | --- | --- | --- |
| Below 50% | 38 | 10.7% | At risk |
| 50--69% | 186 | 52.5% | Developing |
| 70--79% | 65 | 18.4% | Proficient |
| 80% and above | 65 | 18.4% | Strong |

The largest segment (52.5%) falls in the 50--69% band, indicating that over half the consented sample has partial but incomplete financial literacy knowledge.

The consented SDM-10 mean score (64.37% across 3,340 responses) was lower than the anchor mean, confirming that the adaptive selection algorithm appropriately targeted subcategories where students demonstrated weaker performance. These scores provide context for interpreting the SDM-10 diagnostic findings but are not the primary analytical contribution of this paper.

### 6.3 Assessment Duration

The median assessment duration was 18.1 minutes (consented subset). The mean duration (217.2 minutes) was heavily skewed by a small number of sessions left open without completion, including sessions that remained idle for multiple days. The median is the more representative measure of active assessment time.

---

## 7. Discussion

The SDM-10 diagnostic findings reveal that standard multiple-choice assessment scores both overstate and understate student financial literacy knowledge in systematic, measurable ways. As noted in Section 4.4, all SDM-10 prevalence rates reported below reflect conditioned subsamples -- diagnose items target students who answered incorrectly with high confidence, and confirm items target students who answered correctly with low confidence -- not random cross-sections of the class. The rates characterize what happens within those tails, not class-wide misconception prevalence.

**Selection errors materially distort MCQ scoring.** The most striking finding is the magnitude of selection errors: among students who answered incorrectly with high confidence, 31.9% demonstrated correct understanding of the underlying concept in their open-ended explanation. On individual items, selection error rates reached 81% (Q36, diversification principle), 41% (Q10, credit reports), and 32% (Q2, mortgages). These students would receive a score of zero on the anchor assessment despite possessing the targeted knowledge. Without the open-ended diagnostic follow-up, these errors would be indistinguishable from genuine misconceptions, leading to misallocation of instructional resources toward remediation that students do not need. The pattern is concentrated on True/False items and negation-framed MCQ items, suggesting that item format rather than student knowledge drives the errors. This finding has direct implications for instrument revision: Q36 should be rewritten in multiple-choice format, and Q10's "which is FALSE" framing should be reconsidered.

**"False correct" guesses inflate anchor scores.** On the confirm side, among students who answered correctly but with low confidence (the SDM-10 confirm trigger), 13.4% were classified as likely guesses -- they could not articulate any understanding of the concept they ostensibly answered correctly. This rate applies to the low-confidence-correct tail, not to all correct responses, but it demonstrates that a non-trivial fraction of ostensibly correct answers do not reflect genuine understanding. On individual items with high guessing probability, anchor scores overestimate true comprehension.

**Misconception patterns are domain-specific and instructionally actionable.** Within the high-confidence-incorrect subsample targeted by the SDM-10, five dominant misconception clusters emerged (inflation mechanics confusion, risk-return reasoning from exceptions, insurance purpose confusion, empathy-driven reasoning, and format-induced errors). These clusters are specific enough to inform targeted instructional interventions. For example, the finding that students who were confident and wrong on Q6 systematically confuse "lower inflation" with "falling prices" (INF-01, the most frequent misconception) suggests that QUIN 102 should dedicate explicit instructional time to distinguishing rate of change from level -- a distinction that is foundational to understanding monetary policy but counter-intuitive to many students. Because the SDM-10 selects for high-Need responses, these misconception rates should not be extrapolated to the full class without adjusting for item-level coverage (see Limitation 2).

**The three-way classification adds diagnostic value beyond MCQ scores.** Traditional MCQ instruments classify responses into only two categories (correct/incorrect). The SDM-10's three-way classification (misconception/knowledge gap/selection error for diagnose; verified/partial/likely guess for confirm) provides the diagnostic specificity needed to differentiate students who need conceptual correction from those who need format remediation or foundational instruction. This distinction is not available from the anchor score alone and represents the instrument's primary contribution to measurement methodology in financial literacy evaluation.

**Instructional targeting.** The item-level diagnostic data enable prioritized instructional interventions. The following rates are conditional on the SDM-10 trigger (incorrect + high confidence) and reflect the composition of errors within that subsample, not class-wide misconception prevalence. Critical priority targets include inflation mechanics (Q6, Q7), where 79% and 63% of diagnosed responses respectively revealed active misconceptions centered on the rate-versus-level confusion, and health insurance purpose (Q12), where 82% of diagnosed responses reflected the misconception that routine care is the primary function of insurance. High priority targets include risk-return reasoning (Q30, Q35), where the exceptions-disprove-rule pattern indicates a reasoning error about statistical relationships rather than a content knowledge gap, and auto loan factors (Q8), where students recognize individual factors but do not understand their interaction. Items with high selection error rates (Q36, Q9, Q14) require item revision rather than instructional intervention -- the students already understand the material.

**Implications for risk literacy measurement.** The instrument's emphasis on risk-related items (diversification, insurance, risk-return tradeoffs, crisis awareness) combined with the SDM-10 diagnostic layer provides a richer assessment of risk literacy than traditional knowledge-only measures. The finding that students can often articulate correct risk reasoning but select wrong answers (particularly on diversification items) suggests that the gap between students' conceptual understanding and their ability to translate that understanding into correct MCQ responses is larger in the risk domain than in other domains.

---

## 8. Limitations

Several limitations should be noted when interpreting these findings.

1. **No causal claims.** This paper reports instrument design and pilot diagnostic outputs from a single pre-course assessment. No causal claims about instructional effectiveness can be made from Paper 1. Causal analysis requires paired pre-post data, which will be reported in Paper 2.

2. **SDM subsample conditioning.** The SDM-10 open-ended items are administered only to students whose anchor responses triggered high-Need subcategories (incorrect + high confidence, or correct + low confidence). Misconception prevalence estimates reflect the tails of the confidence-accuracy distribution, not a random cross-section. Per-item coverage ranges from approximately 20% (Q32) to 90% (Q7). Extrapolation to the full cohort is only appropriate when item-level coverage exceeds 50%.

3. **Single scoring model.** All open-ended responses were classified by a single LLM (GPT-4.1). While the model was selected through an 11-model concordance protocol (Appendix D) and achieved zero schema violations and zero parse errors across 778 consented responses, automated classification may diverge from human judgment on borderline cases. The model assigned "high" confidence to 96.8% of classifications, which may indicate underutilization of the uncertainty channel. A human-AI agreement study on a stratified subsample would strengthen reliability evidence.

4. **No publishable subgroup claims.** The pre-course assessment collected demographic and financial background data, but subgroup analyses (e.g., by gender, race/ethnicity, first-generation status) are deferred to Paper 2. Paper 1 does not report subgroup comparisons because the study has not yet received institutional review board approval for human-subjects research.

5. **Possible lookup between anchor and SDM.** The SDM-10 is administered immediately after the anchor assessment in the same session. Students may look up answers between the anchor and SDM items, potentially inflating SDM scores. The 100% SDM completion rate and the lower SDM mean score (64.37% vs. 65.8% anchor) provide some evidence against widespread lookup behavior, but the possibility cannot be excluded.

6. **Consent attrition.** Seventy-seven students (17.9% of the cohort) have NULL consent status because they completed the assessment before the research consent screen was deployed. Zero students explicitly declined. The NULL cohort is excluded from all research analyses per standard practice (absence of affirmative consent is treated as non-consent). A representativeness check (Section 5.3) shows the consented sample is similar to the full cohort on score distribution and classification distributions, so consent-related selection bias is unlikely. However, the reduction from 431 to 354 students slightly reduces statistical power for item-level analyses with small cell sizes.

7. **Legacy submission types.** Legacy submission types resulting from technical adjustments during the first days of the assessment window account for approximately 20% of submissions. These were reviewed and retained but may affect comparability for a subset of respondents.

8. **Variant assignment mismatch.** A software defect caused 40 mismatched SDM variant assignments across 36 students due to a stale anchor score synchronization issue. The mismatched responses were identified and filtered from the analysis using an anchor_score and confidence cross-check. The bug was subsequently fixed, and the misconception taxonomy is unaffected because all analyzed responses were verified to correspond to correctly triggered variants.

---

## 9. Paper 2: IRB-Approved Pre-Post Study Protocol

The following analyses are planned for Paper 2, contingent on institutional review board approval for human-subjects research:

1. **Post-course assessment administration.** The post-course assessment will be administered during the last week of the Spring 2026 semester, using the same 40-item anchor assessment and SDM-10 module.

2. **Pre-post paired analyses for RQ1.** Learning gains will be computed as the difference between post-course and pre-course scores for each student, overall and by domain. Paired t-tests (or nonparametric equivalents) will assess the statistical significance of mean gains. Standardized effect sizes (within-student Cohen's d) will be reported.

3. **Multivariable regression for RQ2.** Heterogeneity in learning gains will be modeled as a function of baseline covariates, including demographics, financial background, work status, financial stress, self-rated knowledge, prior product experience, and preference-item responses (Q15--Q28). Domain-specific models will identify whether predictors of learning gains differ across borrowing, investment, and risk management.

4. **Psychometric validation.** Exploratory Factor Analysis will assess dimensionality within and across domains. Cronbach's alpha will evaluate internal consistency. Item-level statistics will identify items for refinement in future administrations.

5. **Subgroup analyses.** Demographic and financial background subgroup comparisons (by gender, race/ethnicity, first-generation status, work experience, financial stress) will be reported with appropriate transparency practices for multiple comparisons.

6. **SDM-10 pre-post comparison.** Pre-post changes in misconception prevalence, selection error rates, and the distribution of three-way classifications will be analyzed to assess whether instruction reduces specific misconception clusters and improves the alignment between student knowledge and item responses.

Paper 2 will combine the pre-course baseline with post-course results, learning gains analysis, heterogeneity models, and psychometric validation into a comprehensive evaluation of QUIN 102's association with student financial literacy outcomes.

---

## References

Akers, B., & Chingos, M. M. (2014). *Are college students borrowing blindly?* Brookings Institution.

Allgood, S., & Walstad, W. B. (2016). The effects of perceived and actual financial literacy on financial behaviors. *Economic Inquiry*, *54*(1), 675--697.

Chen, H., & Volpe, R. P. (1998). An analysis of personal financial literacy among college students. *Financial Services Review*, *7*(2), 107--128.

Fernandes, D., Lynch, J. G., Jr., & Netemeyer, R. G. (2014). Financial literacy, financial education, and downstream financial behaviors. *Management Science*, *60*(8), 1861--1883.

Flodén, J. (2025). Grading exams using large language models: A comparison between human and AI grading of exams in higher education using ChatGPT. *British Educational Research Journal*, *51*(1), 201--224.

Goyal, K., & Kumar, S. (2021). Financial literacy: A systematic review and bibliometric analysis. *International Journal of Consumer Studies*, *45*(1), 80--105.

Hastings, J. S., Madrian, B. C., & Skimmyhorn, W. L. (2013). Financial literacy, financial education, and economic outcomes. *Annual Review of Economics*, *5*, 347--373.

Huston, S. J. (2010). Measuring financial literacy. *Journal of Consumer Affairs*, *44*(2), 296--316.

Ipatova, E., & Merheb, K. (2023). Re-examining the Dunning-Kruger effect: Objective vs. subjective financial literacy in the young and overconfident (SSRN Working Paper No. 4645450).

Kaiser, T., Lusardi, A., Menkhoff, L., & Urban, C. (2022). Financial education affects financial knowledge and downstream behaviors. *Journal of Financial Economics*, *145*(2), 255--272.

Kramer, M. M. (2016). Financial literacy, confidence and financial advice seeking. *Journal of Economic Behavior & Organization*, *131*(Part A), 198--217.

Lusardi, A. (2019). Financial literacy and the need for financial education: Evidence and implications. *Swiss Journal of Economics and Statistics*, *155*, Article 1.

Lusardi, A., & Mitchell, O. S. (2014). The economic importance of financial literacy: Theory and evidence. *Journal of Economic Literature*, *52*(1), 5--44.

Lusardi, A., & Tufano, P. (2015). Debt literacy, financial experiences, and overindebtedness. *Journal of Pension Economics and Finance*, *14*(4), 332--368.

Mandell, L., & Klein, L. S. (2009). The impact of financial literacy education on subsequent financial behavior. *Journal of Financial Counseling and Planning*, *20*(1), 15--24.

Mizumoto, A., & Eguchi, M. (2024). Large language models and automated essay scoring of English language learner writing: Insights into validity and reliability. *Computers and Education: Artificial Intelligence*, *6*, 100208.

OECD. (2022). *OECD/INFE toolkit for measuring financial literacy and financial inclusion 2022*. OECD Publishing.

Olivos, F., Kamelski, T., & Ascui-Gac, S. (2025). Assessing instructor-AI cooperation for grading essay-type questions in an introductory sociology course. *Teaching Sociology*. Advance online publication. https://doi.org/10.1177/0092055X251397371

Porto, N., & Xiao, J. J. (2016). Financial literacy overconfidence and financial advice seeking. *Journal of Financial Service Professionals*, *70*(4), 78--88.

Robb, C. A., & Woodyard, A. (2011). Financial knowledge and best practice behavior. *Journal of Financial Counseling and Planning*, *22*(1), 60--70.

Stango, V., & Zinman, J. (2009). Exponential growth bias and household finance. *Journal of Finance*, *64*(6), 2807--2849.

van Rooij, M., Lusardi, A., & Alessie, R. (2011). Financial literacy and stock market participation. *Journal of Financial Economics*, *101*(2), 449--472.

Wagner, J., & Walstad, W. B. (2019). The effects of financial education on short-term and long-term financial behaviors. *Journal of Consumer Affairs*, *53*(1), 234--259.

Willis, L. E. (2011). The financial education fallacy. *American Economic Review*, *101*(3), 429--434.

Yavuz, F. (2025). Utilizing large language models for EFL essay grading: An examination of reliability and validity in rubric-based assessments. *British Journal of Educational Technology*, *56*(2), 487--506.

---

## Declaration of AI and AI-Assisted Technologies

This study employed AI tools in three capacities, disclosed here in accordance with current best-practice guidelines for transparency in academic publishing.

1. **Assessment platform development.** AI-assisted coding tools (GitHub Copilot, Claude Code) were used during development of the web-based assessment platform to accelerate implementation of the user interface, data collection logic, and adaptive routing algorithm. All platform functionality was independently tested and validated by the research team prior to deployment. The complete source code is publicly available for inspection in the project repository (Bolivard, 2026).

2. **Open-ended response scoring.** GPT-4.1 (OpenAI), accessed via the OpenRouter API, served as the automated scoring engine for classifying open-ended student responses into the three-way taxonomy (misconception, knowledge gap, selection error). The model was selected from among 11 candidate LLMs through a multi-model concordance protocol (Appendix D). The scoring rubric, item-specific prompts, misconception taxonomy, and calibration examples were developed entirely by the research team based on manual analysis of student responses. Low-confidence classifications were flagged for human adjudication by the course instructor. This methodological use of LLM-based scoring follows established practices in educational assessment (Mizumoto & Eguchi, 2024; Yavuz, 2025) and is detailed in Section 4.3.

3. **Manuscript preparation.** Generative AI tools assisted with drafting, editing, and formatting portions of this manuscript. All content was reviewed, revised, and verified by the authors, who take full responsibility for the accuracy and integrity of the publication.

---

## Appendix A: SDM-10 Selection Algorithm and Burden Controls

### Table A.1: SDM-10 Selection and Burden Controls

| Control | Rule |
| --- | --- |
| SDM size | Fixed 10 items after the 40 anchor questions |
| Selection basis | Ranked by Need score (0--5) at subcategory level |
| Domain balance | At least 2 items per domain (borrowing/credit, investment, risk management) |
| Subcategory cap | Max 2 SDM items per subcategory |
| Open-ended cap | Max 3 open-ended items per student |
| Format fallback | When open-ended cap reached: Open_Diagnose → Lower_MCQ, Open_Confirm → Same_MCQ |
| Item source | Pre-written 156-variant item bank only; no generated questions |
| Grading | SDM-10 is diagnostic only; grade from 40 anchors only |
| Primary outcomes | RQ1/RQ2 use 26 anchor knowledge items; SDM-10 is secondary diagnostic output |

### Table A.2: Need Score Mapping (Correctness x Confidence x Format)

The Need score quantifies residual uncertainty about a student's understanding in each subcategory. Higher values indicate greater need for diagnostic follow-up. The format-aware adjustment reflects differential guessing probability (50% for True/False vs. ~25% for MCQ).

| Confidence | Correct (MCQ) | Correct (T/F) | Incorrect (MCQ) | Incorrect (T/F) |
| --- | --- | --- | --- | --- |
| 1 (Low) | 2 | 3 | 3 | 3 |
| 2 (Mid) | 1 | 2 | 4 | 4 |
| 3 (High) | 0 | 0 | 5 | 5 |

### Table A.3: Variant Type Assignment Rules

| Anchor Pattern | Variant Type | Format | Diagnostic Goal |
| --- | --- | --- | --- |
| Incorrect + High confidence | Open_Diagnose | Open-ended | Surface and classify misconception |
| Incorrect + Mid confidence | Lower_MCQ | Multiple choice | Test foundational understanding |
| Incorrect + Low confidence | Lower_TF | True/False | Confirm basic concept recognition |
| Correct + Low confidence | Open_Confirm | Open-ended | Verify understanding vs. lucky guess |
| Correct + Mid confidence | Same_MCQ | Multiple choice | Confirm at parallel difficulty |
| Correct + High confidence | Higher_MCQ | Multiple choice | Probe deeper application |

### Table A.4: Three-Phase Selection Algorithm

| Phase | Purpose | Logic |
| --- | --- | --- |
| Phase 1: Domain minimums | Ensure coverage | Select top-Need item from each domain until each has >= 2 items |
| Phase 2: Need-based filling | Maximize diagnostic value | Fill remaining slots in descending Need order with 5-level tiebreaker |
| Phase 3: Mastery fallback | Avoid empty slots | If fewer than 10 subcategories have Need > 0, add mastery-probing items from strongest subcategories |

### Table A.5: Tiebreaker Hierarchy (When Need Scores Are Equal)

| Priority | Criterion | Rule |
| --- | --- | --- |
| 1 | Domain deficit | Favor domain with fewer items already selected |
| 2 | Format priority | True/False prioritized over MCQ (reduces guessing) |
| 3 | Subcategory spread | Max 2 items per subcategory |
| 4 | Domain order | Borrowing → Investment → Risk Management |
| 5 | Seeded random | Deterministic tie resolution using student hash |

### Table A.6: Three-Way Classification Decision Tree

| Step | Condition | Classification |
| --- | --- | --- |
| 1 | Blank, "I don't know," or too short to interpret? | Knowledge gap |
| 2 | Correct reasoning despite wrong anchor answer? | Selection error |
| 3 | Student self-corrects in explanation? | Selection error |
| 4 | Specific wrong mental model identified? | Misconception (assign Layer 1 + Layer 2 codes) |
| 5 | Vague reasoning, no identifiable pattern? | Knowledge gap |

---

## Appendix B: Assessment Items (Full Question Bank)

### Table B.1: Assessment Questions with Categories and Subcategories

Q15--Q28 are preference items (unscored).

| Category | Subcategory | Count | Q# | Scored |
| --- | --- | --- | --- | --- |
| Baseline Covariates | Demographic Characteristics | 5 | B1--B5 | -- |
| Baseline Covariates | Financial Background & Context | 5 | B6--B10 | -- |
| Baseline Covariates | Debt status | 2 | B11--B13 | -- |
| Borrowing, Interest Rates, and Financial Numeracy Knowledge | Compound Interest | 1 | Q1 | Yes |
| Borrowing, Interest Rates, and Financial Numeracy Knowledge | Borrowing/Mortgages | 1 | Q2 | Yes |
| Borrowing, Interest Rates, and Financial Numeracy Knowledge | Inflation | 3 | Q3, Q6, Q7 | Yes |
| Borrowing, Interest Rates, and Financial Numeracy Knowledge | Borrowing/Interest | 1 | Q4 | Yes |
| Borrowing, Interest Rates, and Financial Numeracy Knowledge | Saving | 1 | Q5 | Yes |
| Borrowing, Interest Rates, and Financial Numeracy Knowledge | Borrowing | 1 | Q8 | Yes |
| Borrowing, Interest Rates, and Financial Numeracy Knowledge | Earning | 1 | Q9 | Yes |
| Borrowing, Interest Rates, and Financial Numeracy Knowledge | Borrowing/Credit | 1 | Q10 | Yes |
| Behavioral and Risk Management Knowledge | Risk Diversification | 2 | Q11, Q14 | Yes |
| Behavioral and Risk Management Knowledge | Insurance | 2 | Q12, Q13 | Yes |
| Behavioral and Risk Management Knowledge | Allocation Preference | 1 | Q15 | No |
| Behavioral and Risk Management Knowledge | Loss Aversion | 1 | Q16 | No |
| Behavioral and Risk Management Knowledge | Risk Perception | 1 | Q17 | No |
| Behavioral and Risk Management Knowledge | Social Influence and Herding | 1 | Q18 | No |
| Behavioral and Risk Management Knowledge | Retirement Risk Planning | 1 | Q19 | No |
| Behavioral and Risk Management Knowledge | Emotional Response to Loss | 1 | Q20 | No |
| Behavioral and Risk Management Knowledge | Decision Process | 1 | Q21 | No |
| Behavioral and Risk Management Knowledge | Risk Confidence | 1 | Q22 | No |
| Behavioral and Risk Management Knowledge | Risk Attitude | 1 | Q23 | No |
| Behavioral and Risk Management Knowledge | Reaction to Underperformance | 1 | Q24 | No |
| Behavioral and Risk Management Knowledge | Definition of Success | 1 | Q25 | No |
| Behavioral and Risk Management Knowledge | Downside Awareness | 1 | Q26 | No |
| Behavioral and Risk Management Knowledge | Risk Preference in Income | 1 | Q27 | No |
| Behavioral and Risk Management Knowledge | Scam Skepticism | 1 | Q28 | No |
| Risk and Return Knowledge | Investing | 4 | Q29, Q30, Q31, Q32 | Yes |
| Risk and Return Knowledge | Basic Probability -- Percentage to Frequency | 1 | Q33 | Yes |
| Risk and Return Knowledge | Investment Risk -- Diversification Effect | 1 | Q34 | Yes |
| Risk and Return Knowledge | Investment Risk -- Risk-Return Relationship | 1 | Q35 | Yes |
| Risk and Return Knowledge | Risk Management -- Diversification Principle | 1 | Q36 | Yes |
| Risk and Return Knowledge | Risk Management -- Insurance | 1 | Q37 | Yes |
| Risk and Return Knowledge | Investment Risk -- Inflation Risk | 1 | Q38 | Yes |
| Risk and Return Knowledge | Investment Risk -- Asset Class Risk | 1 | Q39 | Yes |
| Risk and Return Knowledge | Crisis/Systemic Risk | 1 | Q40 | Yes |

*(Full question text with answer keys is available in the project repository.)*

---

## Appendix C: Financial Literacy Misconception Taxonomy (Layer 1)

Layer 1 contains 37 generalizable financial literacy misconception families organized into seven categories. These codes are designed to be reproducible across assessment contexts, student populations, and institutions. Layer 2 item-specific tags (derived from observed student responses) are documented in the supplementary materials.

### Category 1: Inflation and Purchasing Power (INF)

| Code | Misconception Family | Description | Observed in Test 1 |
| --- | --- | --- | --- |
| INF-01 | Lower inflation = falling prices | Confuses a decrease in the inflation rate with deflation | Yes, Q6 (dominant) |
| INF-02 | Inflation definition confusion | Does not understand inflation as a general rise in price levels | Yes, Q3 |
| INF-03 | Fixed income impact misunderstood | Does not understand why fixed income earners are most hurt | Yes, Q7 |
| INF-04 | Inflation protection confusion | Does not know which assets/contracts benefit from inflation | Yes, Q38 |
| INF-05 | Empathy-driven inflation reasoning | Selects "who is hurt most" based on personal identification, not economic logic | Yes, Q7 |

### Category 2: Interest, Compounding, and Time Value of Money (INT)

| Code | Misconception Family | Description | Observed in Test 1 |
| --- | --- | --- | --- |
| INT-01 | Interest as a fee to the saver | Believes saving money costs the saver through interest charges | Yes, Q1 |
| INT-02 | No compounding awareness | Calculates simple interest only | Yes, Q1 |
| INT-03 | Loan term does not affect total interest | Believes total interest is the same regardless of loan length | Yes, Q2 |
| INT-04 | Shorter term = higher total cost | Believes shorter loan terms cost more because payments are higher | Yes, Q2 |
| INT-05 | Interest rates not negotiable | Believes consumer interest rates are fixed by authorities | Yes, Q8 |
| INT-06 | Bond price-interest rate relationship reversed | Believes bond prices rise when interest rates rise | Yes, Q29 |
| INT-07 | Zero interest concept confusion | Cannot calculate interest on a simple borrow/repay scenario | Yes, Q4 (small n) |

### Category 3: Risk, Return, and Diversification (RISK)

| Code | Misconception Family | Description | Observed in Test 1 |
| --- | --- | --- | --- |
| RISK-01 | Safety = highest returns | Equates low risk with high returns | Yes, Q32 |
| RISK-02 | Exceptions disprove general rule | Believes specific exceptions invalidate the risk-return principle | Yes, Q30, Q35 |
| RISK-03 | Diversification increases risk | Believes spreading across assets increases complexity and risk | Yes, Q14, Q34 |
| RISK-04 | Diversification understood but misapplied | Correct reasoning but wrong answer (selection error) | Yes, Q36 |
| RISK-05 | Single stock safer than mutual fund | Believes concentrated investment is safer | Yes, Q11 |
| RISK-06 | Mutual fund unfamiliarity | Does not know what a mutual fund is | Yes, Q11 (KG) |
| RISK-07 | Stock market guarantees returns | Believes the stock market guarantees profit | Yes, Q31 |
| RISK-08 | Stocks vs. bonds risk confusion | Does not know stocks are generally riskier than bonds | Yes, Q39 |
| RISK-09 | Long-term asset return confusion | Does not know stocks have historically highest long-term returns | Yes, Q32 |
| RISK-10 | Real-world counterexamples applied | Uses non-financial scenarios to disprove financial principles | Yes, Q35 |

### Category 4: Insurance and Risk Management (INS)

| Code | Misconception Family | Description | Observed in Test 1 |
| --- | --- | --- | --- |
| INS-01 | Insurance for routine care | Believes health insurance exists mainly for checkups | Yes, Q12 |
| INS-02 | Frequency = purpose reasoning | Because routine care is used more often, it must be primary | Yes, Q12 |
| INS-03 | Deductible definition wrong | Confuses deductible with premium, copay, or max payout | Yes, Q13 |
| INS-04 | Liability coverage scope wrong | Believes auto liability covers own injuries | Yes, Q37 |
| INS-05 | Insurance excludes large bills | Believes insurance does not cover major unexpected expenses | Yes, Q12 |

### Category 5: Borrowing, Credit, and Personal Finance (BORROW)

| Code | Misconception Family | Description | Observed in Test 1 |
| --- | --- | --- | --- |
| BORROW-01 | Credit report vs. score confusion | Conflates credit report content with credit scoring | Yes, Q10 |
| BORROW-02 | Single credit source belief | Believes credit information comes from one source | Yes, Q10 |
| BORROW-03 | Employer credit check unknown | Does not know employers can check credit | Yes, Q10 |
| BORROW-04 | Emergency fund based on income | Believes emergency fund should scale with income, not expenses | Yes, Q5 |
| BORROW-05 | Emergency fund amount too low | Believes one month or a fixed small amount is sufficient | Yes, Q5 |
| BORROW-06 | Budgeting purpose misunderstood | Does not understand budgeting as planning for bills and savings | Yes, Q9 (small n) |

### Category 6: Financial Crises and Systemic Risk (CRISIS)

| Code | Misconception Family | Description | Observed in Test 1 |
| --- | --- | --- | --- |
| CRISIS-01 | 2008 crisis cause reversed | Believes low borrowing caused the crash | Yes, Q40 |
| CRISIS-02 | Crisis attributed to savings risk | Believes the crisis was about savings losing value | Yes, Q40 |
| CRISIS-03 | Risk management role misunderstood | Cannot connect poor risk management to systemic failure | Yes, Q40 |

### Category 7: Numeracy and Quantitative Reasoning (NUM)

| Code | Misconception Family | Description | Observed in Test 1 |
| --- | --- | --- | --- |
| NUM-01 | Percentage to count conversion error | Cannot calculate X% of N correctly | Yes, Q33 (small n) |

### Cross-Cutting Response Types (Not Misconceptions)

| Code | Type | Description |
| --- | --- | --- |
| KG | Knowledge Gap | Student has no knowledge (explicit IDK, blank, unfamiliar with terms) |
| SE | Selection Error | Student demonstrates correct understanding but selected wrong answer |

---

## Appendix D: AI Scorer Model Selection Protocol

To select the scoring model for the AI-assisted classification pipeline (Section 4.3), we conducted a multi-model concordance evaluation. Twenty identical open-ended student responses (11 diagnose, 9 confirm) were scored by 11 large language models from seven providers, accessed via the OpenRouter API. Models were evaluated on five criteria: (1) JSON schema compliance (whether diagnose items returned the correct diagnose-format output), (2) parse/API error rate, (3) classification nuance (use of partial credit, confidence variation, and balanced classification distributions), (4) throughput (wall-clock time for 20 responses), and (5) estimated cost for the full corpus.

**Table D.1: Multi-Model Concordance Results (n = 20 identical responses)**

| Model | Provider | Schema Violations | Errors | Time (20) | Uses credit=50 | Confidence Variation | Est. Cost (953) | Verdict |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GPT-4.1 | OpenAI | 0 | 0 | 41 s | Yes | 19 high / 1 medium | $2.86 | Selected |
| DeepSeek V3.2 | DeepSeek | 0 | 0 | 266 s | Yes | 18 high / 2 medium | $0.24 | Too slow (~3.5 h) |
| Grok 4.1 Fast | xAI | 0 | 1 parse failure | 144 s | Yes | 18 high / 1 medium | $0.22 | 5% error rate |
| Qwen3-235B | Alibaba | 0 | 0 | 84 s | No | 20 high / 0 medium | $0.07 | No partial credit |
| GPT-4o-mini | OpenAI | 0 | 0 | 37 s | No | 18 high / 2 medium | $0.22 | Overly strict |
| Claude Haiku 4.5 | Anthropic | 0 | 0 | 56 s | No | 20 high / 0 medium | $1.58 | Over-detects SE |
| Gemini 3 Flash | Google | 1 | 1 (rate limit) | 42 s | Yes | 18 high / 1 medium | $0.80 | Schema violation |
| Claude Sonnet 4.5 | Anthropic | 1 | 0 | 71 s | Yes | 19 high / 1 medium | $4.72 | Schema violation |
| Gemini 2.0 Flash | Google | 2 | 0 | 34 s | No | 20 high / 0 medium | $0.15 | Disqualified |
| Minimax M2.1 | Minimax | --- | 19 of 20 | 83 s | --- | --- | --- | Disqualified |
| Kimi K2.5 | Moonshot AI | --- | 20 of 20 | 173 s | --- | --- | --- | Disqualified |

Schema violations occur when a diagnose item returns the confirm-format JSON (e.g., `understanding_level` instead of `diagnosis_type`). Three models were disqualified: Minimax M2.1 and Kimi K2.5 returned empty or unparseable responses on nearly all items; Gemini 2.0 Flash produced two schema violations and lacked any partial-credit classifications.

**Table D.2: Inter-Model Agreement on Disputed Classifications**

Four responses produced substantive disagreement among the eight non-disqualified models. Table D.2 shows the classification assigned by the five models with zero schema violations and zero or one errors.

| Response | Student Text (abbreviated) | GPT-4.1 | DeepSeek V3.2 | Grok 4.1 Fast | Haiku 4.5 | Qwen3-235B |
| --- | --- | --- | --- | --- | --- | --- |
| Q9 Diagnose | "safety net... preventing interest rates" | SE (selfcorrect) | SE (selfcorrect) | misconc. (BORROW-06) | SE (selfcorrect) | misconc. (BORROW-06) |
| Q5 Diagnose | "having a little extra cash is safe enough" | misconc. (BORROW-05), credit=50 | misconc. (BORROW-05), credit=50 | misconc. (BORROW-05), credit=100 | KG (idk), credit=0 | KG (idk), credit=0 |
| Q13 Diagnose | "deductible is $500... insurance pays rest" | SE (selfcorrect) | misconc. (INS-03), credit=50 | SE (selfcorrect) | SE (INS-03) | misconc. (INS-03) |
| Q37 Confirm | "Liability coverage protects you from large payments..." | verified, credit=100 | verified, credit=100 | verified, credit=100 | partial, credit=50 | verified, credit=100 |

**Selection Rationale.** GPT-4.1 was selected as the production scorer based on: (a) zero schema violations across all 20 test items, (b) zero parse or API errors, (c) appropriate use of credit=50 for borderline misconceptions, (d) balanced classification distributions, and (e) reasonable throughput and cost (~33 minutes, ~$2.86 for the full corpus). On the disputed items, GPT-4.1's classifications aligned with the majority of the zero-error models in three of four cases, supporting its position as a concordant central scorer.
