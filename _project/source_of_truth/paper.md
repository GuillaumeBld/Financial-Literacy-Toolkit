# Developing a Risk Literacy Diagnostic for QUIN 102: Instrument Design, Platform Implementation, and SDM-10 Diagnostic Findings

**Guillaume Bolivard**
**Loyola University Chicago**
**Independent Study: Spring 2026**

---

## Abstract

This paper describes the design, deployment, and diagnostic findings from a 40-item pre-course financial risk literacy assessment for QUIN 102 at Loyola University Chicago. The instrument spans three knowledge domains (Borrowing and Credit, Risk Management, and Investment and Risk) using 26 scored and 14 unscored anchor items. A Supplemental Diagnostic Module (SDM-10) adaptively selects up to 10 open-ended follow-up items based on each student's anchor performance; an AI-assisted rubric classifies responses into misconception, knowledge gap, and selection error categories. During the Spring 2026 pilot (653-student roster), 354 research-consented students completed the assessment. The mean anchor score was 67.0% (SD = 17.9%), with wide variation across domains. Among 493 scored diagnostic responses, 53.9% reflected misconceptions, 31.9% selection errors, and 14.2% knowledge gaps. The selection error finding is worth highlighting: in this sample, among students who answered incorrectly with high confidence, nearly one in three showed correct understanding in their open-ended explanation. In other words, raw MCQ scores may misrepresent student knowledge on format-sensitive items. The diagnostic results lead to 10 course improvement recommendations covering instructional content, instrument revision, and delivery changes. Each recommendation is tied to a specific finding and paired with a Paper 2 evaluation criterion. We note the limitations of a single-cohort design and preview a planned validation study that would add pre-post measurement, factor analysis, and heterogeneity modeling.

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
4. [Assessment Pipeline](#4-assessment-pipeline)
   - 4.1 [Variant Bank Design](#41-variant-bank-design)
   - 4.2 [Pipeline Overview and Illustrative Walkthrough](#42-pipeline-overview-and-illustrative-walkthrough)
   - 4.3 [Illustrative Walkthrough: What a Student Sees](#43-illustrative-walkthrough-what-a-student-sees)
   - 4.4 [Adaptive Selection and Diagnostic Priority Score](#44-adaptive-selection-and-diagnostic-priority-score)
   - 4.5 [AI-Assisted Scoring Pipeline](#45-ai-assisted-scoring-pipeline)
5. [Platform and Governance Design](#5-platform-and-governance-design)
   - 5.1 [Consent Mechanics](#51-consent-mechanics)
6. [Pilot Operations and Descriptive Statistics](#6-pilot-operations-and-descriptive-statistics)
   - 6.1 [Participation and Completion](#61-participation-and-completion)
   - 6.2 [Sample Demographics](#62-sample-demographics)
7. [Results](#7-results)
   - 7.1 [Anchor Score Distribution and Domain Breakdown](#71-anchor-score-distribution-and-domain-breakdown)
   - 7.2 [Confidence Calibration Patterns](#72-confidence-calibration-patterns)
   - 7.3 [Diagnostic Classification: Diagnose Composition](#73-diagnostic-classification-diagnose-composition)
   - 7.4 [Diagnostic Classification: Confirm Composition](#74-diagnostic-classification-confirm-composition)
   - 7.5 [Misconception Clusters by Domain](#75-misconception-clusters-by-domain)
   - 7.6 [Selection Error Patterns and Item Revision Targets](#76-selection-error-patterns-and-item-revision-targets)
   - 7.7 [AI Scoring Validation](#77-ai-scoring-validation)
8. [Discussion](#8-discussion)
   - 8.1 [Key Findings](#81-key-findings)
   - 8.2 [Course Improvement Recommendations](#82-course-improvement-recommendations)
   - 8.3 [Implications for Risk Literacy Measurement](#83-implications-for-risk-literacy-measurement)
   - 8.4 [Oral Diagnostics as Future Modality](#84-oral-diagnostics-as-future-modality)
9. [Limitations](#9-limitations)
10. [Planned Validation Study (Paper 2 Protocol Preview)](#10-planned-validation-study-paper-2-protocol-preview)
- [References](#references)
- [Declaration of AI and AI-Assisted Technologies](#declaration-of-ai-and-ai-assisted-technologies)
- [Appendix A: SDM-10 Selection Algorithm and Burden Controls](#appendix-a-sdm-10-selection-algorithm-and-burden-controls)
- [Appendix B: Assessment Items (Full Question Bank)](#appendix-b-assessment-items-full-question-bank)
- [Appendix C: Financial Literacy Misconception Taxonomy (Layer 1)](#appendix-c-financial-literacy-misconception-taxonomy-layer-1)
- [Appendix D: AI Scorer Model Selection Protocol](#appendix-d-ai-scorer-model-selection-protocol)
- [Appendix E: Supplementary Materials](#appendix-e-supplementary-materials)
- [Appendix F: Technical Implementation](#appendix-f-technical-implementation)

---

## 1. Introduction

Financial literacy is commonly defined as the ability to understand and use financial concepts and quantitative information to make informed decisions about saving, borrowing, investing, and managing risk. In the human capital framework, these competencies influence participation in credit and asset markets, portfolio choice, and resilience to shocks. For university students, financial literacy matters right away: many are already managing debt, credit, and spending decisions with limited experience and incomplete information. Small misunderstandings about compounding, interest-rate mechanics, inflation, diversification, and insurance can turn into persistent debt, thin savings buffers, and poor portfolio choices.

Recent policy debate on consumer credit highlights why financial literacy matters for borrowing outcomes. Research suggests that creditworthiness is associated with financial literacy education (Lusardi & Mitchell, 2014), and that improving consumers' understanding of borrowing mechanics may be consistent with lower delinquency rates and fewer compounding penalty cycles. From this perspective, financial literacy education has relevance beyond the classroom: to the extent that it strengthens borrowers' decision-making, it may also contribute to better credit outcomes at the market level, though establishing that link is outside the scope of this study.

Despite broad recognition of its importance, financial literacy is unevenly distributed across student populations. Students arrive with very different prior exposure to personal finance concepts, varying numeracy levels, and unequal access to credible guidance from families, schools, employers, and online sources. Learning is further shaped by real-life constraints: time scarcity, employment intensity, financial stress, risk preferences, and prior exposure to financial products. For these reasons, evaluating financial literacy instruction should address both average learning gains and the sources of variation in learning across students.

This independent study develops and pilots a diagnostic instrument for evaluating financial and risk literacy in QUIN 102 (Financial Literacy) during the Spring 2026 offering. The instrument comprises a 40-item anchor assessment covering financial knowledge and attitudes, paired with a 10-item Supplemental Diagnostic Module (SDM-10) that adaptively probes areas of weakness identified in the anchor responses. The assessment is administered through a purpose-built web platform with coded student identifiers and structured consent mechanics.

The independent study is organized around two research questions:

- **RQ1 (Learning gains):** What is the magnitude of student learning in QUIN 102, overall and within the domains of borrowing and credit, investment, and risk management, as measured by pre- to post-course changes in knowledge?

- **RQ2 (Heterogeneity):** Which baseline behavioral and contextual variables predict heterogeneity in learning gains across students, and do these predictors differ by domain?

RQ1 and RQ2 require paired pre-post data and will be addressed in a follow-up study contingent on IRB approval (see Section 10). This paper (Paper 1) is an independent study deliverable that documents instrument design, platform implementation, and descriptive diagnostic findings from the pre-course assessment (February 2–10, 2026). It reports no learning gains, no inferential statistics, and no subgroup comparisons. All pre-course results are presented as operational baseline context for the planned validation study, not as standalone research findings. The SDM-10's three-way classification of open-ended responses (misconception, knowledge gap, selection error) picks up diagnostic information that standard multiple-choice instruments miss. In particular, a substantial fraction of incorrect answers turn out to reflect selection errors rather than genuine misconceptions, and a meaningful fraction of correct answers turn out to reflect lucky guesses rather than genuine understanding. Put differently, raw MCQ scores both overstate and understate student knowledge in ways that matter for instrument design and instructional targeting.

Measuring financial literacy is only half the problem. What matters for instruction is understanding why students get answers wrong: whether they hold a genuine misconception, lack the relevant knowledge entirely, or simply tripped over the question format. Research in error analysis and metacognition treats these as fundamentally different cognitive states: Chi (2008) showed that filling a knowledge gap and revising a misconception are distinct processes requiring different instructional approaches, and Hasan, Bagayoko, and Kelley (1999) demonstrated that pairing confidence ratings with item responses can operationally separate the two. The testing literature has documented since Millman, Bishop, and Ebel (1965) that format-induced errors are a third, distinct category unrelated to the student's actual understanding. As Ohlsson (1996) argued, correcting an error first requires identifying what kind of error it is. Without that classification, remediation is misdirected. Open-ended response formats are better suited to this kind of diagnosis than multiple-choice items alone: they reveal the reasoning behind an answer, not just whether it is right or wrong (Martinez, 1999), and they surface more distinct error types than closed-format items can (Birenbaum & Tatsuoka, 1987). Our instrument is built around these findings: the SDM-10 adapts to each student's anchor performance, the open-ended scoring pipeline classifies errors into misconceptions, knowledge gaps, and selection errors, and paired knowledge-confidence data support overconfidence analysis. The aim is not just to measure what students know, but to identify the specific cognitive gaps that instruction needs to address. Section 2 reviews this literature in detail.

---

## 2. Related Work

### 2.1 Financial Literacy: Definitions and Measurement

Since the early 2000s, a growing body of research has looked at how well people understand basic financial concepts and how that understanding shapes their economic decisions. Lusardi and Mitchell (2014) anchored much of this work by defining financial literacy around three core ideas (interest compounding, inflation, and risk diversification) and showing that individuals who grasp these concepts save more, invest more effectively, and accumulate greater wealth over time. Their "Big Three" questions have become the most widely adopted instrument for assessing basic financial literacy and form the conceptual basis for most subsequent measurement efforts, including the assessment categories we use here.

Although the construct is widely recognized, the field still lacks a standardized instrument comparable to established health literacy measures. Huston (2010) reviewed the scattered measurement landscape and proposed that financial literacy instruments should contain 12–20 items spanning four content areas: money basics (time value of money, purchasing power), borrowing, investing, and asset protection. Our assessment's coverage of borrowing/credit, investment/risk, and behavioral risk management closely mirrors Huston's recommended framework. More recently, the OECD/INFE toolkit (OECD, 2022) has provided a standardized questionnaire measuring three dimensions of financial literacy (knowledge, behavior, and attitudes) deployed across dozens of countries to enable cross-national comparisons.

In their methodological review, Hastings, Madrian, and Skimmyhorn (2013) examined how researchers actually measure financial literacy and concluded that the "Big Five" questions (interest rates, inflation, diversification, compound interest, and bond pricing) remain the field's most trusted indicators, despite persistent difficulties in drawing causal links between what people know and how they behave financially. Lusardi (2019) further documented that globally, only about one-third of adults demonstrate familiarity with basic financial concepts, with illiteracy especially concentrated among women, minorities, the young, and those with lower educational attainment.

Among college students specifically, Chen and Volpe (1998) established early baseline evidence, finding that 924 college students answered only about 53% of financial literacy questions correctly, with non-business majors, women, and students with limited work experience scoring significantly lower.

### 2.2 Domain-Specific Knowledge Gaps

Research has documented uneven financial literacy across knowledge domains. Lusardi and Tufano (2015) established the concept of "debt literacy" as distinct from general financial literacy, finding that only about one-third of Americans comprehend interest compounding or credit card mechanics, and estimating that as much as one-third of charges and fees paid by less-knowledgeable individuals can be attributed to ignorance. Stango and Zinman (2009) identified the cognitive mechanism underlying many borrowing mistakes (exponential growth bias, the pervasive tendency to linearize exponential functions) which leads consumers to underestimate interest rates on loans and underestimate future values of investments.

In the investment domain, van Rooij, Lusardi, and Alessie (2011) found that while most respondents demonstrated basic financial knowledge (interest compounding, inflation, time value of money), very few understood differences between bonds and stocks, bond price-interest rate relationships, or risk diversification basics. Individuals with low advanced financial literacy were significantly less likely to participate in the stock market.

Within the college population, Akers and Chingos (2014) found striking levels of student loan illiteracy: 28% of first-year students with federal loans reported having no federal debt, and nearly half seriously underestimated their total student debt. These findings are a key reason we include borrowing/credit as a major knowledge domain in our assessment.

### 2.3 Confidence Calibration and Overconfidence

The gap between perceived and actual financial literacy has become a key dimension of financial competence research. Allgood and Walstad (2016) showed, using a national survey of 28,146 U.S. adults, that actual (objective) and perceived (subjective) financial literacy each independently influence financial behaviors across five domains. The combined measure has greater explanatory power than either one alone, which is consistent with our decision to build an overconfidence index from both measures in the QUIN 102 assessment.

Robb and Woodyard (2011) found that subjective financial knowledge had a larger relative impact on financial behavior than objective knowledge, which reinforces the case for measuring confidence calibration. Porto and Xiao (2016) found that over 11% of respondents in a nationally representative sample displayed financial literacy overconfidence (scoring above average on perceived knowledge but failing basic literacy questions) and that these overconfident consumers were less likely to seek professional financial advice in domains where they most needed it.

In a study close to ours, Ipatova and Merheb (2023) looked at overconfidence among 169 undergraduates and found patterns consistent with the Dunning-Kruger effect in financial literacy: students with lower proficiency consistently overestimated their own knowledge. Kramer (2016) provided additional evidence that confidence operates independently of knowledge in shaping financial behavior, finding that higher confidence reduces advice-seeking while no relationship exists between objective literacy and advice-seeking.

### 2.4 Gaps in the Literature

The literature review points to several gaps that our instrument tries to address. First, most financial literacy studies rely on fixed multiple-choice instruments that cannot tell apart genuine misconceptions, knowledge gaps, and selection errors, which limits both diagnostic specificity and instructional targeting. Second, adaptive diagnostic instruments that probe weak areas identified in an anchor assessment are largely absent from the financial literacy evaluation literature. Third, measuring knowledge, confidence, and behavioral covariates at the same time opens the door to confidence calibration analysis, directly addressing Willis's (2011) concern about "confident incompetence." Our instrument tries to close these gaps by pairing a fixed anchor assessment with an adaptive diagnostic module, allowing finer-grained classification of student responses than MCQ-only approaches can provide.

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
| Anchor knowledge items | 26 | Q1–Q14, Q29–Q40 (borrowing, investment, risk) | Yes |
| Anchor preference items | 14 | Q15–Q28 (attitudes, risk tolerance, behavior) | No |
| SDM-10 adaptive items | 10 | Selected from 182-variant item bank (see Appendix E) | Diagnostic only |

Out of the 40 anchor items, 26 are knowledge items scored as correct/incorrect and used to compute learning gains. The remaining 14 are preference items (Q15–Q28) that assess behavioral tendencies and serve as unscored covariates for heterogeneity analysis. Each anchor item is paired with a confidence rating on a 1–3 scale (low, medium, high). The combination of correctness and confidence determines whether additional diagnostic measurement is warranted in the SDM-10.

We built the question bank by adapting and synthesizing items from established financial literacy and numeracy instruments, including the Berlin Numeracy Test, Lipkus Numeracy Scale, the "Big Three" (Lusardi and Mitchell), the FINRA National Financial Capability Study item sets, the OECD/INFE Toolkit (2022), the P-Fin Index, and related decision science instruments. Starting from an initial pool of approximately 80 candidates, we refined the bank down to a 40-item anchor assessment.

### 3.2 Scoring Methodology

We score knowledge items (Q1–Q14, Q29–Q40) as correct/incorrect (binary) and compute both overall and domain-level percent-correct scores across three instructional domains:

- **Borrowing, Interest Rates, and Financial Numeracy Knowledge** (10 items: Q1–Q10)
- **Behavioral and Risk Management Knowledge** (4 scored items: Q11–Q14)
- **Risk and Return Knowledge** (12 items: Q29–Q40)

Each anchor item also carries a confidence rating, which we use for secondary analyses (calibration and diagnostic interpretation) but which does not affect the primary score. The SDM-10 is diagnostic only and does not contribute to the student's course grade.

### 3.3 Risk Literacy Emphasis

The instrument emphasizes risk literacy as a core construct, in line with the independent study's objectives. Risk literacy here covers factual knowledge of diversification, insurance, and risk-return tradeoffs (assessed through scored knowledge items) as well as students' self-assessed confidence in recognizing and managing risk (assessed through confidence ratings and preference items). The SDM-10 module adds a deeper diagnostic layer by probing whether incorrect answers on risk-related items come from misconceptions (specific wrong mental models), knowledge gaps (absence of knowledge), or selection errors (correct understanding despite the wrong answer choice). This three-level diagnostic setup (knowledge score, confidence calibration, and open-ended classification) lets us measure both the quantitative and qualitative sides of risk literacy.

We designed the instrument to be internally consistent and transferable. Although we piloted it with Loyola University Chicago students in QUIN 102, the item bank, scoring framework, and diagnostic module are meant to be adaptable to other student populations in future work.

---

## 4. Assessment Pipeline

### 4.1 Variant Bank Design

The SDM-10 does not generate questions on the fly. Instead, we built a bank of pre-written follow-up items so that each student receives a targeted, quality-controlled prompt drawn from a fixed pool. The bank contains 182 variant rows covering all 26 anchor knowledge items (see Appendix E).

Every variant was created by combining two design choices:

- **Response format**: multiple-choice (MCQ), True/False (T/F), or open response.
- **Level of understanding probed**: recognize or select the correct answer, apply the concept to a new scenario, or explain reasoning in the student's own words.

Table 4.1 shows how these two axes map to the variant types used in the bank.

**Table 4.1: Variant bank design space (format x level of understanding)**

| Level of understanding | Multiple-choice | True/False | Open response |
| --- | --- | --- | --- |
| Recognize/select | Anchor item (scored) | Format variant (same concept) | Not used |
| Apply/transfer | Scenario variant (MCQ) | Scenario variant (T/F) | Not used |
| Explain reasoning | Not used | Not used | Open_Diagnose or Open_Confirm |

The closed-format variants (MCQ and T/F columns) test whether a student can recognize or apply a concept. Open-ended variants appear only in the explain-reasoning row because asking a student to explain in their own words is what makes diagnostic classification possible. These open-ended items are the primary diagnostic instruments in the SDM-10.

**Two types of open-ended follow-up.** A student receives at most one open-ended follow-up per anchor item, and the type depends entirely on how the student answered that anchor item:

**Open_Diagnose** is triggered when a student answers an anchor item **incorrectly with high confidence**. The student is asked to explain the reasoning behind the chosen answer. The response is classified as a *misconception* (a specific wrong belief), a *knowledge gap* (absence of knowledge), or a *selection error* (correct understanding despite the wrong answer choice).

**Open_Confirm** is triggered when a student answers an anchor item **correctly with low confidence**. The student is asked to explain why the correct answer holds. The response is classified as *verified* (genuine understanding), *partial* (incomplete reasoning), or *likely guess* (no substantive understanding despite the correct answer).

These two types are alternatives, not sequential steps: a given anchor item triggers one or the other based on the student's response, never both.

**Misconception taxonomy.** To ensure consistent coding across items and raters, open-ended responses are classified using a two-layer taxonomy. Layer 1 contains 37 transferable misconception families organized into seven categories (Appendix C). Layer 2 contains item-specific tags derived from observed student response patterns.

### 4.2 Pipeline Overview and Illustrative Walkthrough

Using the pre-written variant bank described in Section 4.1, the SDM-10 pipeline operates in three stages: (1) compute a diagnostic priority for each concept area based on the student's anchor answer and confidence, (2) select up to 10 follow-up items from the bank, ranked by priority (targeting 10, delivering 5–10 depending on available high-priority concepts), and (3) score any open-ended responses using an AI-assisted rubric aligned to the misconception taxonomy. Confidence is captured on a three-level scale (1 = low, 2 = mid, 3 = high). As noted in Section 4.1, each anchor item triggers at most one follow-up, and the two open-ended types (Open_Diagnose and Open_Confirm) are alternatives, not sequential steps. Two illustrative cases show how the pipeline works in practice on two different anchor items.

**Case A: Open_Diagnose (incorrect + high confidence).** A student encounters Q6, which asks what a "successful effort to lower inflation" would likely be accompanied by. The student selects "a decrease in the general level of prices" (the incorrect answer) and reports high confidence. Because the combination of incorrectness and high confidence produces a high diagnostic priority, the algorithm assigns an Open_Diagnose variant for the Inflation (Lowering) concept area. The student sees an open-ended prompt: *"You chose 'a decrease in the general level of prices.' In your own words, explain what happens to prices when inflation is lowered."* The student writes: *"If inflation goes down, prices should go down too, that's what lower inflation means."* The AI scoring pipeline classifies this as a **misconception** (INF-01: confuses a decrease in the rate of price increase with an actual decrease in prices) and assigns taxonomy codes. The classification distinguishes this from a knowledge gap (the student has an active belief, not an absence of knowledge) and from a selection error (the student's reasoning is consistent with the wrong answer, not inconsistent with it).

**Case B: Open_Confirm (correct + low confidence).** On a separate anchor item, the same student answers Q29 correctly ("bond prices fall when interest rates rise") but reports low confidence. Because a correct answer paired with low confidence leaves residual uncertainty about whether the student genuinely understands the concept, the algorithm assigns an Open_Confirm variant. The prompt asks: *"You said bond prices typically fall when interest rates rise. In your own words, explain why this relationship holds."* The student writes: *"I'm not really sure, I think I read it somewhere but I don't remember why."* The AI scoring pipeline classifies this as a **likely guess**: the student cannot articulate the reasoning behind the correct answer. Without this follow-up, the anchor score of 100% on Q29 would overstate the student's understanding.

Together, these two cases show what the SDM-10 adds over standard testing: a regular MCQ score classifies a response as simply correct or incorrect, but the diagnostic module goes further and reveals whether an incorrect answer reflects a misconception, a knowledge gap, or a format-induced error, and whether a correct answer reflects genuine understanding or a lucky guess.

### 4.3 Illustrative Walkthrough: What a Student Sees and How the System Responds

To show how the anchor assessment and SDM-10 fit together from a student's perspective, consider the following end-to-end walkthrough.

A student logs into the platform using their course code and student ID, views the orientation video, and completes the onboarding questionnaire. They then begin the 40-item anchor assessment. Each item appears as a multiple-choice or True/False question followed by a confidence rating on a three-level scale (1 = low, 2 = mid, 3 = high). For instance, on an inflation item (Q6), the student reads the question, selects an answer, and then rates how confident they are in that choice (Figure 9).

**[FIGURE PLACEHOLDER: Overall assessment screen showing MCQ + confidence selector + "flagged issue" indicator]**

*Figure 9. Assessment interface showing a multiple-choice anchor item with three-level confidence selector (1 = low, 2 = mid, 3 = high) and flagged-issue indicator for concepts requiring diagnostic follow-up.*

Once all 40 anchor items are submitted, the system evaluates the student's pattern of correctness and confidence across the 26 scored knowledge items. Concept areas where the student's response pattern suggests residual uncertainty, such as an incorrect answer paired with high confidence, or a correct answer paired with low confidence, are flagged for diagnostic follow-up. The system then selects up to 10 follow-up items from the pre-written bank of 182 variants (Section 4.1). A *variant* is a follow-up item that probes the same concept as the original anchor question but in a different format or at a different level of understanding. The target is 10 follow-up items; the system delivers between 5 and 10 depending on how many concept areas carry sufficient diagnostic priority to warrant follow-up.

The follow-up items include two types of open-ended prompts that produce the diagnostic classifications central to this paper:

**Open_Diagnose path.** When a student answers an anchor item incorrectly with high confidence, the system assigns that concept area a high diagnostic priority and selects an open-ended follow-up asking the student to explain the reasoning behind their answer. For instance, if a student selects the wrong answer on the inflation item (Q6) and reports high confidence, they see a prompt such as: *"You chose [selected answer]. In your own words, explain what happens to prices when inflation is lowered."* Suppose the student writes: *"If inflation goes down, prices should go down too."* The AI scoring pipeline (Section 4.5) classifies this as a *misconception* (INF-01: confusing a decrease in the inflation rate with an actual decrease in prices), because the student articulates a stable incorrect mental model that aligns with the wrong answer. The two alternative diagnose labels, *knowledge gap* (the student cannot articulate any relevant concept) and *selection error* (correct understanding despite the wrong answer), do not apply here because the student expressed a specific wrong belief.

**Open_Confirm path.** When a student answers an anchor item correctly but with low confidence, the system marks that concept area as verification needed and selects an open-ended follow-up asking the student to explain why the correct answer holds. For example, if a student correctly identifies that bond prices fall when interest rates rise (Q29) but rates low confidence, they see: *"You said bond prices typically fall when interest rates rise. In your own words, explain why this relationship holds."* Suppose the student writes: *"I'm not really sure why, I think I just remembered it from somewhere."* The AI scoring pipeline (Section 4.5) classifies this as a *likely guess*: the student selected the correct answer but cannot explain the underlying mechanism. The two alternative confirm labels, *verified* (coherent, mechanism-based explanation) and *partial* (some correct elements but incomplete reasoning), require the student to demonstrate at least some understanding of why the relationship holds.

**[FIGURE PLACEHOLDER: Example open-ended follow-up prompt screen (Open_Diagnose/Open_Confirm) with response box]**

*Figure 10. Open-ended follow-up prompt screen used for Open_Diagnose and Open_Confirm items, showing the student's response text box and confidence rating (1–3).*

After the student completes all SDM-10 items, the system processes the open-ended responses through the AI scoring pipeline (Section 4.5) and stores the classifications. The student then receives a score summary and dashboard feedback. The diagnose and confirm classifications, aggregated across the consented sample, produce the diagnostic datasets analyzed in Section 7: the diagnose three-way breakdown (Table 7.4) and the confirm three-way breakdown (Table 7.6).

### 4.4 Adaptive Selection and Diagnostic Priority Score

The SDM-10 is administered immediately after the 40-item anchor assessment. For each student, the algorithm computes a diagnostic priority score for each of the 26 knowledge subcategories based on correctness, confidence, and item format (True/False vs. multiple choice). Higher scores indicate greater residual uncertainty; incorrect answers paired with high confidence receive the highest priority. The algorithm then selects up to 10 follow-up items from the variant bank, enforcing domain balance, capping open-ended items at three per student, and applying an understanding-verification fallback when fewer than 10 subcategories are flagged. Once a subcategory is selected, the specific variant type (Open_Diagnose, Open_Confirm, Lower_MCQ, Lower_TF, Same_MCQ, or Higher_MCQ) is determined by the combination of correctness and confidence, as specified in Appendix A (Table A.3). See Appendix A for the complete selection specification including the priority score mapping and three-phase procedure.

### 4.5 AI-Assisted Scoring Pipeline

The SDM-10 generates two types of open-ended student text that require classification: diagnose responses and confirm responses. This section describes what the scoring pipeline receives, how it classifies each response, and what consistency controls are in place.

**What text is scored.** Open_Diagnose responses are written explanations from students who answered an anchor item incorrectly with high confidence; each response explains the reasoning behind the student's chosen answer. Open_Confirm responses are written explanations from students who answered an anchor item correctly but with low confidence; each response explains why the student believes the correct answer holds.

**Classification outputs.** For each diagnose response, the pipeline returns one of three labels: *misconception*, *knowledge gap*, or *selection error*. When the label is misconception, the pipeline also assigns Layer 1 and Layer 2 taxonomy codes from the misconception taxonomy (Appendix C). For each confirm response, the pipeline returns one of three labels: *verified*, *partial*, or *likely guess*. Every classification also includes a credit score (0, 50, or 100), a confidence level, an evidence quote extracted from the student's text, and a reasoning summary.

**Rubric for Open_Diagnose classification.** The three-way diagnose classification follows an explicit decision tree (Appendix A, Table A.6). In plain terms:

- **Misconception.** The student articulates a stable incorrect rule or mental model. The reasoning in the open-ended response aligns with and supports the wrong answer choice, reflecting a specific, identifiable wrong belief rather than an absence of knowledge. For example, a student who explains that "lower inflation means prices go down" holds a misconception about the distinction between the inflation rate and the price level.

- **Knowledge gap.** The student cannot articulate the relevant concept. Responses in this category include explicit statements of uncertainty ("I don't know," "I guessed"), off-topic explanations that do not address the question, or responses too brief to interpret. The key distinction from a misconception is the absence of an active incorrect model: the student lacks knowledge rather than holding a wrong belief.

- **Selection error.** The student's explanation reveals correct understanding of the concept despite having selected the wrong anchor answer. Typical patterns include self-correction during the explanation, reasoning that is consistent with the correct answer rather than the chosen answer, or indications that the student misread the question format (e.g., reversed True/False logic). Selection errors suggest that the error was format-induced or attention-related, not conceptual.

**Rubric for Open_Confirm classification.** The confirm rubric assesses the depth of understanding behind a correct anchor response:

- **Verified.** The student provides a coherent, mechanism-based explanation that demonstrates genuine understanding of why the correct answer holds. The explanation identifies the relevant causal or logical relationship, not just the correct conclusion.

- **Partial.** The student's explanation contains some correct elements but omits the key mechanism or relies on incomplete reasoning. For example, a student who states that bond prices and interest rates "move in opposite directions" without explaining why (e.g., the fixed coupon becomes less attractive relative to new higher-yielding bonds) would receive a partial classification.

- **Likely guess.** The student cannot explain the concept despite selecting the correct answer. Responses in this category include admissions of guessing ("I wasn't sure, I just picked it"), generic non-mechanistic text ("I think I learned this somewhere"), or explanations that contradict the correct answer.

**Table 4.2: Rubric Summary for Open_Diagnose and Open_Confirm Scoring**

| Response Type | Label | Definition |
| --- | --- | --- |
| Diagnose | Misconception | Student articulates a specific incorrect rule or mental model aligned with the wrong answer |
| Diagnose | Knowledge gap | Student cannot articulate the concept; admits uncertainty or provides off-topic/empty response |
| Diagnose | Selection error | Student's explanation reveals correct understanding despite selecting the wrong answer |
| Confirm | Verified | Student provides coherent, mechanism-based explanation of why the correct answer holds |
| Confirm | Partial | Explanation contains some correct elements but omits the key causal mechanism |
| Confirm | Likely guess | Student cannot explain the concept; admits guessing or gives generic non-mechanistic response |

**Consistency controls.** Three design features support classification consistency. First, the scoring rubric is tied to the misconception taxonomy (Appendix C): every misconception classification must map to a specific Layer 1 family code, which constrains the model to recognized categories rather than ad hoc labels. Second, the pipeline enforces a constrained JSON output schema, requiring each classification to include a diagnosis type, taxonomy codes (where applicable), credit score, confidence level, evidence quote, and reasoning summary. Responses that do not parse into the required schema are flagged for manual review. Third, the scoring model (GPT-4.1, OpenAI, accessed via OpenRouter) was selected through an 11-model concordance protocol (Appendix D) that evaluated agreement across candidate models on a shared set of 20 responses. The protocol assessed schema compliance, parse error rates, classification nuance, and inter-model agreement on disputed classifications. We describe this process in terms of agreement rather than accuracy because no independently labeled ground truth exists for these open-ended responses; the concordance protocol measures consistency across models, not accuracy against a human-rated reference standard.

**Limitations of automated classification.** Three limitations of the scoring pipeline should be noted. First, short student answers reduce diagnostic signal: a two-word response provides less evidence for classification than a multi-sentence explanation, and the model must work with whatever text the student provides. Second, classification is interpretive: the boundary between a weak misconception and a knowledge gap, or between a partial understanding and a likely guess, involves judgment, and the model's judgment may differ from a human rater's on borderline cases. The model assigned "high" confidence to 96.8% of its own classifications, which may indicate that it underuses the uncertainty channel. A human-AI agreement study on a stratified subsample would strengthen reliability evidence. Third, SDM conditioning applies: the diagnose and confirm subsamples are not random cross-sections of the class but are triggered by specific combinations of correctness and confidence (see the conditioning caveats in Section 7). Prevalence estimates from these subsamples should not be generalized to the full class without accounting for this selection.

All item selection decisions in the SDM-10 are deterministic and rule-based; the language model is used only for open-ended response classification.

---

## 5. Platform and Governance Design

The platform architecture (Next.js 14, PostgreSQL 15, PgBouncer) and student authentication protocol (one-way SHA-256 hashing with per-course pepper) are described in Appendix F.

### 5.1 Consent Mechanics

The platform implements a two-part consent flow before data collection:

1. **Course requirement acknowledgment (mandatory).** Students review and acknowledge that the assessment is a required course assignment and that their answers are not graded for correctness.

2. **Research consent (voluntary).** Students are presented with a separate research consent screen asking whether their de-identified responses may be used for research evaluating course learning outcomes. The screen explicitly states that declining has no impact on grades, course standing, or access to feedback. The consent decision, timestamp, and version identifier are recorded. Students may withdraw research consent at any time by contacting the course instructor; withdrawn data are excluded from subsequent analyses.

The consent flow keeps the course requirement separate from the research opt-in: a student can complete the assessment (fulfilling the course obligation) without consenting to research use. This separation is the main safeguard of voluntariness. Before the consent flow, students view a short orientation video explaining the purpose, structure, and non-graded nature of the assessment (see Appendix E). A privacy notice displayed during onboarding describes the hashing process, data separation, and the student's right to withdraw.

**Consent accounting.** Of the 431 students who submitted completed assessments, 354 (82.1%) provided affirmative research consent. Zero students explicitly declined. The remaining 77 (17.9%) have NULL consent status because they completed the assessment before the research consent screen was deployed on the platform (see "Pre-consent cohort" in Section 6.1). Following standard research ethics practice, we treat NULL-consent students as non-consented for all research analyses: if there is no affirmative "yes," we treat it as non-consent, regardless of the reason.

**Representativeness check.** The consented subsample looks similar to the full submitted cohort on observed score distributions, as summarized below. This comparison is descriptive; we did not run a formal equivalence test.

**Table 5.1: Consented vs. Full Cohort Comparison**

| Metric | Consented (n = 354) | All Submitted (N = 431) | Difference |
| --- | --- | --- | --- |
| Anchor mean | 67.0% | 67.4% | 0.4 pp |
| Anchor SD | 17.9% | 17.9% | 0.0 pp |
| Median | 69.2% | 69.2% | 0.0 pp |
| Below 50% band | 12.7% | 12.3% | 0.4 pp |
| 80%+ band | 24.9% | 25.6% | 0.7 pp |

The small differences (all < 1 percentage point) suggest that the NULL-consent cohort reflects deployment timing rather than a self-selected subgroup, though we cannot rule out unobserved differences between consenters and non-consenters.

**Default selection.** The consent screen presented "Yes, I consent" as the default selection. While the 0% explicit decline rate is consistent with students having no objection to de-identified research use, the default-yes design may have inflated the consent rate through status quo bias. If Paper 2 proceeds, this will be addressed by implementing a forced active choice (no default selection) in the post-assessment consent screen.

All analyses in this paper use only the research-consented subset (n = 354). For instructional purposes, all submitted students receive SDM-10 diagnostics and dashboard feedback regardless of consent status; consent governs only research dissemination, not educational use.

---

## 6. Pilot Operations and Descriptive Statistics

Below we report operational statistics from the pre-course assessment window (February 2–10, 2026) as background for interpreting the SDM-10 diagnostic findings. These are descriptive summaries of how the assessment was administered, not inferential research results. We make no subgroup comparisons, hypothesis tests, or claims about population parameters in this section. Subgroup analyses are deferred to Paper 2, contingent on IRB approval for human-subjects research.

### 6.1 Participation and Completion

The Spring 2026 QUIN 102 roster included 653 students across all sections. Of these, 443 onboarded onto the platform and 431 submitted completed assessments (a 97.3% completion rate among onboarded students). Twelve students abandoned the assessment without submission; all abandoned sessions had been idle for more than 45 hours at the time of window closure. All 431 submitted students received SDM-10 items. Of these, 300 consented students (84.7%) received the full 10-item module; 54 received between five and nine items due to insufficient high-priority subcategories in their anchor profile (the algorithm could not fill all 10 slots when a student's anchor performance was uniformly strong or weak across subcategories).

**Table 6.0: Counts and Inclusion Rules**

| Stage | n | Rule |
| --- | --- | --- |
| Course roster | 653 | Total enrolled across all QUIN 102 sections (context only) |
| Enrolled (onboarded) | 443 | Created platform account with hashed ID |
| Submitted | 431 | Completed anchor + SDM-10 during assessment window |
| Abandoned | 12 | Onboarded but did not submit; idle > 45 hours |
| Consented (research) | 354 | Affirmative "Yes" on research consent screen |
| Declined | 0 | Explicit "No" on research consent screen |
| Pre-consent cohort (NULL consent) | 77 | Completed before consent screen deployed; treated as non-consented (see below) |
| Withdrawn | 0 | No withdrawals received during the study period |
| **Research-consented analysis set** | **354** | **Inclusion rule: research_consent = true AND submitted_at IS NOT NULL** |

**Data sets used in this paper.** Four population counts define the operational funnel: the course roster (653, reported for context only and never used as a denominator); platform-onboarded students (443); all submitted students (N = 431, the operational denominator for all descriptive figures and chart data); and the research-consented analysis set (n = 354, used for all analytic tables and statistics in Sections 4, 6, and 7). The assessment ran February 2-10, 2026, and the submitted cohort for operational figures is N = 431. Default rule: analytic results use n = 354; descriptive figures use N = 431.

**Pre-consent cohort (NULL consent).** Seventy-seven students completed the assessment before the research consent screen was deployed on the platform. Because no affirmative consent was recorded, these students are excluded from the research-consented analytic dataset (n = 354) but are included in the submitted set (N = 431) for descriptive figures. All 431 submitted students receive SDM-10 diagnostics and dashboard feedback as part of normal course operations.

![Figure 3. Daily Enrollment and Completion (Feb 2–10, 2026). Course roster: 653. Platform onboarded: 443. Submitted: 431.](figures/fig3_enrollment_timeline.png)

### 6.2 Sample Demographics

The following figures describe the submitted sample (N = 431) for operational context only. Table 6.1 presents selected demographics for the consented subset (n = 354). No subgroup performance comparisons are reported in Paper 1.

To protect student privacy, demographic cells with fewer than 10 respondents are collapsed into an "Other/Prefer not to say" grouping or reported as suppressed (< 10), to reduce re-identification risk.

**Table 6.1: Sample Demographics (Consented, n = 354)**

| Characteristic | n | % |
| --- | --- | --- |
| Female | 213 | 60.2% |
| Male | 139 | 39.3% |
| Other/Prefer not to say | < 10 (suppressed) | (suppressed) |
| English first language | 278 | 78.5% |
| Spanish first language | 44 | 12.4% |
| Other languages | 32 | 9.0% |

![Figure 7. Sample Demographics (N = 431, submitted cohort). Panels show gender, age range, race/ethnicity, work experience, and first-generation status. Categories with fewer than 10 respondents are suppressed.](figures/fig7_demographics.png)

![Figure 8. Financial Background and Self-Assessment (N = 431, submitted cohort). Panels show frequency of financial stress and self-rated financial knowledge. Categories with fewer than 10 respondents are suppressed.](figures/fig8_financial_background.png)

---

## 7. Results

**Important caveat:** The SDM-10 open-ended items are administered only to students whose anchor responses triggered high-priority subcategories (incorrect + high confidence for diagnose, or correct + low confidence for confirm). The open-ended sample therefore reflects the tails of the confidence-accuracy distribution, not a random cross-section of the class. Misconception prevalence estimates from the SDM-10 should not be generalized to all submitted students without accounting for this conditioning.

All analyses in this section are restricted to the research-consented subset (n = 354, 82.1% of all submitted students).

### 7.1 Anchor Score Distribution and Domain Breakdown

The following score summaries provide operational context for interpreting SDM-10 diagnostic patterns. They are not inferential claims about population-level financial literacy. Figures 1-6 summarize the full submitted cohort (N = 431), while tables report research-consented analyses (n = 354).

For the consented subset (n = 354), the mean anchor score was 67.0% (SD = 17.9%, median = 69.2%) across 26 scored knowledge items. Domain-level means were:

**Table 7.1: Mean Accuracy by Domain (Consented, n = 354)**

| Domain | Items | Mean % Correct |
| --- | --- | --- |
| Behavioral and Risk Management Knowledge | 4 | 72.4% |
| Borrowing, Interest Rates, and Financial Numeracy Knowledge | 10 | 69.2% |
| Risk and Return Knowledge | 12 | 63.4% |

Risk and Return Knowledge was the weakest domain, pulled down mostly by low performance on Q38 (Inflation Protection) and Q6 (Inflation Lowering). However, this domain also has the highest selection error count (56), so some of the apparent weakness may be artifactual.

![Figure 2. Domain-Level Performance Comparison (N = 431, submitted cohort). Error bars show ±1 SD. Dashed line indicates overall mean (66.4%).](figures/fig2_domain_performance.png)

**Table 7.2: Score Distribution by Performance Band (Consented, n = 354)**

| Band | n | % of Sample | Status |
| --- | --- | --- | --- |
| Below 50% | 45 | 12.7% | At risk |
| 50–69% | 161 | 45.5% | Developing |
| 70–79% | 60 | 16.9% | Proficient |
| 80% and above | 88 | 24.9% | Strong |

The largest segment (45.5%) falls in the 50–69% band. Combined with the 12.7% below 50%, over half the consented sample has partial or incomplete financial literacy knowledge.

![Figure 1. Pre-Course Overall Score Distribution (N = 431, submitted cohort). Dashed line shows mean (66.4%). The modal bin (60-69%) contains 28.5% of students.](figures/fig1_score_distribution.png)

![Figure 6. Item Difficulty Ranking by Subdomain (N = 431, submitted cohort). Items colored by difficulty tier: green (strong, >=70%), yellow (moderate, 50–69%), red (weak, <50%).](figures/fig6_item_difficulty.png)

The consented SDM-10 mean score (64.4% across 3,340 responses) was lower than the anchor mean (67.0%), which confirms that the adaptive selection algorithm was in fact targeting subcategories where students were weaker. These scores provide context for interpreting the SDM-10 diagnostic findings but are not the main analytical focus of this paper.

The median assessment duration was 18.1 minutes (consented subset). The mean duration (217.2 minutes) was heavily skewed by a small number of sessions left open without completion, including sessions that remained idle for multiple days. The median is the more representative measure of active assessment time.

![Figure 4. Assessment Submission Time Distribution (N = 431, submitted cohort). Peak submissions occurred between 2–10 PM CST (Chicago time).](figures/fig4_submission_time.png)

### 7.2 Confidence Calibration Patterns

![Figure 5. Confidence Calibration Categories (N = 431, submitted cohort). Overconfidence Index (OI) = average normalized confidence − average correctness. Thresholds: underconfident (OI < −0.10), well-calibrated (−0.10 ≤ OI < 0.10), moderately overconfident (0.10 ≤ OI < 0.30), highly overconfident (OI ≥ 0.30).](figures/fig5_confidence_calibration.png)

Figure 5 presents the distribution of students across confidence calibration categories based on the alignment between average confidence ratings and anchor accuracy. Calibration patterns inform the SDM-10's adaptive logic: on items where a student answers incorrectly with high confidence (overconfident pattern), an Open_Diagnose follow-up is triggered; on items where a student answers correctly with low confidence (underconfident pattern), an Open_Confirm follow-up is triggered instead. Each anchor item triggers at most one of these alternatives. The distribution shows that the majority of students fall within calibrated or mildly overconfident ranges, with a smaller tail of strongly overconfident students whose high-confidence errors drive the diagnose subsample analyzed in Sections 7.3–7.6.

### 7.3 Diagnostic Classification: Diagnose Composition

**SDM conditioning caveat.** The diagnose results below reflect students who answered incorrectly with high confidence (the SDM-10 diagnose trigger condition). These rates characterize the composition of high-confidence errors, not class-wide misconception prevalence.

Of the 354 consented students who submitted the assessment, 306 (86.4%) received at least one open-ended item, generating 781 open-ended responses. The AI scoring pipeline processed 778 of these responses with zero errors.

**Table 7.3: SDM-10 Open-Ended Summary (Consented Sample)**

| Metric | Value |
| --- | --- |
| Consented students completing SDM-10 | 354 |
| Students receiving open-ended items | 306 (86.4%) |
| Total open-ended responses | 781 |
| Responses scored by AI | 778 |
| Diagnose responses scored | 493 |
| Confirm responses scored | 285 |
| AI scoring model | GPT-4.1 (OpenAI via OpenRouter) |
| AI scoring error rate | 0 / 778 (0%) |

**Response Quality.** Among diagnose responses, 89.2% were substantive (providing reasoning beyond "I don't know" or blank responses), which points to strong student engagement with the open-ended format even though it was ungraded. Confirm responses showed even higher quality at 93.8% substantive. This engagement rate is worth noting because students were not told that the SDM-10 was a separate module from the anchor assessment and had no grade incentive to write detailed explanations.

**Table 7.4: Diagnose Three-Way Classification (Consented, n = 493 scored, 479 classified)**

| Classification | n | % of classified | Interpretation |
| --- | --- | --- | --- |
| Misconception | 258 | 53.9% | Active incorrect belief observed |
| Selection error | 153 | 31.9% | Correct understanding, wrong answer |
| Knowledge gap | 68 | 14.2% | Acknowledged uncertainty, no model |
| Unclassified | 14 | --- | Ambiguous or insufficient for three-way |

Of the 493 AI-scored diagnose responses, 479 (97.2%) were classified into the three-way taxonomy. Over half of classified responses (53.9%) reflected identifiable misconceptions: specific wrong mental models that can be targeted through instruction. Nearly a third (31.9%) were selection errors, meaning the student showed correct understanding in the explanation despite picking the wrong anchor answer. This matters because it means that among students who answered incorrectly with high confidence (the SDM-10 diagnose trigger condition), almost one in three does not actually hold a misconception; instead, something about the item format or phrasing caused the wrong answer. The 14 unclassified responses had ambiguous explanations that did not clearly fit any category. These rates reflect the high-confidence-incorrect subsample, not the full class (see Section 7 caveat).

**Table 7.5: Diagnose Classification by Item (Consented, items with n >= 5, sorted by diagnose volume)**

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

Items with the highest misconception density (> 70%) are Q12 (Health Insurance, 82%), Q30 (Risk-Return Tradeoff, 82%), Q6 (Inflation Lowering, 79%), Q35 (Risk-Return, 78%), and Q32 (Long-Term Returns, 73%). These represent topics where student errors are overwhelmingly driven by active incorrect beliefs rather than confusion or carelessness, and where targeted instructional attention has the clearest rationale. Items with the highest selection error rates are Q9 (83%, small n), Q36 (81%), Q14 (71%), and Q3 (46%), all sharing True/False format with negative or double-negative phrasing.

### 7.4 Diagnostic Classification: Confirm Composition

**SDM conditioning caveat.** The confirm results below reflect students who answered correctly but with low confidence (the SDM-10 confirm trigger condition). The 13.7% guess rate applies to that conditioned subsample, not to all correct responses.

**Table 7.6: Confirm Three-Way Classification (Consented, n = 285)**

| Classification | n | % |
| --- | --- | --- |
| Verified | 127 | 44.6% |
| Partial | 119 | 41.8% |
| Likely guess | 39 | 13.7% |

Among students who answered correctly but with low confidence, 44.6% showed genuine understanding in their explanation (verified), 41.8% showed partial understanding, and 13.7% were classified as likely guesses: their explanations showed no understanding of the underlying concept despite selecting the correct answer. This result supports the SDM-10's approach of probing low-confidence correct answers. On items where guessing is plausible, anchor scores alone overcount how many students actually understand the material.

**Table 7.7: Confirm Items with Highest Likely-Guess Rates (Consented, confirm n >= 5)**

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

**Table 7.8: Credit Score Distribution (All Consented Scored, n = 778)**

| Credit Score | n | % |
| --- | --- | --- |
| 100 (full diagnostic value) | 541 | 69.5% |
| 50 (partial diagnostic value) | 129 | 16.6% |
| 0 (no diagnostic value) | 108 | 13.9% |

### 7.5 Misconception Clusters by Domain

**SDM conditioning caveat.** All per-item rates below are conditional on the SDM-10 diagnose trigger (incorrect + high confidence); they characterize the composition of high-confidence errors, not class-wide misconception prevalence.

The AI-assisted classification turned up distinct misconception patterns across assessment domains.

**Inflation and Purchasing Power.** The most common misconception was INF-01 (lower inflation equals falling prices), which appeared in 42 consented diagnose responses, making it the single most frequent misconception code in the dataset. Students consistently confused a decrease in the rate of price increase with an actual decrease in prices. On Q7 (which group is most hurt by inflation), empathy-driven reasoning (INF-05, n = 17) led students to pick "young couples" because they identified personally with that demographic instead of thinking through fixed-income vulnerability.

**Risk, Return, and Diversification.** On Q36 (diversification principle), 81.0% of diagnose responses from consented students were classified as selection errors, the highest selection error rate of any item. Students who answered incorrectly could explain why spreading money across assets reduces risk, but selected "False" on the True/False item, likely due to negation confusion or overthinking the word "all." On Q35 (risk-return relationship), students used real-world counterexamples from non-financial domains to argue against the general financial principle (RISK-10). They were reasoning by analogy rather than applying domain-specific knowledge.

**Insurance and Risk Management.** On Q12 (primary purpose of health insurance), 82.1% of diagnose responses reflected the misconception that routine care is the primary function of insurance (INS-01, n = 23 of 28). Many students used frequency-over-severity reasoning: because routine visits are more common, they must be the primary purpose (INS-02). Q13 (deductible definition) showed a high knowledge gap rate (31.6%), pointing to unfamiliarity with this technical insurance term rather than a specific misconception.

**Borrowing and Credit.** Credit report knowledge (Q10) showed a 41.0% selection error rate. Many students actually had the correct understanding but were tripped up by the question's "which is FALSE" framing. On Q2 (mortgage term length and total interest), 31.8% of incorrect responses were selection errors.

**Table 7.9: Top 10 Misconception Codes (Consented Diagnose Responses)**

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

Five dominant patterns emerged across the assessment:

1. **Inflation mechanics confusion**: centered on the distinction between lower inflation rates and lower prices (Q6, Q7), representing the single largest misconception cluster
2. **Risk-return reasoning from exceptions**: students cited specific counterexamples to invalidate general financial principles (Q30, Q35), using inductive reasoning where deductive understanding is required
3. **Insurance purpose confusion**: equating frequency of use with primary function (Q12), rooted in consumer experience bias
4. **Empathy-driven financial reasoning**: picking answers based on personal identification with demographic groups rather than economic logic (Q7)
5. **Format-induced errors**: particularly on True/False items (Q36, Q2) where correct knowledge led to incorrect answers due to negation confusion or reversed logic

### 7.6 Selection Error Patterns and Item Revision Targets

**SDM conditioning caveat.** The selection error rates below are conditional on the SDM-10 diagnose trigger (incorrect + high confidence). They characterize the composition of errors within that subsample rather than cohort-wide rates.

The selection error finding is one of the most important results in this paper. Three items showed selection error rates above 30%:

**Table 7.10: High Selection Error Items (Consented Diagnose)**

| Item | Topic | Format | SE Rate | n | Implication |
| --- | --- | --- | --- | --- | --- |
| Q36 | Diversification principle | T/F | 81.0% | 34/42 | T/F format confounds; consider MCQ revision |
| Q10 | Credit reports (which is FALSE) | MCQ | 41.0% | 16/39 | Negation framing causes errors |
| Q37 | Insurance types | MCQ | 41.2% | 7/17 | Item phrasing ambiguity |
| Q2 | Mortgage term and total interest | T/F | 31.8% | 7/22 | T/F reversal common |

**The Q36 case study.** Q36 merits special attention. This True/False item asks whether placing savings in multiple locations (bank, stocks, and bonds) is safer than putting all savings in one place. The correct answer is True. Among consented students, 127 of 354 (35.9%) answered incorrectly. When the SDM-10 probed 42 of the diagnosed students who were both incorrect and confident, 34 (81%) demonstrated correct understanding of diversification. Typical student explanations confirmed they understood the principle of spreading risk across asset classes but had misread or second-guessed the question. In this sample, the pattern is consistent with the True/False format or the negative phrasing, not a lack of knowledge, driving the errors. Q36 is a candidate for revision in the post-assessment: rephrasing it as a standard multiple-choice item may reduce format-induced errors.

The upshot is that, in this sample, raw MCQ scores appear to understate student knowledge on these items. When a student answers incorrectly but explains the concept correctly, the anchor score of 0% misrepresents what they actually know.

### 7.7 AI Scoring Validation

Prior to deploying AI scoring, we conducted a manual analysis of response patterns on a calibration sample. Table 7.11 compares the expected dominant misconception rates from that manual analysis with the AI-scored classifications for the consented sample. Because we lack independently labeled ground truth, these comparisons describe alignment between manual expectations and model output, not classification accuracy in the traditional sense.

**Table 7.11: Manual Prediction vs. AI Scoring Results (Consented Sample)**

| Item | Metric | Manual Expectation | AI Classification | Alignment |
| --- | --- | --- | --- | --- |
| Q6 | lower_inflation_means_lower_prices | 78% | 56% | Directionally aligned. AI distributed more to employment_link (21%). |
| Q36 | Selection error rate | 62% | 81% | Directionally aligned. Higher than expected. |
| Q10 | employer_use_confusion | 33% | 31% | Near-exact match. |
| Q12 | routine_care_primary | 64% | 56% | Directionally aligned. Slight redistribution to frequency_over_severity. |
| Q30 | exceptions_disprove_rule | 67% | 71% | Directionally aligned. Slightly higher than expected. |

All five comparisons showed directional alignment between manual expectations and AI output. Three showed near-exact agreement (Q10, Q30, Q12), and two showed the AI distributing classifications more granularly across subtags within the same misconception family (Q6, Q36). The inter-model concordance protocol (Appendix D) and the alignment patterns in Table 7.11 are consistent with the scoring model producing classifications that track our human-defined categories, though we cannot rule out shared biases between the manual analysis and the AI model's training data.

---

## 8. Discussion

### 8.1 Key Findings

In this sample, the SDM-10 diagnostic findings suggest that standard multiple-choice assessment scores both overstate and understate what students know about financial literacy, and they appear to do so in patterned ways. All SDM-10 prevalence rates reported in Section 7 come from conditioned subsamples (diagnose items target students who answered incorrectly with high confidence; confirm items target students who answered correctly with low confidence), not random cross-sections of the class. Four main findings stand out.

First, **selection errors materially distort MCQ scoring.** Among students who answered incorrectly with high confidence, 31.9% of classified responses showed correct understanding of the underlying concept. On individual items, selection error rates reached 81% (Q36, diversification), 41% (Q10, credit reports), and 32% (Q2, mortgages). These students receive a score of zero on the anchor assessment despite appearing to know the material. The pattern is concentrated on True/False items and negation-framed MCQ items, which is consistent with item format, not student knowledge, as the driver.

Second, **"false correct" guesses inflate anchor scores.** Among students who answered correctly but with low confidence, 13.7% were classified as likely guesses: they could not explain the concept they supposedly answered correctly. On individual items like Q29 (33.3% guess rate) and Q13 (31.8%), anchor scores may overcount how many students genuinely understand the topic.

Third, **misconception patterns are domain-specific and actionable for instruction.** Five dominant clusters came through: inflation mechanics confusion (INF-01, the most frequent code at n = 42), risk-return reasoning from exceptions (RISK-02), insurance purpose confusion (INS-01/INS-02), empathy-driven reasoning (INF-05), and format-induced errors. These clusters are specific enough to suggest targeted instructional changes. Because the SDM-10 selects for high-priority responses, these rates should not be extrapolated to the full class without adjusting for item-level coverage (see Limitation 2).

Fourth, **the three-way classification adds diagnostic information that MCQ scores alone do not provide.** The SDM-10's classification (misconception/knowledge gap/selection error for diagnose; verified/partial/likely guess for confirm) offers a way to distinguish students who may need conceptual correction from those who may need format remediation or foundational instruction. This information is not available from the anchor score alone.

### 8.2 Course Improvement Recommendations

The diagnostic findings from Section 7 lead to 10 specific recommendations for QUIN 102 instruction and instrument revision. Each recommendation is tied to a specific finding and evidence source; the final column describes how Paper 2, if approved, would evaluate whether the change had a measurable effect.

**Table 8.1: Course Improvement Recommendations**

| # | Finding | Evidence | Recommended Change | Paper 2 Evaluation |
| --- | --- | --- | --- | --- |
| 1 | 79% of high-confidence errors on Q6 reflect confusion between inflation rate and price level (INF-01, 42/53 classified) | Table 7.5, Q6 row; Table 7.9, top code | Dedicate explicit instruction to distinguishing "lower inflation" (slower price increases) from "falling prices" (deflation), using rate-vs-level visual aids | Compare pre-post INF-01 prevalence on Q6 diagnose responses |
| 2 | 82% of high-confidence errors on Q12 reflect belief that routine care is insurance's primary function (INS-01/INS-02, 23/28) | Table 7.5, Q12 row | Add module on health insurance purpose: catastrophic protection vs. routine care, using frequency-vs-severity framing | Compare pre-post Q12 accuracy and INS-01 prevalence |
| 3 | 82% (Q30, 14/17) and 78% (Q35, 7/9) of high-confidence errors reflect reasoning-from-exceptions (RISK-02) | Table 7.5, Q30/Q35 rows | Introduce risk-return principle using financial-domain examples (historical asset class returns) rather than abstract statements | Compare pre-post RISK-02 prevalence across Q30 and Q35 |
| 4 | 81% of high-confidence errors on Q36 are selection errors caused by T/F format with negation (34/42) | Table 7.10, Q36 row; Section 7.6 case study | Revise Q36 from True/False to standard MCQ format for the post-assessment | Compare Q36 selection error rate before and after revision |
| 5 | 41% of high-confidence errors on Q10 are selection errors caused by "which is FALSE" negation framing (16/39) | Table 7.10, Q10 row | Revise Q10 to remove negation framing (rewrite as positive identification) | Compare Q10 selection error rate before and after revision |
| 6 | Q29 shows 46% misconception rate (INT-06, 11/24) and 33% guess rate among correct respondents (4/12) | Table 7.5, Q29 row; Table 7.7, Q29 row | Add bond pricing segment explaining inverse interest-rate/price relationship with worked numerical examples | Compare pre-post Q29 accuracy, INT-06 prevalence, and confirm guess rate |
| 7 | Q13 shows 32% knowledge gap rate (6/19), reflecting unfamiliarity with deductible terminology rather than a specific misconception | Table 7.5, Q13 row | Add insurance terminology module covering deductible, premium, copay, and out-of-pocket maximum definitions | Compare pre-post Q13 knowledge gap rate |
| 8 | Q9 (83% SE, 5/6) and Q14 (71% SE, 5/7) show format-driven errors disproportionate to conceptual misunderstanding | Table 7.10, Q9/Q14 rows | Flag Q9 and Q14 for format revision; consider rephrasing or converting to MCQ | Compare SE rates before and after revision |
| 9 | Q2 (36% KG, 8/22) and Q8 (56% misconception INT-05, 19/34) reveal gaps in borrowing mechanics and loan negotiation knowledge | Table 7.5, Q2/Q8 rows | Add credit-literacy instructional module covering mortgage term/interest tradeoffs and consumer loan negotiation | Compare pre-post accuracy on Q2 and Q8; track INT-05 prevalence |
| 10 | Five dominant misconception clusters emerged across the assessment (Section 7.5) | Section 7.5 cross-item patterns; Figure 5 | Generate per-student misconception profile from pre-course data; distribute targeted review materials before mid-term | Track within-subject misconception resolution rate (pre-post comparison of individual student profiles) |

Recommendations 1–3 and 6–7 target instructional content; recommendations 4–5 and 8 target instrument revision; recommendation 9 targets both; recommendation 10 targets instructional delivery. All instructional changes are planned for implementation before the post-assessment window, so that Paper 2, contingent on IRB approval, could compare pre-post rates on the specific metrics identified above.

### 8.3 Implications for Risk Literacy Measurement

Because the instrument focuses heavily on risk-related items (diversification, insurance, risk-return tradeoffs, crisis awareness) and pairs them with the SDM-10 diagnostic layer, it may capture aspects of risk literacy that traditional knowledge-only measures miss. The finding that students can often explain correct risk reasoning but still pick wrong answers (especially on diversification items) suggests that, at least in this sample, the gap between what students understand about risk and their ability to translate that understanding into correct MCQ responses may be wider in the risk domain than elsewhere.

### 8.4 Oral Diagnostics as Future Modality

A natural next step for the SDM-10 framework would be an oral diagnostic modality: a structured, AI-mediated interview built around each student's highest-priority SDM findings. Written open-ended prompts can produce thin responses that limit diagnostic signal, but a short conversation can adaptively probe reasoning, separate misreading from conceptual misunderstanding, and classify misconceptions by depth (for example, shallow misconceptions that collapse after one counterexample versus deep structural misunderstandings that hold up under scaffolding). This modality would complement the baseline assessment by adding depth classification and resolution tracking, using the existing misconception taxonomy and rubric applied to transcripts, rather than replacing the anchor assessment.

The oral diagnostic would be designed as a constrained clinical-interview script with branching logic: a brief warm-up, then two to three targeted probes per participant based on their top misconceptions, using new scenarios rather than repeating original items, followed by structured follow-ups designed to test self-correction and persistence. Because oral assessment introduces additional considerations (including speaking anxiety, language effects, transcription error, and privacy risks associated with voice data), this modality is proposed only as a small IRB-reviewed volunteer pilot (~20–30 students) to quantify incremental diagnostic value before any scaling. This oral modality is future work and would be implemented only under IRB review with opt-in participation and a non-voice alternative path.

---

## 9. Limitations

Several limitations should be kept in mind when reading these findings.

1. **No causal claims.** Because we are reporting instrument design and pilot diagnostic outputs from a single pre-course assessment, no causal claims about instructional effectiveness can be drawn from Paper 1. Establishing causality requires paired pre-post data, which we plan to report in Paper 2.

2. **SDM subsample conditioning.** The SDM-10 open-ended items are administered only to students whose anchor responses triggered high-priority subcategories (incorrect + high confidence, or correct + low confidence). Misconception prevalence estimates reflect the tails of the confidence-accuracy distribution, not a random cross-section. Per-item coverage ranges from approximately 20% (Q32) to 90% (Q7). Extrapolation to the full submitted cohort is only appropriate when item-level coverage exceeds 50%.

3. **Single scoring model.** A single LLM (GPT-4.1) classified all open-ended responses. We picked this model through an 11-model concordance protocol (Appendix D), and it had zero schema violations and zero parse errors across the 778 scored consented responses. Still, automated classification may diverge from human judgment on borderline cases. The model assigned "high" confidence to 96.8% of its own classifications, which may mean it underuses the uncertainty channel. A human-AI agreement study on a stratified subsample would strengthen reliability evidence.

4. **No publishable subgroup claims.** The pre-course assessment did collect demographic and financial background data, but we defer all subgroup analyses (e.g., by gender, race/ethnicity, first-generation status) to Paper 2. We plan to submit an IRB application for human-subjects research; until approval is granted, no subgroup comparisons or inferential claims appear in this report.

5. **Possible lookup between anchor and SDM.** The SDM-10 is administered immediately after the anchor assessment in the same session. Students may look up answers between the anchor and SDM items, potentially inflating SDM scores. The 100% SDM completion rate and the lower SDM mean score (64.4% vs. 67.0% anchor) provide some evidence against widespread lookup behavior, but the possibility cannot be excluded.

6. **Consent attrition.** Seventy-seven pre-consent cohort students (17.9% of the submitted cohort) have NULL consent status because they completed the assessment before the research consent screen was deployed. No student actively opted out (see Section 5.1). We exclude the pre-consent cohort from all research analyses per standard practice (absence of affirmative consent is treated as non-consent). A representativeness check (Section 5.1) shows the consented sample is similar to the full submitted cohort on score distributions, so consent-related selection bias is unlikely. However, the reduction to 354 consented students slightly reduces statistical power for item-level analyses with small cell sizes.

7. **Early-window submission types.** Early-window submission types resulting from technical adjustments during the first days of the assessment window account for approximately 20% of submissions. We reviewed and retained these submissions, but they may affect comparability for a subset of respondents.

8. **Variant assignment mismatch.** A software defect caused 40 mismatched SDM variant assignments across 36 students due to a stale anchor score synchronization issue. We identified and filtered the mismatched responses using an anchor_score and confidence cross-check. The bug was subsequently fixed, and the misconception taxonomy is unaffected because we verified that all analyzed responses correspond to correctly triggered variants.

9. **Default consent selection.** The research consent screen presented "Yes, I consent" as the default selection. While no student actively chose to decline (as noted in Section 5.1), the default-yes design may have inflated the consent rate through status quo bias. The consent rate (82.1%) should be interpreted with this limitation in mind. Paper 2, if conducted, would use a forced active choice design with no default selection.

---

## 10. Planned Validation Study (Paper 2 Protocol Preview)

**Scope boundary.** This independent study paper documents instrument and platform development plus pilot operations. Confirmatory evaluation and publishable analyses are planned for a follow-up IRB-reviewed study. Nothing in this section should be read as asserting that IRB approval has been obtained or that the analyses described below will necessarily be conducted.

The pilot reported in Sections 4–7 produced several outputs that directly shape the planned Paper 2 design: instrument revision targets (Section 7.6), a misconception taxonomy for pre-post coding (Appendix C), and baseline coverage estimates (Table 7.5) that inform statistical power for item-level comparisons.

If approved by the Loyola University Chicago IRB, the following study is planned. Contingent on IRB approval, a post-course assessment would be administered during the last week of the Spring 2026 semester, using the same 40-item anchor assessment and SDM-10 module with an IRB-reviewed consent process for human-subjects research. If approved, paired pre-post analyses would compute learning gains as the difference between post-course and pre-course scores for each student, both overall and by domain. Paired t-tests (or nonparametric equivalents) would assess the statistical significance of mean gains, with standardized effect sizes (within-student Cohen's d) reported.

If approved, a multivariable regression framework is planned to model heterogeneity in learning gains as a function of baseline covariates, including demographics, financial background, work status, financial stress, self-rated knowledge, prior product experience, and preference-item responses (Q15–Q28). Separate domain-specific models would examine whether the predictors of learning gains differ across borrowing, investment, and risk management.

Psychometric validation is planned if the sample size is large enough and the study receives IRB approval. Exploratory Factor Analysis would assess dimensionality within and across domains, Cronbach's alpha would gauge internal consistency, and item-level statistics would flag items that need refinement in future administrations. Contingent on approval, demographic and financial background subgroup comparisons (by gender, race/ethnicity, first-generation status, work experience, financial stress) would be reported with appropriate transparency practices for multiple comparisons.

A key part of Paper 2 would be the SDM-10 pre-post comparison. Pre-post changes in misconception prevalence, selection error rates, and the distribution of three-way classifications would be analyzed to examine whether specific misconception clusters are lower in the post-assessment and whether the alignment between student knowledge and item responses differs. Paper 2 would pre-specify which misconception codes from the taxonomy are expected to change, based on QUIN 102 curriculum coverage and the 10 recommendations in Table 8.1. We would be especially interested in whether misconception prevalence on the five dominant clusters from Section 7.5 is lower in the post-assessment, and whether format-driven error rates on Q36, Q10, Q9, and Q14 are lower after the planned item revisions. Any observed differences would be descriptive; attributing changes to instruction would require a controlled design beyond the scope of this study.

Subgroup analyses would examine whether learning gains vary by demographic and financial background characteristics, including gender, race/ethnicity, first-generation status, work experience, and financial stress. These analyses are contingent on IRB approval and would be reported with appropriate transparency practices for multiple comparisons, including false discovery rate adjustments where applicable.

The planned evaluation, contingent on IRB approval, would use only IRB-consented data. The existing consent setup (Section 5.1) separates instructional use from research use, and we would keep that separation in the post-assessment. All student data would remain de-identified using the one-way hashing architecture described in Appendix F. No raw student identifiers would appear in any dataset or research output. To protect student privacy in subgroup analyses, Paper 2 would suppress any demographic cell with fewer than 10 observations, consistent with the suppression rule applied in Section 6.2. The post-assessment consent screen would implement a forced active choice design (no default selection) to address the status quo bias limitation identified in Section 9.

---

## References

Akers, B., & Chingos, M. M. (2014). *Are college students borrowing blindly?* Brookings Institution.

Allgood, S., & Walstad, W. B. (2016). The effects of perceived and actual financial literacy on financial behaviors. *Economic Inquiry*, *54*(1), 675–697.

Birenbaum, M., & Tatsuoka, K. K. (1987). Open-ended versus multiple-choice response formats: It does make a difference for diagnostic purposes. *Applied Psychological Measurement*, *11*(4), 385–395.

Chen, H., & Volpe, R. P. (1998). An analysis of personal financial literacy among college students. *Financial Services Review*, *7*(2), 107–128.

Chi, M. T. H. (2008). Three types of conceptual change: Belief revision, mental model transformation, and categorical shift. In S. Vosniadou (Ed.), *International handbook of research on conceptual change* (pp. 61–82). Routledge.

Fernandes, D., Lynch, J. G., Jr., & Netemeyer, R. G. (2014). Financial literacy, financial education, and downstream financial behaviors. *Management Science*, *60*(8), 1861–1883.

Flodén, J. (2025). Grading exams using large language models: A comparison between human and AI grading of exams in higher education using ChatGPT. *British Educational Research Journal*, *51*(1), 201–224.

Goyal, K., & Kumar, S. (2021). Financial literacy: A systematic review and bibliometric analysis. *International Journal of Consumer Studies*, *45*(1), 80–105.

Hastings, J. S., Madrian, B. C., & Skimmyhorn, W. L. (2013). Financial literacy, financial education, and economic outcomes. *Annual Review of Economics*, *5*, 347–373.

Hasan, S., Bagayoko, D., & Kelley, E. L. (1999). Misconceptions and the Certainty of Response Index (CRI). *Physics Education*, *34*(5), 294–299.

Huston, S. J. (2010). Measuring financial literacy. *Journal of Consumer Affairs*, *44*(2), 296–316.

Ipatova, E., & Merheb, K. (2023). Re-examining the Dunning-Kruger effect: Objective vs. subjective financial literacy in the young and overconfident (SSRN Working Paper No. 4645450).

Kaiser, T., Lusardi, A., Menkhoff, L., & Urban, C. (2022). Financial education affects financial knowledge and downstream behaviors. *Journal of Financial Economics*, *145*(2), 255–272.

Kramer, M. M. (2016). Financial literacy, confidence and financial advice seeking. *Journal of Economic Behavior & Organization*, *131*(Part A), 198–217.

Lusardi, A. (2019). Financial literacy and the need for financial education: Evidence and implications. *Swiss Journal of Economics and Statistics*, *155*, Article 1.

Lusardi, A., & Mitchell, O. S. (2014). The economic importance of financial literacy: Theory and evidence. *Journal of Economic Literature*, *52*(1), 5–44.

Lusardi, A., & Tufano, P. (2015). Debt literacy, financial experiences, and overindebtedness. *Journal of Pension Economics and Finance*, *14*(4), 332–368.

Mandell, L., & Klein, L. S. (2009). The impact of financial literacy education on subsequent financial behavior. *Journal of Financial Counseling and Planning*, *20*(1), 15–24.

Martinez, M. E. (1999). Cognition and the question of test item format. *Educational Psychologist*, *34*(4), 207–218.

Millman, J., Bishop, C. H., & Ebel, R. (1965). An analysis of test-wiseness. *Educational and Psychological Measurement*, *25*(3), 707–726.

Mizumoto, A., & Eguchi, M. (2024). Large language models and automated essay scoring of English language learner writing: Insights into validity and reliability. *Computers and Education: Artificial Intelligence*, *6*, 100208.

OECD. (2022). *OECD/INFE toolkit for measuring financial literacy and financial inclusion 2022*. OECD Publishing.

Ohlsson, S. (1996). Learning from performance errors. *Psychological Review*, *103*(2), 241–262.

Olivos, F., Kamelski, T., & Ascui-Gac, S. (2025). Assessing instructor-AI cooperation for grading essay-type questions in an introductory sociology course. *Teaching Sociology*. Advance online publication. https://doi.org/10.1177/0092055X251397371

Porto, N., & Xiao, J. J. (2016). Financial literacy overconfidence and financial advice seeking. *Journal of Financial Service Professionals*, *70*(4), 78–88.

Robb, C. A., & Woodyard, A. (2011). Financial knowledge and best practice behavior. *Journal of Financial Counseling and Planning*, *22*(1), 60–70.

Stango, V., & Zinman, J. (2009). Exponential growth bias and household finance. *Journal of Finance*, *64*(6), 2807–2849.

van Rooij, M., Lusardi, A., & Alessie, R. (2011). Financial literacy and stock market participation. *Journal of Financial Economics*, *101*(2), 449–472.

Wagner, J., & Walstad, W. B. (2019). The effects of financial education on short-term and long-term financial behaviors. *Journal of Consumer Affairs*, *53*(1), 234–259.

Willis, L. E. (2011). The financial education fallacy. *American Economic Review*, *101*(3), 429–434.

Yavuz, F. (2025). Utilizing large language models for EFL essay grading: An examination of reliability and validity in rubric-based assessments. *British Journal of Educational Technology*, *56*(2), 487–506.

---

## Declaration of AI and AI-Assisted Technologies

This study used AI tools in three ways, disclosed here following current best-practice guidelines for transparency in academic publishing.

1. **Assessment platform development.** AI-assisted coding tools (GitHub Copilot, Claude Code) were used during development of the web-based assessment platform to accelerate implementation of the user interface, data collection logic, and adaptive routing algorithm. All platform functionality was independently tested and reviewed by the research team prior to deployment. The complete source code is publicly available for inspection in the project repository (Bolivard, 2026).

2. **Open-ended response scoring.** GPT-4.1 (OpenAI), accessed via the OpenRouter API, served as the automated scoring engine for classifying open-ended student responses into the three-way taxonomy (misconception, knowledge gap, selection error). The model was selected from among 11 candidate LLMs through a multi-model concordance protocol (Appendix D). The scoring rubric, item-specific prompts, misconception taxonomy, and calibration examples were developed entirely by the research team based on manual analysis of student responses. Low-confidence classifications were flagged for human adjudication by the course instructor. This use of LLM-based scoring follows established practices in educational assessment (Mizumoto & Eguchi, 2024; Yavuz, 2025) and is described in detail in Section 4.5.

3. **Manuscript preparation.** Generative AI tools assisted with drafting, editing, and formatting portions of this manuscript. All content was reviewed, revised, and verified by the author, who takes full responsibility for the accuracy and integrity of this work.

---

## Appendix A: SDM-10 Selection Algorithm and Burden Controls

### Table A.1: SDM-10 Selection and Burden Controls

| Control | Rule |
| --- | --- |
| SDM size | Target 10 items after the 40 anchor questions (5–10 delivered depending on available high-priority subcategories) |
| Selection basis | Ranked by diagnostic priority score (0–5) at subcategory level |
| Domain balance | At least 2 items per domain (borrowing/credit, investment, risk management) |
| Subcategory cap | Max 2 SDM items per subcategory |
| Open-ended cap | Max 3 open-ended items per student |
| Format fallback | When open-ended cap reached: Open_Diagnose → Lower_MCQ, Open_Confirm → Same_MCQ |
| Item source | Pre-written 182-variant item bank only; no generated questions |
| Grading | SDM-10 is diagnostic only; grade from 40 anchors only |
| Primary outcomes | RQ1/RQ2 use 26 anchor knowledge items; SDM-10 is secondary diagnostic output |

### Table A.2: Diagnostic Priority Score Mapping (Correctness x Confidence x Format)

The diagnostic priority score quantifies residual uncertainty about a student's understanding in each subcategory. Higher values indicate greater need for diagnostic follow-up. The format-aware adjustment reflects differential guessing probability (50% for True/False vs. ~25% for MCQ).

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
| Phase 1: Domain minimums | Ensure coverage | Select highest-priority item from each domain until each has >= 2 items |
| Phase 2: Priority-based filling | Maximize diagnostic value | Fill remaining slots in descending diagnostic priority order with 5-level tiebreaker |
| Phase 3: Understanding-verification fallback | Avoid empty slots | If fewer than 10 subcategories are flagged for follow-up, add understanding-verification items (labeled `mastery` in the codebase) from strongest subcategories |

### Table A.5: Tiebreaker Hierarchy (When Diagnostic Priority Scores Are Equal)

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

Q15–Q28 are preference items (unscored).

| Category | Subcategory | Count | Q# | Scored |
| --- | --- | --- | --- | --- |
| Baseline Covariates | Demographic Characteristics | 5 | B1–B5 | N/A |
| Baseline Covariates | Financial Background & Context | 5 | B6–B10 | N/A |
| Baseline Covariates | Debt status | 2 | B11–B13 | N/A |
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
| Risk and Return Knowledge | Basic Probability: Percentage to Frequency | 1 | Q33 | Yes |
| Risk and Return Knowledge | Investment Risk: Diversification Effect | 1 | Q34 | Yes |
| Risk and Return Knowledge | Investment Risk: Risk-Return Relationship | 1 | Q35 | Yes |
| Risk and Return Knowledge | Risk Management: Diversification Principle | 1 | Q36 | Yes |
| Risk and Return Knowledge | Risk Management: Insurance | 1 | Q37 | Yes |
| Risk and Return Knowledge | Investment Risk: Inflation Risk | 1 | Q38 | Yes |
| Risk and Return Knowledge | Investment Risk: Asset Class Risk | 1 | Q39 | Yes |
| Risk and Return Knowledge | Crisis/Systemic Risk | 1 | Q40 | Yes |

### B.2: Baseline Covariates (B1–B13, Not Scored)

These items collect demographic characteristics, financial background, and debt status during the onboarding phase. No responses are scored.

**B1.** What is your gender?
*(A) Female | (B) Male | (C) Prefer not to say*

**B2.** Which category best describes your racial or ethnic background?
*(A) White or Caucasian | (B) Asian | (C) Black or African American | (D) Hispanic or Latino | (E) Native Hawaiian or Pacific Islander | (F) Native American or Alaska Native | (G) Two or more racial or ethnic backgrounds | (H) Other | (I) Prefer not to say*

**B3.** What is your age range?
*(A) 20 or under | (B) Above 20*

**B4.** What is your first language?
*(A) English | (B) Spanish | (C) Chinese (any dialect) | (D) French | (E) Russian | (F) Dutch | (G) Other (please specify)*

**B5.** Do you have work experience?
*(A) No work experience | (B) Part-time employment | (C) Full-time employment*

**B6.** Prior to enrolling in this course, had you personally used any of the following financial products? (Select all that apply)
*(A) Credit card | (B) Student loan | (C) Auto loan | (D) Investment account (stocks, ETFs, mutual funds) | (E) Insurance policy in your own name | (F) None of the above*

**B7.** Before enrolling in this course, how would you rate your overall financial knowledge?
*(A) Very low | (B) Low | (C) Moderate | (D) High | (E) Very high*

**B8.** How often do you feel financially stressed?
*(A) Never | (B) Rarely | (C) Sometimes | (D) Often | (E) Always*

**B9.** Highest Level of Parental Education
*(A) Less than high school | (B) High school diploma or GED | (C) Some college, no degree | (D) Associate degree (AA/AS) | (E) Bachelor's degree (BA/BS) | (F) Graduate or professional degree | (G) Don't know | (H) Prefer not to answer*

**B10.** Are you a first-generation college student?
*(A) Yes | (B) No | (C) Prefer not to say*

**B11.** Do you currently have any student loan debt?
*(A) Yes | (B) No | (C) Prefer not to say*

**B12.** If yes, what is the interest rate on your student loan debt (best estimate)?
*(A) Less than 5% | (B) Between 5% and 10% | (C) Above 10% | (D) I do not know | (E) Prefer not to say*

**B13.** If yes, what is the maturity of your student loan (time until fully repaid) (best estimate)?
*(A) Less than 5 years | (B) 5 to 10 years | (C) More than 10 years | (D) Do not know | (E) Prefer not to say*

### B.3: Borrowing, Interest Rates, and Financial Numeracy Knowledge (Q1–Q10, Scored)

**Q1** *(Compound Interest).* Suppose you had $100 in a savings account and the interest rate was 2% per year. After 5 years, how much do you think you would have in the account if you left the money to grow?
*(A) More than $102 | (B) Exactly $102 | (C) Less than $102 | (D) Do not know*. **Answer: A**

**Q2** *(Borrowing/Mortgages).* A 15-year mortgage typically requires higher monthly payments than a 30-year mortgage, but the total interest paid over the life of the loan will be less. True or false?
*(A) True | (B) False | (C) Do not know*. **Answer: A**

**Q3** *(Inflation).* High inflation means that the cost of living is increasing rapidly. True or false?
*(A) True | (B) False | (C) Do not know*. **Answer: A**

**Q4** *(Borrowing/Interest).* You lend $25 to a friend one evening and he gives you $25 back the next day. How much interest has he paid on this loan?
*(A) $25 | (B) $0 | (C) Do not know*. **Answer: B**

**Q5** *(Saving).* Lyle has a good job and earns enough to pay his bills comfortably each month. In terms of his emergency savings, how much should he have set aside?
*(A) $200 or so | (B) Money equal to his share of one month's rent/mortgage | (C) The equivalent of three or more months of living expenses | (D) Do not know*. **Answer: C**

**Q6** *(Inflation).* A successful effort to lower inflation would likely be accompanied by which of the following?
*(A) A decrease in the general level of prices | (B) A slower increase in prices | (C) An increase in employment | (D) Do not know*. **Answer: B**

**Q7** *(Inflation).* Inflation can cause difficulty in many ways. Which group would have the greatest problem during periods of high inflation?
*(A) Young couples with no children who both work | (B) Older, working couples saving for retirement | (C) Retirees living on a fixed income | (D) Do not know*. **Answer: C**

**Q8** *(Borrowing).* Jayden is shopping for an auto loan. Which of the following can he likely negotiate with the lender?
*(A) The interest rate | (B) The required down payment | (C) Both | (D) Neither | (E) Do not know*. **Answer: C**

**Q9** *(Earning).* Considering the strategy of allocating income, what is the PRIMARY advantage to your household of making a budget?
*(A) Ensures funds are available for bill paying and saving | (B) Reduces your taxes | (C) Increases rate of return on your investments | (D) Do not know*. **Answer: A**

**Q10** *(Borrowing/Credit).* Which of the following statements regarding credit reports is FALSE?
*(A) Credit reports are used by employers to screen job applicants | (B) A credit report includes an assessment of your worthiness to receive credit | (C) Your credit report is provided by a single source | (D) Do not know*. **Answer: C**

### B.4: Behavioral and Risk Management: Factual Knowledge (Q11–Q14, Scored)

**Q11** *(Risk Diversification).* Please tell me whether this statement is true or false: Buying a single company's stock usually provides a safer return than a stock mutual fund.
*(A) True | (B) False | (C) Do not know*. **Answer: B**

**Q12** *(Insurance).* Which of the following best describes the PRIMARY function of health insurance?
*(A) Protect against the possibility of large unexpected medical bills | (B) Cover the cost of routine health care expenses | (C) Pay for elective medical procedures | (D) Do not know*. **Answer: A**

**Q13** *(Insurance).* What does a home insurance deductible represent?
*(A) Amount you pay before insurance covers damages | (B) Monthly premium for coverage | (C) Maximum amount insurance will pay | (D) Do not know*. **Answer: A**

**Q14** *(Risk Diversification).* When an investor spreads money among different assets, the risk of losing money usually:
*(A) Increases | (B) Decreases | (C) Stays the same | (D) Do not know*. **Answer: B**

### B.5: Financial Attitudes and Preferences (Q15–Q28, Not Scored)

These 14 items capture behavioral attitudes, risk preferences, and financial decision-making tendencies. They are not scored but contribute to the behavioral profile used in the SDM-10 adaptive module.

**Q15** *(Allocation Preference).* You receive a $10,000 bonus. What would you most likely do with it?
*(A) Put it in a high-interest savings account for safety | (B) Invest it in mutual funds or ETFs for steady growth | (C) Buy individual stocks with potential for high return | (D) Spend most of it and save the rest later*

**Q16** *(Loss Aversion).* Your retirement account drops 20% due to a market downturn. How do you react?
*(A) Sell everything, I can't risk losing more | (B) Do nothing, markets recover over time | (C) Invest more, buy while prices are low | (D) Move funds to safer options like bonds or cash*

**Q17** *(Risk Perception).* What does "risk" mean to you when it comes to financial decisions?
*(A) The chance I could lose money | (B) The opportunity to earn a higher return | (C) Something unpredictable that needs to be managed | (D) I'm not sure*

**Q18** *(Social Influence and Herding).* You hear that everyone is investing in a new crypto asset. What do you do?
*(A) Invest quickly, don't miss out | (B) Put in a small amount just in case | (C) Research carefully before acting | (D) Stay out, I avoid hype*

**Q19** *(Retirement Risk Planning).* When planning for retirement, how do you factor in risk?
*(A) I ignore it, retirement is far away | (B) I aim for high growth regardless | (C) I diversify and rebalance regularly | (D) I rely on my advisor to guide me*

**Q20** *(Emotional Response to Loss).* You lose $1,000 in an investment. What's your emotional reaction?
*(A) Angry and anxious | (B) Concerned but calm | (C) Indifferent | (D) Curious to understand why*

**Q21** *(Decision Process).* When faced with a complex financial decision, how do you typically proceed?
*(A) Do extensive research and consider all outcomes | (B) Go with your intuition or gut feeling | (C) Rely on advice from friends or family | (D) Delay the decision until you feel more confident*

**Q22** *(Risk Confidence).* How confident are you in recognizing when an investment is too risky for your situation?
*(A) Very confident, I understand my risk limits | (B) Somewhat confident, I can tell when it's extreme | (C) Not very confident, I often second-guess | (D) I usually rely on others to decide for me*

**Q23** *(Risk Attitude).* What best describes your attitude toward risk?
*(A) I avoid risk as much as possible | (B) I'm okay with small risks for modest gains | (C) I take calculated risks for higher rewards | (D) I actively seek out high-risk, high-reward opportunities*

**Q24** *(Reaction to Underperformance).* If your long-term investment underperforms for a year, what would you most likely do?
*(A) Sell and look for a better option | (B) Reduce investment but stay in | (C) Stay the course | (D) Invest more to lower the average cost*

**Q25** *(Definition of Success).* How do you define a "successful" investment?
*(A) One that doesn't lose money | (B) One that beats inflation | (C) One that aligns with my financial goals | (D) One that produces the highest return, regardless of risk*

**Q26** *(Downside Awareness).* When making financial decisions, how often do you consider the potential downside risk?
*(A) Never | (B) Rarely | (C) Sometimes | (D) Always*

**Q27** *(Risk Preference in Income).* Imagine you're offered two jobs. Job A pays more but has uncertain income and less security. Job B pays less but is stable. Which do you choose?
*(A) Definitely Job A | (B) Probably Job A | (C) Probably Job B | (D) Definitely Job B*

**Q28** *(Scam Skepticism).* If an investment opportunity promises unusually high returns with little explanation of how, what do you do?
*(A) Invest a small amount just to test it | (B) Ask for more details and do research | (C) Avoid it, it seems too good to be true | (D) Immediately take advantage before it's gone*

### B.6: Risk and Return Knowledge (Q29–Q40, Scored)

**Q29** *(Investing).* If interest rates rise, what will typically happen to bond prices?
*(A) They will rise | (B) They will fall | (C) They will stay the same | (D) There is no relationship | (E) Do not know*. **Answer: B**

**Q30** *(Investing).* An investment with a high return is likely to be high risk. True or false?
*(A) True | (B) False | (C) Do not know*. **Answer: A**

**Q31** *(Investing).* Which of the following best describes what the stock market does?
*(A) Results in a gain in wealth for investors | (B) Creates liquidity by guaranteeing investors a profit | (C) Brings people who want to buy stocks together with those who want to sell stocks | (D) Do not know*. **Answer: C**

**Q32** *(Investing).* Considering a long time period (e.g., 10–20 years), which asset normally gives the highest return?
*(A) Savings accounts | (B) Bonds | (C) Stocks | (D) Do not know*. **Answer: C**

**Q33** *(Basic Probability).* In the BIG BUCKS LOTTERY, the chance of winning a $10 prize is 1%. What is your best guess about how many people would win a $10 prize if 1,000 people each buy a single ticket?
*(A) 5 | (B) 8 | (C) 10 | (D) 12 | (E) Do not know*. **Answer: C**

**Q34** *(Diversification Effect).* When an investor spreads money among different assets, does the risk of losing money usually increase, decrease, or stay the same?
*(A) Increase | (B) Decrease | (C) Stay the same | (D) Do not know*. **Answer: B**

**Q35** *(Risk-Return Relationship).* If someone offers you the chance to make a lot of money, it is likely that there is also a chance that you will lose a lot of money. True or false?
*(A) True | (B) False | (C) Do not know*. **Answer: A**

**Q36** *(Diversification Principle).* True or false: It is less likely that you will lose all of your money if you save it in more than one place.
*(A) True | (B) False | (C) Do not know*. **Answer: A**

**Q37** *(Insurance).* Which of the following insurance policies is most likely to protect you if you cause an accident that injures someone?
*(A) Health insurance | (B) Homeowner's or renter's insurance | (C) Auto insurance liability coverage | (D) Do not know*. **Answer: C**

**Q38** *(Inflation Risk).* Which of the following types of investment would best protect the purchasing power of a family's savings in the event of a sudden increase in inflation?
*(A) A 10-year bond paying a fixed rate of interest | (B) A certificate of deposit at a bank | (C) A 25-year home mortgage at a fixed rate | (D) A house financed with a fixed-rate mortgage | (E) Do not know*. **Answer: D**

**Q39** *(Asset Class Risk).* True or false: Stocks are generally riskier than bonds.
*(A) True | (B) False | (C) Do not know*. **Answer: A**

**Q40** *(Crisis/Systemic Risk).* What was a key factor contributing to the 2007 to 2008 financial crisis?
*(A) Strong regulation of mortgage lending | (B) Widespread failure to properly assess and manage financial risk | (C) High household savings rates | (D) Low levels of borrowing by households*. **Answer: B**

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

To select the scoring model for the AI-assisted classification pipeline (Section 4.5), we conducted a multi-model concordance evaluation. Twenty identical open-ended student responses (11 diagnose, 9 confirm) were scored by 11 large language models from seven providers, accessed via the OpenRouter API. Models were evaluated on five criteria: (1) JSON schema compliance (whether diagnose items returned the correct diagnose-format output), (2) parse/API error rate, (3) classification nuance (use of partial credit, confidence variation, and balanced classification distributions), (4) throughput (wall-clock time for 20 responses), and (5) estimated cost for the full corpus.

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

---

## Appendix E: Supplementary Materials

**Data and materials availability.** The de-identified data exports, orientation video, source code, and reproducible verification script (`verify_paper_tables.py`) described below are available in the project repository (Bolivard, 2026). Direct download links are provided in the repository README.

- **Introductory orientation video.** Before beginning the assessment, each student views a short orientation video explaining the purpose, structure, and non-graded nature of the assessment.

- **Source code repository.** The complete platform source code, data export scripts, and verification script are publicly available in the project repository (Bolivard, 2026).

- **De-identified data exports.** The following data files are available for download from the project repository:

  - `consented_responses_354.csv`: Primary analysis dataset containing all anchor and SDM-10 responses for the research-consented subset. Fields: attempt_id, submission_type, submitted_at, duration_s, item_id, item_type, domain, subdomain, is_anchor, is_scored, student_answer, item_score, confidence, answered_at.
  - `all_responses_421_students.csv`: Operational dataset including non-consented responses. Used for operational context only; not included in research analyses.
  - `question_bank_40items.csv`: Item metadata and answer options for all 40 anchor items plus 13 baseline covariates. Fields: section, subsection, range, question_id, question_text, tags, options, correct_answer.
  - `diagnose_by_item.csv`: Item-level diagnose classification results showing misconception, knowledge gap, and selection error percentages with Layer 1 and Layer 2 taxonomy codes for each anchor item.
  - `confirm_by_item.csv`: Item-level confirm classification results showing verified, partial, and likely-guess percentages for each anchor item.
  - `sdm_open_answers.csv`: De-identified open-ended response text from SDM-10 diagnose and confirm items.
  - `misconception_taxonomy_observed.csv`: 62 observed misconception patterns mapped to items and subcategories, with Layer 1 codes, Layer 2 tags, and frequency counts.
  - `model_selection_concordance.csv`: 11-model comparison for AI scorer selection, with schema compliance, error rates, throughput, cost estimates, and verdict for each model.
  - `sdm10_item_bank.xlsx`: Canonical SDM item bank containing 182 variant rows across 26 anchor items. Fields include anchor ID, variant type, trigger condition, question text, answer options, correct answer, scoring rubric, and misconception tags.

---

## Appendix F: Technical Implementation

### F.1 Technology Stack

The assessment is administered through a dedicated web platform, the Financial Literacy Toolkit, developed for this study. The platform is built on Next.js 14 (App Router) with PostgreSQL 15 as the data store, accessed through PgBouncer connection pooling to support concurrent users. The application runs as a Docker containerized service with automated deployment via GitHub Actions and Traefik reverse proxy for SSL termination. The complete source code is publicly available in the project repository (Bolivard, 2026).

### F.2 Student Authentication and Data Minimization

Students access the platform by entering their course code and student ID. On receipt, the platform immediately transforms each student ID into a one-way cryptographic hash (SHA-256 with a per-course pepper) and discards the raw identifier; all subsequent data storage and analysis use only the hashed key. No raw student ID numbers, names, email addresses, or other personally identifiable information are stored in the research dataset. The per-course pepper isolates student hashes across courses, preventing cross-course linkage. Age is collected as a categorical range rather than exact date of birth, and geographic identifiers are not collected.
