# QUIN 102 Pre-Test Results Report (SDM-10)

**Term:** Spring 2026
**Assessment Window:** February 2-10, 2026
**Prepared by:** Guillaume Bolivard
**Audience:** QUIN 102 Instructor and Teaching Team

---

**Purpose.** This report summarizes the results of the QUIN 102 pre-course financial literacy assessment, including the Supplemental Diagnostic Module (SDM-10). It is written for the teaching team - not for publication. The goal is to translate pre-test findings into actionable guidance: what students know, where they struggle, and what the diagnostic data suggest about how to focus instruction this semester. All findings are descriptive. No causal claims are made.

---

## 1. Executive Summary

### Key Findings

- The mean anchor score was 66.4% across all submitted students (N = 431). This is slightly above the 40-60% ranges typically seen in prior financial literacy research with college-age and adult populations (Chen & Volpe, 1998; Lusardi, 2019).
- Investment and Risk/Return was the weakest domain, averaging 63.8% (N = 431). Behavioral and Risk Management was strongest at 73.3%.
- Over half the sample (58.2%) scored below 70%, which in this assessment corresponds to developing or at-risk performance (N = 431).
- About 30% of students were moderately or highly overconfident - their self-rated confidence exceeded their actual accuracy (N = 431).
- Male students scored about 5 percentage points higher than female students on average (69.2% vs. 64.3%), and students working full-time scored about 6 points higher than part-time workers (71.4% vs. 64.9%). First-generation college students, however, scored nearly identically to non-first-generation peers (N = 431).
- Students who rated their own financial knowledge as high scored 73.6% on average, compared to 62.3% among those who rated it as low - suggesting that group-level self-assessment broadly aligns with measured performance (N = 431).
- The three hardest items involved inflation mechanics and bond pricing, with correct rates below 37% (N = 431).
- Among high-confidence errors in the consented diagnostic sample, 53.9% reflected misconceptions and 31.9% were selection errors - meaning almost one in three students who answered wrong actually understood the concept (n = 354 consented, 479 classified diagnose responses).
- Among correct answers paired with low confidence, 13.7% were likely guesses - students picked the right answer but could not explain why (n = 354 consented, 285 confirm responses).
- The single most common misconception was confusing "lower inflation" with "falling prices" (INF-01), which appeared in 42 diagnosed responses from the consented sample.
- True/False items and negation-framed questions showed the highest selection error rates - up to 81% on Q36 (diversification principle).

### Teaching Takeaways

1. **Inflation rate vs. price level** is the top instructional priority. Students consistently confuse a slower rate of price increase with an actual decrease in prices. Visual aids showing rate-of-change vs. level may help.
2. **Insurance purpose** needs direct attention early. Most errors on Q12 came from the belief that routine care is insurance's main function. Framing insurance as catastrophic protection first, routine coverage second, may address this.
3. **Risk-return reasoning** tends to break down when students use real-world counterexamples to argue against general financial principles. Using historical asset-class return data rather than abstract statements is worth trying.
4. **Bond pricing** (inverse interest-rate/price relationship) showed both high misconception and high guess rates. Worked numerical examples may help more than verbal explanations alone.
5. **Nearly one in three high-confidence errors are format-driven, not knowledge-driven.** Students may know more than their scores suggest. This has direct implications for grading and for how we interpret pre-post score changes.

### Assessment and Design Takeaways

1. **True/False items with negation** produce disproportionate selection errors. Q36 (diversification) had an 81% selection error rate - students understood the concept but picked "False." Converting these to standard MCQ format for the post-test is worth considering.
2. **"Which is FALSE" framing** tripped up students on Q10 (credit reports) even when they understood the material. Rephrasing to positive identification may help.
3. **Three items below 50% correct** (Q38 at 23.7%, Q6 at 32.9%, Q29 at 36.2%) may need difficulty recalibration or restructuring, though their diagnostic value is high precisely because so many students get them wrong.
4. **Anchor scores both overstate and understate knowledge.** The 13.7% guess rate among correct-but-uncertain answers means some students get credit for understanding they don't have. The 31.9% selection error rate means some students lose credit for understanding they do have.
5. **Tracking selection error rates** on revised items in the post-test will be important for evaluating whether format changes, rather than instructional changes, are responsible for any score differences.

---

## 2. Methodology Overview

### 2.1 What Students Did

Students enrolled in QUIN 102 were invited to complete a pre-course financial literacy assessment through a web-based platform. The assessment had three parts:

1. **Onboarding** - 13 demographic and financial background questions (not scored)
2. **Anchor assessment** - 40 items: 26 scored knowledge questions and 14 unscored preference/attitude questions, each with a confidence rating (1 = low, 2 = mid, 3 = high)
3. **SDM-10** - up to 10 adaptive follow-up items selected based on the student's anchor responses

The SDM-10 is diagnostic only. It does not contribute to any course grade.

### 2.2 What the SDM-10 Adds

Standard multiple-choice tests tell you whether a student got the answer right or wrong, but they don't tell you *why* they got it wrong. A student who picks the wrong answer on a bond pricing question might hold a genuine misconception about how interest rates and prices relate, or they might understand the concept perfectly well but get tripped up by the question's True/False format. These two students need very different kinds of help. The SDM-10 fills that diagnostic gap.

**How variants work.** Based on each student's anchor answers and confidence ratings, the algorithm selects follow-up items from a bank of 182 pre-written variants. These are not generated dynamically - every variant was authored and reviewed before the assessment opened. Each variant targets a specific anchor item and a specific diagnostic goal. The bank includes format variants (same concept, different question format), scenario variants (same concept, different real-world context), and open-ended prompts (student explains reasoning in their own words).

**Why variants exist.** The anchor assessment tells you what a student got right or wrong. Variants tell you what kind of follow-up is most informative for that particular student. A student who answers a bond pricing item incorrectly with high confidence needs a different follow-up than a student who answers the same item correctly with low confidence. The variant bank lets the algorithm select the most diagnostically useful question for each student-item pair, without repeating the same format that may have contributed to the original response.

**Why open-ended follow-ups matter.** Multiple-choice items, even when well-designed, constrain students to a fixed set of answer options. A student who picks the right answer may have arrived there by guessing, by partial reasoning, or by genuine understanding. A student who picks the wrong answer may hold a misconception, lack relevant knowledge entirely, or simply misread the question. Open-ended follow-ups ask the student to explain their reasoning, which makes it possible to distinguish between these very different situations.

Two types of open-ended follow-ups are particularly important:

- **Open_Diagnose:** Triggered when a student answers incorrectly with high confidence. The student explains their reasoning in writing. The response is classified as a *misconception* (active wrong belief), a *knowledge gap* (no knowledge or no mental model), or a *selection error* (understood the concept but picked the wrong answer due to the question format).
- **Open_Confirm:** Triggered when a student answers correctly with low confidence. The student explains why the correct answer is right. The response is classified as *verified* (genuine understanding), *partial* (incomplete reasoning), or *likely guess* (no real understanding despite the correct answer).

**These two follow-up types are alternatives.** A given anchor item triggers one or the other based on the student's response and confidence level - never both. If a student answers Q29 (bond pricing) incorrectly with high confidence, they get an Open_Diagnose prompt. If a different student answers Q29 correctly but with low confidence, they get an Open_Confirm prompt. This design means the diagnostic data from the two follow-up types describe complementary slices of student performance: the high-confidence wrong answers and the low-confidence right answers.

### 2.3 Denominator Map

| Label | Count | Usage |
| --- | --- | --- |
| Course roster | 653 | Context only; never used as a performance denominator |
| Platform onboarded | 443 | Students who completed onboarding |
| Submitted | **N = 431** | All descriptive results and figures |
| Research-consented | **n = 354** | All diagnostic and open-ended classifications |

### 2.4 Privacy and Suppression Rule

To protect student privacy, any demographic or socioeconomic category with fewer than 10 respondents is suppressed or collapsed into an adjacent group. This report does not print any raw count below 10. Where a category is suppressed, it is labeled "< 10 (suppressed)" or combined with a neighboring category.

---

## 3. Participation Funnel (N = 431)

Of the 653 students on the QUIN 102 roster, 443 completed onboarding on the assessment platform. Of those, 431 submitted the full assessment - a 97.3% completion rate among those who started. The remaining 12 students began the assessment but did not finish.

![Figure R3. Daily Enrollment and Completion (Feb 2-10, 2026). Bars show daily new enrollments and completions; the dashed line shows cumulative submitted assessments.](report_figures/fig3_enrollment_timeline.png)

Enrollment was spread across the nine-day window, with the first day (Feb 2) and the last weekend (Feb 8-9) accounting for the largest cohorts.

---

## 4. Results by Student Characteristics (N = 431)

### 4.1 Demographics

![Figure R6. Sample Demographics (N = 431, submitted). Categories with fewer than 10 respondents are suppressed.](report_figures/fig7_demographics.png)

The submitted sample was majority female (58.2%), with males at 40.4% and a suppressed category for students who selected other options or preferred not to answer (< 10 students).

Most students (85.2%) were age 20 or younger. About 13.7% were over 20. A small group preferred not to answer (suppressed).

The racial and ethnic composition was: White 48.7%, Hispanic/Latino 21.8%, Asian 12.5%, Black 6.7%, Two or More Races 6.5%, Other or Prefer Not to Say 3.7%.

About 70.3% of students worked part-time. Full-time workers made up 13.2%, and 14.6% reported no employment. A small group preferred not to answer (suppressed).

About 28.1% of students identified as first-generation college students. The remainder (68.9%) were not first-generation. A small group (3.0%) preferred not to answer.

*Source: generate_charts.py lines 297-366 (percentages only; categories with fewer than 10 respondents are suppressed).*

### 4.2 Financial Background and Self-Assessment

![Figure R7. Financial Background and Self-Assessment (N = 431, submitted). Categories with fewer than 10 respondents are suppressed.](report_figures/fig8_financial_background.png)

**Financial stress.** The most common response was "sometimes" (43.9%), followed by "rarely" (21.6%), "often" (18.8%), and "never" (10.7%). A small group reported "always" (4.2%). Students who preferred not to answer were suppressed.

**Self-rated financial knowledge.** The majority rated their knowledge as moderate (58.7%). About a quarter rated it as low or very low (combined: 26.9%), and about one in seven rated it as high or very high (combined: 13.7%). Students who preferred not to answer were suppressed.

*Source: generate_charts.py lines 387-420 (percentages only; "Very Low" and "Very High" categories each had fewer than 10 respondents and were collapsed into adjacent categories).*

The fact that nearly two-thirds of students experience financial stress at least sometimes is worth keeping in mind. Students dealing with financial pressure may engage differently with course material about budgeting, debt, and savings - not because they lack interest, but because the topics hit close to home.

### 4.3 Performance by Student Characteristics

The table below shows mean overall scores by demographic group. All means are computed from the N = 431 submitted sample. Groups with fewer than 10 respondents are suppressed.

**Table 4.1: Mean Overall Score by Gender**

| Group | n | Mean (%) | SD |
| --- | --- | --- | --- |
| Female | 251 | 64.3 | 17.4 |
| Male | 174 | 69.2 | 16.8 |
| Other / Prefer not to say | < 10 (suppressed) | - | - |

Male students scored about 5 percentage points higher than female students on average. This is a descriptive pattern; this report does not attempt to explain why the gap exists.

**Table 4.2: Mean Overall Score by Race/Ethnicity**

| Group | n | Mean (%) | SD |
| --- | --- | --- | --- |
| White | 210 | 67.3 | 16.6 |
| Asian | 54 | 67.5 | 16.7 |
| Two or more | 28 | 68.5 | 14.2 |
| Hispanic/Latino | 94 | 63.6 | 19.1 |
| Black | 29 | 60.8 | 18.4 |

Performance varied across racial and ethnic groups, with a roughly 8-point range between the highest- and lowest-scoring groups. Hispanic/Latino and Black students scored below the overall mean, while White, Asian, and multiracial students scored near or above it. Standard deviations were substantial in every group, indicating wide within-group variation.

**Table 4.3: Mean Overall Score by Work Experience**

| Group | n | Mean (%) | SD |
| --- | --- | --- | --- |
| Full-time | 57 | 71.4 | 15.3 |
| No work experience | 63 | 67.8 | 16.9 |
| Part-time | 303 | 64.9 | 17.7 |

Students who worked full-time had the highest mean score (71.4%), about 6.5 points above part-time workers. This pattern is consistent with full-time workers having more direct experience with budgeting, credit, and financial decision-making, though other explanations are possible.

**Table 4.4: Mean Overall Score by First-Generation Status**

| Group | n | Mean (%) | SD |
| --- | --- | --- | --- |
| No (not first-generation) | 297 | 66.4 | 17.7 |
| Yes (first-generation) | 121 | 66.4 | 16.2 |

First-generation and non-first-generation students scored virtually identically. This is notable because first-generation students are sometimes assumed to have weaker financial literacy. In this sample, that assumption does not hold.

**Table 4.5: Mean Overall Score by Self-Rated Financial Knowledge**

| Group | n | Mean (%) | SD |
| --- | --- | --- | --- |
| High | 52 | 73.6 | 16.8 |
| Moderate | 253 | 67.0 | 16.8 |
| Low | 107 | 62.3 | 17.1 |

Self-rated knowledge tracked measured performance in the expected direction. Students who rated themselves as having high financial knowledge scored about 11 points above those who rated themselves as low. While this alignment is encouraging at the group level, it does not mean individual self-assessments are reliable - the overconfidence analysis in Section 5.4 shows that about 30% of students had meaningful gaps between their confidence and their actual accuracy.

**Table 4.6: Mean Overall Score by Financial Stress Frequency**

| Group | n | Mean (%) | SD |
| --- | --- | --- | --- |
| Never | 46 | 71.0 | 18.9 |
| Rarely | 93 | 69.3 | 16.7 |
| Sometimes | 189 | 64.5 | 17.3 |
| Often | 81 | 67.1 | 15.9 |
| Always | 18 | 61.4 | 12.3 |

Students who reported never experiencing financial stress scored about 10 points higher on average than those who reported always experiencing it. The pattern was not strictly linear - students who reported "often" scored slightly above those who said "sometimes" - but the overall trend was clear: more frequent financial stress was associated with lower scores.

*Source: Read-only database queries on N = 431 submitted students, saved to exports/subgroup_performance.csv. All groups with n < 10 are suppressed.*

**Summary of patterns.** The strongest performance gradients appeared along self-rated knowledge (11-point spread), work experience (6.5-point spread), and financial stress frequency (10-point spread). The absence of a first-generation gap is notable. Racial/ethnic and gender gaps were present but should be interpreted with caution given the many overlapping factors (work status, financial stress, educational background) that this descriptive report does not disentangle.

---

## 5. Overall Results (N = 431)

### 5.1 Overall Score Distribution

The mean anchor score was 66.4% (N = 431). The score distribution was roughly bell-shaped, with the peak in the 60-69% range (125 students, 29.0% of the sample).

![Figure R1. Pre-Course Overall Score Distribution (N = 431). The dashed line marks the mean (66.4%). The gold bar highlights the modal bin (60-69%).](report_figures/fig1_score_distribution.png)

When grouped into performance bands:

| Band | Students | % of N = 431 |
| --- | --- | --- |
| Below 50% | 55 | 12.8% |
| 50-69% | 200 | 46.4% |
| 70-79% | 82 | 19.0% |
| 80% and above | 94 | 21.8% |

*Source: docs/data/domain-score-distribution.csv, aggregated by band.*

Over half the submitted sample (59.2%) scored below 70%. The 12.8% below 50% are the students most at risk of struggling with course material without additional support.

For context, prior financial literacy research with adult and college-age populations has typically reported mean scores in the 40-60% range. Chen and Volpe (1998) found a mean of about 53% among 924 college students, and Lusardi (2019) documented that roughly one-third of adults globally can answer basic financial literacy questions correctly. Our sample's 66.4% mean is slightly above that range, which may reflect the fact that QUIN 102 students have some prior interest in financial topics.

### 5.2 Domain Performance

The 26 scored anchor items span three knowledge domains. Domain-level means (N = 431) were:

| Domain | Items | Mean % Correct | SD |
| --- | --- | --- | --- |
| Behavioral and Risk Management | 4 | 73.3% | 26.4% |
| Borrowing, Interest, and Numeracy | 10 | 69.2% | 19.0% |
| Investment and Risk/Return | 12 | 63.8% | 21.5% |

*Source: generate_charts.py lines 85-86 (not available in any CSV; confirmed by Final DOCX Figure 2).*

![Figure R2. Domain-Level Performance Comparison (N = 431). Error bars show plus or minus one standard deviation, representing the spread of individual student scores within each domain. The dashed line marks the overall mean (66.4%).](report_figures/fig2_domain_performance.png)

Investment and Risk/Return is the weakest area, about 10 percentage points below Risk Management. This gap is partly driven by difficult items on inflation protection (Q38, 23.7% correct) and bond pricing (Q29, 36.2% correct), though high selection error counts in this domain mean that some of the apparent weakness is format-related rather than knowledge-related.

### 5.3 Item Difficulty

The 26 scored anchor items ranged from 92.8% correct (Q4, basic borrowing) down to 23.7% correct (Q38, inflation protection).

![Figure R5. Item Difficulty Ranking by Subdomain (N = 431). Green = strong (70% or above), gold = moderate (50-69%), red = weak (below 50%).](report_figures/fig6_item_difficulty.png)

**Strongest items** (above 85% correct): Q4 (Borrowing/Interest, 92.8%), Q1 (Compound Interest, 91.4%), Q3 (Inflation definition, 85.9%), Q14 (Diversification, 84.5%).

**Weakest items** (below 50%): Q38 (Inflation Protection, 23.7%), Q6 (Inflation Lowering, 32.9%), Q29 (Interest Rates and Bonds, 36.2%), Q32 (Long-Term Asset Returns, 52.7%), Q10 (Credit Reports, 52.4%).

*Source: generate_charts.py lines 229-256 (percent correct per item, N = 431).*

The three hardest items all involve relationships that students tend to confuse: what happens to prices when inflation slows (Q6), which assets protect against inflation (Q38), and what happens to bond prices when interest rates change (Q29). These are the areas where targeted instruction is likely to matter most.

### 5.4 Confidence Calibration

Each anchor item includes a confidence rating (1 = low, 2 = mid, 3 = high). We computed an overconfidence index (OI) for each student as the difference between their average normalized confidence and their average accuracy. The thresholds are:

| Category | OI Range | Students | % of N = 431 |
| --- | --- | --- | --- |
| Underconfident | OI < -0.10 | 140 | 32.5% |
| Well-Calibrated | -0.10 to 0.10 | 160 | 37.1% |
| Moderately Overconfident | 0.10 to 0.30 | 101 | 23.4% |
| Highly Overconfident | OI >= 0.30 | 30 | 7.0% |

*Source: generate_charts.py lines 190-191 (bin counts from scores.overconfidence_index, N = 431).*

![Figure R4. Confidence Calibration Categories (N = 431). OI = average normalized confidence minus average correctness.](report_figures/fig5_confidence_calibration.png)

Most students (69.6%) fall in the underconfident or well-calibrated ranges. About 30% are overconfident to some degree. The 7% who are highly overconfident are the students most likely to resist corrective feedback - they feel sure about answers they are getting wrong.

**Why overconfidence matters for instruction.** Calibration is the alignment between how confident a student feels and how accurate they actually are. A well-calibrated student knows what they know and, just as importantly, knows what they don't know. An overconfident student believes they understand material that they have not actually mastered.

This matters for several practical reasons. Overconfident students are less likely to seek help, because they don't perceive a need for it. They are less likely to revisit material, because they believe they already understand it. And they may resist corrective feedback, interpreting it as contradicting something they are sure about rather than as filling a gap they didn't realize they had. In a financial literacy course, where misconceptions about inflation, insurance, and risk can have real-world consequences, the gap between perceived and actual understanding is especially worth attending to.

**Practical approaches for the classroom.** The following are teaching strategies that other instructors have used to address overconfidence. They are not guaranteed to work, and this report does not claim they will change calibration. But they are low-cost, evidence-informed practices that are consistent with what the pre-test data show.

- **Low-stakes retrieval practice.** Before covering new material, give a short ungraded quiz on the previous topic. Students who are overconfident will be surprised by what they get wrong, and the experience of getting it wrong in a low-stakes setting can recalibrate their self-assessment without the anxiety of a graded exam.
- **Prediction-then-feedback exercises.** Ask students to predict their score on a quiz or assignment before they receive it back. Over time, the gap between predicted and actual performance becomes visible to the student. This builds metacognitive awareness - the ability to judge one's own understanding accurately.
- **"What are you most confident about?" warm-ups.** At the start of a class session, ask students to write down one thing they feel confident they understand from the reading or last class. Then test that specific claim with a quick question. Students whose confidence was well-placed get confirmation; students whose confidence was misplaced get a low-pressure correction. This surfaces blind spots before they compound.
- **Normalize uncertainty.** Frame not-knowing as a normal and expected part of learning, not as a failure. When an instructor says "this is a concept that trips up most students the first time they encounter it," it gives overconfident students permission to reconsider their understanding without feeling like they have been singled out.

### 5.5 Submission Timing

Peak submission times were between 2 PM and 10 PM Chicago time, consistent with students completing the assessment in the afternoon and evening. The median active assessment time was about 18 minutes.

---

## 6. Diagnostic Insights (n = 354)

The diagnostic results in this section come from the 354 students who provided research consent. Of those, 306 (86.4%) received at least one open-ended follow-up item through the SDM-10, generating 778 scored responses. The AI scoring pipeline classified these with zero processing errors.

**Important caveat.** The SDM-10 diagnose items target students who answered incorrectly with high confidence. The confirm items target students who answered correctly with low confidence. These results describe the tails of the confidence-accuracy distribution, not a random cross-section of the whole class. Misconception rates from this section should not be generalized to all 431 students without accounting for this conditioning.

### 6.1 What the Diagnose Data Show

Of 493 diagnose responses scored from the consented sample, 479 (97.2%) were classifiable:

- **53.9% were misconceptions** (258 of 479) - students held an active wrong belief about the concept.
- **31.9% were selection errors** (153 of 479) - students understood the concept correctly but picked the wrong answer, typically because of the question format (True/False phrasing, negation, ambiguity).
- **14.2% were knowledge gaps** (68 of 479) - students acknowledged uncertainty or had no mental model for the concept at all.

*Source: exports/diagnose_by_item.csv, column sums.*

The selection error finding is the more surprising result. It means that among students who answered incorrectly and felt confident about it, almost one in three actually understood the concept correctly. If we relied only on anchor scores, we would overcount the number of students who hold misconceptions and undercount the number who already understand the material.

### 6.2 What the Confirm Data Show

Of 285 confirm responses from the consented sample:

- **44.6% showed verified understanding** (127 of 285) - students could explain the correct answer accurately.
- **41.8% showed partial understanding** (119 of 285) - students' explanations were incomplete but on the right track.
- **13.7% were likely guesses** (39 of 285) - students picked the right answer but could not explain why.

*Source: exports/confirm_by_item.csv, column sums.*

On specific items, guess rates ran higher: Q29 (bond pricing) and Q13 (insurance deductibles) both showed guess rates above 30% among their confirm responses. Raw anchor scores may overstate genuine understanding on these items.

### 6.3 Top Misconception Clusters

Five misconception patterns stood out across the diagnostic data:

- **Inflation mechanics confusion (INF-01).** The single most common misconception code, appearing in 42 diagnose responses. Students consistently treated "lower inflation" as meaning "prices go down" rather than "prices rise more slowly." On Q6, 79% of the 53 diagnosed responses reflected this confusion.
- **Insurance purpose confusion (INS-01/INS-02).** On Q12, 82% of the 28 diagnosed responses reflected the belief that routine care is the main purpose of health insurance. Students used frequency-of-use reasoning: because doctor visits happen more often than emergencies, they must be the primary function.
- **Risk-return reasoning from exceptions (RISK-02).** On Q30, 14 of 17 diagnosed responses (82%) showed students using real-world counterexamples to argue against the risk-return tradeoff principle. They cited specific cases where low-risk investments did well, or high-risk investments failed, to invalidate the general principle.
- **Empathy-driven inflation reasoning (INF-05).** On Q7, 26% of the 54 diagnosed responses showed students picking "young couples" as the group most hurt by inflation because they identified personally with that demographic rather than reasoning through fixed-income vulnerability.
- **Bond pricing misconception (INT-06).** On Q29, 46% of the 24 diagnosed responses reflected a belief that interest rates and bond prices move in the same direction.

*Source: exports/misconception_taxonomy_observed.csv and exports/diagnose_by_item.csv.*

### 6.4 Selection-Error Hotspots

Selection errors were concentrated on items with specific format features:

- **Q36 (diversification principle):** True/False with negation - 81% selection error rate (34 of 42 diagnosed responses). Students who answered "False" could then explain diversification correctly.
- **Q10 (credit reports):** "Which is FALSE" framing - 41% selection error rate (16 of 39).
- **Q37 (insurance types):** Phrasing ambiguity - 41% selection error rate (7 of 17).
- **Q2 (mortgage term and total interest):** True/False reversal - 32% selection error rate (7 of 22).

*Source: exports/diagnose_by_item.csv (selection_error_pct column for items with n >= 10).*

The common thread is True/False format and negation framing - both known sources of format-induced error in educational testing.

### 6.5 What This Means

The three-way classification (misconception, knowledge gap, selection error) has direct implications for how we think about remediation:

- **Misconceptions** need targeted correction. A student who believes lower inflation means falling prices won't learn the correct concept from a general lecture on inflation - they need the specific distinction between rate and level called out explicitly.
- **Knowledge gaps** need foundational instruction. A student who doesn't know what a deductible is needs the definition, not a correction of a wrong belief.
- **Selection errors** need item revision, not instruction. A student who understands diversification but picks "False" on a T/F item doesn't need more teaching about diversification - they need a better question.

Treating all three the same way - re-teaching the topic - misses the point for about half the students in the diagnostic sample.

---

## 7. Implications for Instruction

### 7.1 Priorities

Based on the diagnostic findings, we suggest three tiers of instructional priority:

**Tier 1 - Address within the first two weeks:**
- Inflation rate vs. price level (INF-01, the most common misconception)
- Insurance as catastrophic protection vs. routine care (INS-01)
- Bond pricing: inverse interest-rate/price relationship (INT-06)

**Tier 2 - Address before mid-semester:**
- Risk-return tradeoff using financial-domain examples (RISK-02)
- Auto loan and mortgage negotiation basics (INT-05, BORROW-03)
- Deductible/premium/copay terminology (knowledge gap on Q13)

**Tier 3 - Reinforce throughout the semester:**
- Emergency fund sizing (BORROW-05)
- Stock market function beyond wealth creation (RISK-07)
- Diversification across asset classes (already well-understood by most, but format-sensitive)

### 7.2 What to Change Next Week

These are five concrete actions for the first two weeks of instruction:

1. **15-minute inflation module.** Before covering the inflation chapter, spend 15 minutes on the distinction between "inflation is going down" (prices still rising, just more slowly) and "prices are going down" (deflation). A simple two-line graph - one showing the inflation rate, one showing the price level - makes this visual and sticky.

2. **Insurance framing correction.** Before the insurance module, open with this question: "What is the main reason people buy insurance?" Let students answer. Then show them that the answer is catastrophic financial protection, not covering routine expenses. The frequency-vs-severity framing (routine visits are common but cheap; hospitalizations are rare but financially devastating) maps well to how students already think about their own experience.

3. **Bond pricing worked example.** Prepare a one-page handout showing a $1,000 bond paying 5% interest. Then show what happens to its market value when new bonds start paying 6%. Walk through the arithmetic. Students who see the numbers tend to remember the inverse relationship; students who only hear "bond prices fall when rates rise" tend not to.

4. **"Read the question twice" reminder.** For the pre-test, nearly one in three high-confidence errors turned out to be selection errors. Mention to students - without giving away answers - that some questions are tricky to parse, and that reading carefully before answering is worth the extra few seconds. This sets expectations for the post-test.

5. **Review the misconception taxonomy.** Skim the misconception taxonomy data (Appendix B) to see which codes appear most often. Use that to decide where to slow down during lectures and where to add practice problems. The top five codes account for the bulk of diagnosed misconceptions.

### 7.3 Mid-Semester Reinforcement

Between mid-semester and the planned post-assessment, consider:

- **Misconception spot-checks.** After covering each domain, give students a short ungraded quiz that targets the top misconceptions from the pre-test (INF-01, INS-01, RISK-02). If the same errors show up, revisit the material.
- **"Myth or fact" exercises.** Take the top misconception codes and turn them into true/false warm-ups at the start of class. For example: "Lower inflation means prices are going down - myth or fact?" This lets students self-correct without the pressure of a graded assessment.
- **Student-facing feedback.** If the teaching team wants to go further, consider sharing anonymized class-level results (not individual scores) with students so they can see where the class struggled. Transparency about common misconceptions can normalize the idea that financial literacy is something to build, not something you either have or don't.

---

## 8. Recommendations

The table below maps each major finding to a specific teaching or assessment change, with a note on how the planned post-assessment (Paper 2, contingent on IRB approval) could check whether the change made a difference.

**Table 8.1: Course Improvement Recommendations**

| # | Finding | Evidence (denominator, source) | Teaching Change | Assessment Change | Post-Test Check (planned, if approved) |
| --- | --- | --- | --- | --- | --- |
| 1 | 79% of high-confidence errors on Q6 reflect confusion between inflation rate and price level (INF-01) | diagnose_by_item.csv, Q6 row: 42 of 53 misconceptions (n = 354 consented) | Dedicate instruction to distinguishing "lower inflation" from "falling prices" using rate-vs-level visual aids | - | Compare pre-post INF-01 prevalence on Q6 |
| 2 | 82% of high-confidence errors on Q12 reflect belief that routine care is insurance's main function (INS-01) | diagnose_by_item.csv, Q12 row: 23 of 28 misconceptions (n = 354) | Add module on health insurance purpose: catastrophic protection vs. routine care | - | Compare pre-post Q12 accuracy and INS-01 prevalence |
| 3 | 82% of high-confidence errors on Q30 reflect reasoning-from-exceptions (RISK-02) | diagnose_by_item.csv, Q30 row: 14 of 17 misconceptions (n = 354) | Introduce risk-return using historical asset-class return data rather than abstract statements | - | Compare pre-post RISK-02 prevalence |
| 4 | 81% of high-confidence errors on Q36 are selection errors from T/F format | diagnose_by_item.csv, Q36 row: 34 of 42 selection errors (n = 354) | - | Revise Q36 from True/False to standard MCQ | Compare Q36 selection error rate after revision |
| 5 | 41% of high-confidence errors on Q10 are selection errors from negation framing | diagnose_by_item.csv, Q10 row: 16 of 39 selection errors (n = 354) | - | Rewrite Q10 to remove "which is FALSE" framing | Compare Q10 selection error rate after revision |
| 6 | Q29 shows 46% misconception rate (INT-06) and high guess rate among correct respondents | diagnose_by_item.csv, Q29 row (n = 24); confirm_by_item.csv, Q29 row (about one-third guesses) | Add bond pricing segment with worked numerical examples | - | Compare pre-post Q29 accuracy and INT-06 prevalence |
| 7 | Q13 shows a high knowledge gap rate - unfamiliarity with deductible terminology | diagnose_by_item.csv, Q13 row: about one-third knowledge gaps (n = 19, n = 354) | Add insurance terminology module: deductible, premium, copay, out-of-pocket maximum | - | Compare pre-post Q13 knowledge gap rate |
| 8 | Several items show format-driven selection errors disproportionate to actual misunderstanding | diagnose_by_item.csv, multiple items with high SE% (n = 354) | - | Flag Q9 and Q14 for format revision; consider converting to MCQ | Compare SE rates before and after revision |
| 9 | Q2 and Q8 reveal gaps in borrowing mechanics and loan negotiation knowledge | diagnose_by_item.csv, Q8 row: 19 of 34 misconceptions, 56% (n = 354); Q2 row: over one-third knowledge gaps | Add credit-literacy module covering mortgage term/interest tradeoffs and consumer loan negotiation | - | Compare pre-post accuracy on Q2 and Q8 |
| 10 | Five dominant misconception clusters emerged across the assessment | misconception_taxonomy_observed.csv (62 codes); diagnose_by_item.csv cross-item patterns | Generate per-student misconception profiles from pre-course data; distribute targeted review materials before mid-term | - | Track within-student misconception resolution rate in pre-post comparison |

---

## 9. Limitations

A few things to keep in mind when reading this report:

1. **This is a single pre-test.** We are describing what students knew before the course started. There are no learning gains, no before-and-after comparisons, and no way to tell from this data alone whether instruction changed anything. That analysis is planned for Paper 2, contingent on IRB approval.

2. **The diagnostic sample is not a random cross-section.** SDM-10 diagnose items only go to students who answered incorrectly with high confidence. Confirm items only go to students who answered correctly with low confidence. The misconception rates in Section 6 describe the tails of the distribution, not the whole class.

3. **One AI model scored all open-ended responses.** GPT-4.1 classified the 778 consented responses with zero processing errors and high internal confidence. But automated scoring may not agree with human judgment on every borderline case. A human-AI agreement study would strengthen reliability evidence.

4. **Self-reported demographics.** Students self-reported all demographic and financial background information. Response bias (social desirability, opt-out patterns) may affect these distributions.

5. **Subgroup performance patterns are descriptive only.** Section 4.3 reports mean scores by demographic group, but this report makes no claims about why those differences exist. Many characteristics overlap (e.g., work status, financial stress, parental education), and disentangling their individual contributions would require multivariate analysis that is beyond the scope of an instructor-facing pre-test summary.

6. **Suppression limits subgroup detail.** Groups with fewer than 10 respondents are suppressed to protect privacy. This means some potentially informative subgroup comparisons cannot be reported.

---

## Appendix A: Definitions

**Anchor item.** One of the 40 core assessment questions that every student answers. 26 are scored knowledge items; 14 are unscored preference items.

**Variant.** A follow-up item from the SDM-10 bank. Variants are pre-written (not generated on the fly) and come in several formats: multiple choice, True/False, or open-ended. The bank contains 182 variants authored and reviewed before the assessment window opened.

**Scenario variant.** A follow-up that tests the same concept as the anchor item but in a different real-world context.

**Format variant.** A follow-up that tests the same concept in a different question format (e.g., MCQ instead of T/F).

**Open_Diagnose.** An open-ended follow-up triggered when a student answers incorrectly with high confidence. The student explains their reasoning. Classified as misconception, knowledge gap, or selection error.

**Open_Confirm.** An open-ended follow-up triggered when a student answers correctly with low confidence. The student explains why the correct answer is right. Classified as verified, partial, or likely guess.

**These two follow-up types are alternatives, not sequential steps.** A given anchor item triggers one or the other based on the student's response - never both.

**Confidence scale.** 1 = low confidence, 2 = mid confidence, 3 = high confidence. Assigned by the student for each anchor item.

**Overconfidence Index (OI).** Average normalized confidence minus average accuracy. Positive values indicate overconfidence; negative values indicate underconfidence.

**Selection error.** The student understands the concept (as shown in their open-ended explanation) but picked the wrong answer on the anchor item. This is a format or test-taking issue, not a knowledge issue.

**Knowledge gap.** The student acknowledges uncertainty or has no mental model for the concept. They don't hold a specific wrong belief - they just don't know.

**Misconception.** The student holds an active incorrect belief about the concept. They can articulate what they think and why, but what they think is wrong. Misconceptions are coded using a two-layer taxonomy: Layer 1 has 37 transferable families across seven categories, and Layer 2 has item-specific tags.

---

## Appendix B: Data Sources

| File | Description | Used For |
| --- | --- | --- |
| `exports/Bolivard_QUIN102_Paper1.docx` | Final research paper (authoritative reference for wording, definitions, tables) | Terminology, funnel numbers (653/443/431), Table 7.4/7.6/7.9/8.1 |
| `docs/data/domain-score-distribution.csv` | Score counts and percentages by 10-point bin (N = 431) | Section 5.1 performance bands, Figure R1 |
| `docs/data/collection-summary.csv` | Daily enrollment and completion counts (Feb 2-10) | Section 3 participation funnel, Figure R3 |
| `exports/subgroup_performance.csv` | Mean scores by demographic group (N = 431, read-only DB queries) | Section 4.3 performance by student characteristics |
| `exports/report_figures/fig1_score_distribution.png` | Score distribution histogram | Figure R1 |
| `exports/report_figures/fig2_domain_performance.png` | Domain performance bar chart with error bars (patched: ylim=105) | Figure R2 |
| `exports/report_figures/fig3_enrollment_timeline.png` | Daily enrollment/completion timeline | Figure R3 |
| `exports/report_figures/fig5_confidence_calibration.png` | Confidence calibration categories (bar + pie) | Figure R4 |
| `exports/report_figures/fig6_item_difficulty.png` | Item difficulty ranking (26 items) | Figure R5 |
| `exports/report_figures/fig7_demographics.png` | Demographic panels (6 subplots) | Figure R6 |
| `exports/report_figures/fig8_financial_background.png` | Financial stress and self-rated knowledge panels | Figure R7 |
| `exports/diagnose_by_item.csv` | AI classification counts per item: misconception, knowledge gap, selection error (n = 354 consented) | Sections 6.1, 6.3, 6.4, Table 8.1 |
| `exports/confirm_by_item.csv` | Understanding verification per item: verified, partial, likely guess (n = 354 consented) | Section 6.2 |
| `exports/misconception_taxonomy_observed.csv` | 62 observed misconception instances by Layer 1 code, Layer 2 tag, and item | Section 6.3 |
| `exports/generate_charts.py` | Chart generation script; source for domain means (lines 85-86), confidence calibration counts (lines 190-191), item difficulty data (lines 229-256), demographic percentages (lines 297-420) | Sections 4.1, 4.2, 5.2, 5.4, 5.3 |
