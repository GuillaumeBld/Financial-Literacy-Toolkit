# Supplemental Diagnostic Module (SDM-10): Selection Algorithm and Operational Specification

## 1. Introduction and Design Rationale
The Supplemental Diagnostic Module (SDM-10) is a ten-item adaptive follow-up component administered immediately after the 40-item core assessment. Because the primary research questions (RQ1 and RQ2) rely exclusively on the 26 knowledge items for pre-post gain estimation, the SDM-10 serves a secondary diagnostic function: it identifies specific misconceptions, verifies uncertain correct responses, and produces actionable instructional feedback without contributing to the main outcome measures.
From this perspective, the SDM-10 is designed not to measure learning gains directly but to explain heterogeneity in student understanding at the subcategory level. The module adds diagnostic value precisely in cases where the anchor response alone is insufficient to characterize the student's knowledge state. Consequently, the selection algorithm prioritizes items where additional information is most likely to resolve ambiguity about whether a response reflects genuine understanding, a fortunate guess, a confident misconception, or complete unfamiliarity with the concept.
The algorithm operates under a set of hard constraints that ensure burden control, domain coverage, and format diversity. Within these constraints, item selection is governed by a deterministic priority system based on a composite Need score, which quantifies the information deficit associated with each anchor response. This section documents the diagnostic framework, operational logic, constraint enforcement, tiebreaker hierarchy, and execution phases of the SDM-10 selection algorithm.

## 2. Diagnostic Framework: Information Deficit Model
The SDM-10 selection algorithm is grounded in an information deficit model, which prioritizes follow-up items based on how little the anchor response reveals about the student's underlying knowledge state. From this perspective, the goal is not to penalize incorrect responses but to target cases where residual uncertainty is highest after observing the anchor outcome.

### 2.1 Diagnostic Goals
The SDM-10 is designed to address nine diagnostic goals that cannot be achieved through anchor responses alone. These goals are summarized in Table 1.

Table 1. SDM-10 Diagnostic Goals

| # | Diagnostic Goal | Anchor Signal | What SDM Reveals |
| --- | --- | --- | --- |
| 1 | Differentiate misconception from guess | Incorrect | Whether the error is systematic or random |
| 2 | Verify understanding vs lucky guess | Correct + Low confidence | Whether reasoning supports the answer |
| 3 | Identify specific misconception type | Incorrect + High confidence | Which misconception is held |
| 4 | Detect hidden misconceptions | Do Not Know | Whether avoidance masks latent errors |
| 5 | Assess foundation level | Any incorrect or Do Not Know | Whether basic concepts are recognized |
| 6 | Measure metacognitive calibration | Confidence vs correctness | Accuracy of self-assessment |
| 7 | Distinguish careless error from true gap | Incorrect + Mid confidence | Whether error is stable or a slip |
| 8 | Assess depth of knowledge gap | Incorrect + Low confidence | Total ignorance vs partial knowledge |
| 9 | Confirm mastery for high performers | Correct + High confidence | Ability to transfer or apply (optional) |


### 2.2 Signal Status Classification
The information deficit associated with an anchor response depends on the relationship between correctness and confidence. This relationship can be classified into three categories: signal conflict, signal absence, and signal alignment.
Signal conflict occurs when correctness and confidence convey inconsistent information about the student's knowledge state. Two response patterns exhibit signal conflict: incorrect responses with high confidence (the student is wrong but believes they are right) and correct responses with low confidence (the student is right but doubts their answer). These cases demand explanation because the observed outcome does not match the student's self-assessment, suggesting either a systematic misconception or a fortunate guess.
Signal absence occurs when the student provides minimal information about their knowledge state. The prototypical case is a "Do Not Know" response, in which the student declines to commit to any answer. Because no reasoning can be inferred from this response, the information deficit is maximal.
Signal alignment occurs when correctness and confidence are consistent. For example, a correct response with high confidence suggests genuine understanding, while an incorrect response with low confidence suggests an acknowledged knowledge gap. In these cases, the anchor response alone provides a reasonable basis for inference, and follow-up items add less diagnostic value.

### 2.3 The Three Most Diagnostically Valuable Cases
Based on the signal status classification, three response patterns emerge as the highest priorities for SDM-10 follow-up:

Table 2. High-Priority Response Patterns

| Response Pattern | Signal Status | Core Diagnostic Question | Probe Type |
| --- | --- | --- | --- |
| Incorrect + High Confidence | Conflict | What do they think they know that is not true? | Open-ended (elicit reasoning) |
| Correct + Low Confidence | Conflict | Do they actually understand, or did they guess? | Open-ended (elicit reasoning) |
| Do Not Know | Absent | What is happening in their mental model at all? | Closed-format (discover foundation) |

The first two cases (signal conflict) benefit from open-ended probes because the student has committed to an answer and can articulate reasoning. The third case (signal absence) requires a closed-format probe because the student has explicitly declined to reason, making an open-ended prompt uninformative. In this case, a foundational multiple-choice item can reveal whether any basic understanding exists or whether hidden misconceptions are present.

## 3. Anchor Format Considerations
The 26 knowledge anchors use two response formats: multiple-choice (MCQ) with four options, and True/False (T/F) with two options plus "Do Not Know." The format distribution and its implications for diagnostic value are documented in this section.

### 3.1 Format Distribution
Of the 26 knowledge anchors, 19 use multiple-choice format and 7 use True/False format. All items include a "Do Not Know" option. The T/F anchors are Q2, Q3, Q11, Q30, Q35, Q36, and Q39.

### 3.2 Differential Guess Probability
The anchor format affects the probability that a correct response reflects a fortunate guess rather than genuine understanding. For MCQ items, random guessing yields a 25% (1 in 4) probability of a correct answer. For T/F items, random guessing yields a 50% (1 in 2) probability. This difference has two implications for the SDM-10 selection algorithm.
First, Correct + Low Confidence responses on T/F items are more likely to be guesses than the same response pattern on MCQ items. Although both patterns receive Need = 5 (signal conflict), the tiebreaker hierarchy prioritizes T/F items to ensure verification of the more suspicious cases.
Second, Correct + Mid Confidence responses on T/F items warrant greater scrutiny than the same pattern on MCQ items. Mid-confidence on a 50/50 question is statistically equivalent to low-confidence on a 4-option question. Consequently, the Need score for T/F Correct + Mid is elevated from 1 to 2, treating it as equivalent to an acknowledged gap that requires verification.

### 3.3 Differential Distractor Information
MCQ items provide diagnostic information through distractor selection: when a student chooses an incorrect option, the specific distractor chosen may reveal the nature of their misconception. T/F items do not provide this information; when a student answers incorrectly, the response reveals only that they hold the opposite belief, not why.
Consequently, Incorrect + High Confidence responses on T/F items have higher information deficit than the same pattern on MCQ items. Although both patterns receive Need = 5, the tiebreaker hierarchy prioritizes T/F items to ensure that open-ended probes are allocated to cases where reasoning elicitation is most needed.

## 4. Selection Constraints
The SDM-10 selection algorithm operates within six hard constraints, summarized in Table 3. These constraints are enforced strictly; no item may be selected if doing so would violate any constraint, regardless of its Need score.

Table 3. SDM-10 Selection and Burden Controls

| Control | Rule |
| --- | --- |
| SDM size | Fixed 10 items after the 40 initial questions |
| Selection basis | Ranked by Need score at subcategory level |
| Domain balance | At least 2 items per domain (borrowing/credit, investment, risk management) |
| Subcategory cap | Maximum 2 SDM items per subcategory |
| Open-ended cap | Maximum 3 open-ended items in the SDM-10 |
| Item source | Pre-written item bank only; no generated questions |

The domain balance constraint ensures that no single content area dominates the diagnostic output, which is particularly important given that the three domains contain unequal numbers of anchor items (10 in Borrowing and Credit, 4 in Risk Management, and 12 in Investment and Risk). The subcategory cap prevents over-testing of any single concept, while the open-ended cap limits respondent burden associated with free-response items and ensures that open-ended slots are reserved for signal-conflict cases where reasoning elicitation is most valuable.

## 5. Need Score Calculation
The Need score is the primary determinant of selection priority. It quantifies the information deficit associated with each anchor response, assigning higher values to cases where residual uncertainty is greatest. The Need score is computed based on four inputs: correctness, confidence level, whether the student selected "Do Not Know," and the anchor format (MCQ vs T/F).

### 5.1 Response Types and Confidence Collection
For each anchor item, the student provides one of the following response types:

- Standard response: The student selects an answer option (correct or incorrect) and then reports a confidence level on a three-point scale (1 = low, 2 = mid, 3 = high).
- Do Not Know response: The student selects "Do Not Know" (or equivalent). In this case, no confidence prompt is presented because the response itself signals low confidence, and asking the student to rate confidence in their lack of knowledge would be uninformative.

### 5.2 Format-Aware Need Score Mapping
The Need score is assigned according to Table 4. The scoring reflects the information deficit model, with signal-conflict cases receiving the highest priority, followed by signal-absent cases, and signal-aligned cases receiving progressively lower priority. For T/F anchors, Correct + Mid Confidence is elevated to Need = 2 to reflect the higher probability that mid-confidence on a 50/50 question represents a partially-informed guess.

Table 4. Format-Aware Need Score Mapping

| Response | Confidence | MCQ Need | T/F Need | Signal Status | Interpretation |
| --- | --- | --- | --- | --- | --- |
| Incorrect | High (3) | 5 | 5 | Conflict | Confident misconception |
| Correct | Low (1) | 5 | 5 | Conflict | Possible fortunate guess |
| Do Not Know | N/A | 4 | 4 | Absent | Maximum uncertainty |
| Incorrect | Mid (2) | 3 | 3 | Partial | Uncertain error |
| Correct | Mid (2) | 1 | 2 | Aligned/Partial | T/F elevated: 50% guess rate |
| Incorrect | Low (1) | 2 | 2 | Aligned | Acknowledged gap |
| Correct | High (3) | 0 | 0 | Aligned | Demonstrated mastery |


### 5.3 Diagnostic Rationale
The highest Need score (5) is assigned to two response patterns: Incorrect + High Confidence and Correct + Low Confidence. Both patterns exhibit signal conflict, meaning the student's correctness and self-assessment are inconsistent. For Incorrect + High Confidence, the conflict suggests a confident misconception that may resist correction without targeted intervention. For Correct + Low Confidence, the conflict raises the possibility that the correct answer was a fortunate guess rather than a reflection of genuine understanding. In both cases, an open-ended probe that elicits reasoning is the most informative follow-up.
"Do Not Know" responses receive Need = 4, reflecting maximal information deficit but with a different diagnostic approach. Because the student has explicitly declined to commit to an answer, there is no reasoning to elicit through an open-ended probe. Instead, a closed-format foundational item can reveal whether any basic understanding exists and whether hidden misconceptions might be present. The slightly lower Need score (4 vs 5) reflects the fact that "Do Not Know" does not consume an open-ended slot, allowing the algorithm to reserve those slots for signal-conflict cases.
Incorrect + Mid Confidence (Need = 3) represents partial uncertainty: the student committed to an error but expressed only moderate confidence. This pattern warrants follow-up to determine whether the error reflects a stable misconception or a momentary lapse, but it is less urgent than signal-conflict or signal-absent cases.
For MCQ anchors, Correct + Mid Confidence receives Need = 1, indicating adequate understanding with low follow-up priority. For T/F anchors, the same pattern receives Need = 2 because mid-confidence on a 50/50 question provides weaker evidence of genuine understanding. Statistically, mid-confidence on a T/F question is approximately equivalent to low-confidence on an MCQ question.
Incorrect + Low Confidence (Need = 2) represents signal alignment: the student was wrong and acknowledged uncertainty. The anchor response already provides useful information (an acknowledged gap exists), so follow-up serves primarily to assess the depth of the gap rather than to discover new information.
Correct + High Confidence (Need = 0) represents the strongest signal alignment. These students answered correctly and expressed certainty, suggesting genuine understanding. Follow-up items add minimal diagnostic value and are selected only when all higher-Need items have been exhausted.

## 6. Variant Construction Methodology
Each of the 26 knowledge anchors is associated with six pre-written variants in the SDM-10 item bank. This section documents the construction principles, design rationale, and structural conventions for each variant type. All variants are linked to their parent anchor through an identifier system in which anchor rows are marked with a trailing "#" symbol (e.g., "Q1#") to facilitate programmatic matching between anchors and their associated variants.

### 6.1 General Construction Principles
Three principles govern the construction of all variant types:

- Context restatement: Because students cannot see the original anchor item during the SDM-10 administration, each variant must restate sufficient context for the student to understand and respond to the follow-up question. For closed-format variants, this typically involves embedding the relevant concept in the question stem. For open-ended variants, this involves explicitly restating the anchor question, the student's answer, and the correct answer (where applicable).
- Diagnostic alignment: Each variant is designed to elicit information that addresses a specific diagnostic goal. Lower variants test whether foundational knowledge exists. Same-level variants test consistency of understanding. Higher variants test transfer and application. Open-ended variants elicit reasoning that reveals the structure of the student's mental model.
- Scoring clarity: All variants must be unambiguously scorable. Closed-format variants have a single correct answer. Open-ended variants include detailed rubrics specifying criteria for full credit, partial credit, and no credit, along with misconception tags for diagnostic classification.

### 6.2 Lower_TF: True/False Foundation Check
The Lower_TF variant tests whether the student recognizes the most basic form of the concept. It is assigned to Incorrect + Low Confidence responses (Need = 2) and to T/F anchors with Correct + Mid Confidence (Need = 2), where a simple recognition check is appropriate.

Construction Method
The anchor concept is reduced to its most fundamental true/false statement. The statement should be unambiguously true or false and should not require calculation, comparison, or multi-step reasoning. The goal is to determine whether the student has any foundational awareness of the concept. For T/F anchors, the Lower_TF variant tests a simpler aspect of the same concept, such as a definition rather than a comparison.

Table 5. Lower_TF Construction Examples

| Anchor | Anchor Question (abbreviated) | Lower_TF Variant |
| --- | --- | --- |
| Q1 (MCQ) | $100 at 2% interest for 5 years yields more than $102? | Money left in a savings account that earns interest will grow over time. True or false? |
| Q11 (T/F) | Single stock vs mutual fund: which is safer? | A mutual fund holds stocks from many different companies, not just one. True or false? |
| Q14 (MCQ) | Spreading money among assets affects risk how? | Putting all your money in one investment is riskier than spreading it across several. True or false? |


### 6.3 Lower_MCQ: Multiple-Choice Foundation Check
The Lower_MCQ variant tests foundational understanding at one level below the anchor difficulty. It is assigned to three response patterns: Do Not Know (Need = 4), Incorrect + Mid Confidence (Need = 3), and as a fallback for Incorrect + High Confidence when the open-ended cap is reached.
Construction Method
The variant focuses on prerequisite knowledge, definitions, or basic recognition that underlies the anchor concept. Options should include one clearly correct answer, one or two plausible distractors based on common misconceptions, and a "Do not know" option. The question should require only one step of reasoning.

Table 6. Lower_MCQ Construction Examples

| Anchor | Anchor Concept | Lower_MCQ Variant |
| --- | --- | --- |
| Q1 (MCQ) | Compound interest over 5 years | Interest on a savings account is: A) Money the bank pays you, B) A fee you pay, C) A penalty for withdrawing, D) Do not know |
| Q13 (MCQ) | Home insurance deductible definition | An insurance deductible is: A) Amount you pay before insurance pays, B) Monthly premium, C) Maximum payout, D) Do not know |
| Q29 (MCQ) | Interest rates and bond prices relationship | A bond is: A) A loan you make that pays interest, B) Ownership in a company, C) A savings account, D) Do not know |


### 6.4 Same_MCQ: Parallel Difficulty Check
The Same_MCQ variant tests the same concept at equivalent difficulty but in a different context. It is assigned to MCQ anchors with Correct + Mid Confidence (Need = 1) and as a fallback for Correct + Low Confidence when the open-ended cap is reached.
Construction Method
The variant presents a novel scenario that requires the same underlying knowledge as the anchor. Numbers, contexts, or framing may change, but the cognitive demand and concept tested should be equivalent. This design allows the algorithm to distinguish stable understanding from context-dependent performance.

Table 7. Same_MCQ Construction Examples

| Anchor | Anchor Question | Same_MCQ Variant |
| --- | --- | --- |
| Q1 (MCQ) | $100 at 2% for 5 years: more than $102? | $500 at 4% for 3 years without withdrawals yields: A) Exactly $560, B) More than $560, C) Less than $560 |
| Q6 (MCQ) | What accompanies successful effort to lower inflation? | Last year inflation was 8%, this year 3%. Prices are: A) Falling by 5%, B) Still rising but slower, C) Staying the same |
| Q34 (MCQ) | Spreading money among assets affects risk how? | Investor puts money in stocks, bonds, real estate, international funds. Risk: A) Increases, B) Decreases, C) Stays same |


### 6.5 Higher_MCQ: Transfer and Application Check
The Higher_MCQ variant tests the ability to apply the concept in a more complex scenario requiring transfer, integration, or multi-step reasoning. It is assigned to Correct + High Confidence responses (Need = 0) when selected, which occurs only when higher-Need items have been exhausted.
Construction Method
The variant presents a scenario that requires applying the anchor concept to a novel situation, integrating multiple concepts, or reasoning through a multi-step problem. The cognitive demand should exceed that of the anchor. These items are designed to probe the upper boundary of the student's understanding.

Table 8. Higher_MCQ Construction Examples

| Anchor | Anchor Concept | Higher_MCQ Variant |
| --- | --- | --- |
| Q2 (T/F) | 15-year vs 30-year mortgage tradeoff | Maria can afford $1,500/month. 15-year at 6% costs $1,400/month; 30-year at 6.5% costs $1,100/month. To pay least total, which should she choose? |
| Q7 (MCQ) | Who is hurt most by high inflation? | Inflation is 7%. Worker A gets 4% raise. Retiree B has fixed pension. Who lost more purchasing power? |
| Q32 (MCQ) | Which asset gives highest long-term return? | Stocks return 10%/year average, bonds 5%, savings 2%. Stocks lost 40% in 2008. For 25-year-old saving for retirement in 40 years, which is best primary investment? |


### 6.6 Open_Confirm: Verification of Uncertain Correct Response
The Open_Confirm variant elicits an explanation from students who answered correctly but reported low confidence (Need = 5, signal conflict). The goal is to determine whether the correct answer reflects genuine understanding or a fortunate guess.
Construction Method
The variant follows a standardized structure: (1) restate the anchor question, (2) note that the student answered correctly, (3) identify the specific correct answer given, and (4) ask the student to explain their reasoning in 1-2 sentences. This structure ensures the student has sufficient context to provide a meaningful explanation.
Prompt Template
"You were asked: [anchor question text]. You answered [correct answer option], which is correct. In 1-2 sentences, explain why this answer is correct."
Rubric Structure
Each Open_Confirm variant includes a three-tier rubric:
Full credit (Rubric_Accept): The response demonstrates understanding of the underlying mechanism or principle. Specific criteria vary by item but typically require mention of the key causal relationship or conceptual link.
Partial credit (Rubric_Partial): The response is directionally correct but lacks specificity or mechanistic explanation. The student appears to have some understanding but cannot fully articulate it.
No credit (Rubric_Reject): The response provides no explanation, an incorrect explanation, or reasoning that contradicts the correct answer.

Table 9. Open_Confirm Rubric Example (Q1: Compound Interest)

| Tier | Criteria |
| --- | --- |
| Full Credit | Mentions interest earning interest, compounding, or interest accumulating each year on a growing balance |
| Partial Credit | "Interest adds up over time" (vague but directionally correct) |
| No Credit | No explanation of why amount exceeds $102, or incorrect reasoning |


### 6.7 Open_Diagnose: Identification of Confident Misconception
The Open_Diagnose variant elicits an explanation from students who answered incorrectly but reported high confidence (Need = 5, signal conflict). The goal is to identify the specific misconception underlying the confident error.
Construction Method
The variant follows a standardized structure: (1) restate the anchor question, (2) list the answer options, (3) note the specific incorrect answer the student selected, (4) note that the student reported high confidence, and (5) ask the student to explain their reasoning in 1-2 sentences. The inclusion of the confidence level signals to the student that their certainty is being examined, which may elicit more reflective responses.
Prompt Template
"You were asked: [anchor question text]. The options were: [A, B, C, D]. You answered [student's incorrect answer] with high confidence. In 1-2 sentences, explain your reasoning for that answer."
Misconception Tags
Each Open_Diagnose variant includes a set of misconception tags that classify common error patterns. These tags are used by the AI scoring system to categorize responses and generate diagnostic reports. Tags are specific to each item and are derived from documented misconceptions in financial literacy research and pilot testing.

Table 10. Open_Diagnose Misconception Tags Example (Q6: Inflation Lowering)

| Misconception Tag | Description |
| --- | --- |
| deflation-confusion | Student believes lower inflation means prices fall (confuses inflation rate with price level) |
| rate-vs-level | Student conflates rate of change with absolute level |
| unrelated-factor | Student cites employment or other factor unrelated to price dynamics |
| unclear-reasoning | Response does not provide classifiable reasoning |


### 6.8 Item Bank Structure and Anchor-Variant Linking
The complete SDM-10 item bank contains 182 rows: 26 anchor items and 156 variants (6 variants per anchor). The item bank is structured as a flat table with the following key columns for programmatic processing:
Anchor_ID: For anchor rows, this field contains the anchor identifier with a trailing "#" symbol (e.g., "Q1#"). For variant rows, this field contains the anchor identifier without the symbol (e.g., "Q1"). This convention enables efficient filtering: anchor rows can be identified by the presence of "#", and variants can be linked to their parent anchor by matching the base identifier.
Item_Type: Indicates whether the row is an "ANCHOR" or "VARIANT". This field supports filtering and validation.
Variant_ID: For variants, this field contains a compound identifier in the format "[Anchor]_[VariantType]" (e.g., "Q1_Lower_TF", "Q6_Open_Diagnose"). This convention enables direct lookup of specific variants during SDM-10 selection.
Variant_Type: Indicates the variant category (Lower_TF, Lower_MCQ, Same_MCQ, Higher_MCQ, Open_Confirm, Open_Diagnose). This field is used to apply format constraints and presentation ordering.
Anchor_Format: Indicates whether the parent anchor uses MCQ or T/F format. This field is used to apply format-aware Need scoring and tiebreaker logic.
Rubric and Misconception fields: For open-ended variants, the Rubric_Accept, Rubric_Partial, Rubric_Reject, and Misconception_Tags fields contain the scoring criteria and diagnostic classifications used by the AI scoring system.

## 7. Variant Type Assignment and Format Fallback
Each anchor item in the pre-written item bank is associated with six variant types, each targeting a different diagnostic function. The variant type assigned to a selected item depends on its Need score and, for signal-conflict cases, on whether the open-ended format cap has been reached.

### 7.1 Primary Variant Mapping
Table 11 presents the mapping from Need score to variant type. The mapping is designed to match probe format to diagnostic goal: open-ended variants are reserved for signal-conflict cases (Need = 5) where reasoning elicitation is most valuable, while closed-format variants are used for all other cases.

Table 11. Primary Variant Type Assignment by Need Score

| Need | Response Pattern | Primary Variant | Format | Diagnostic Function |
| --- | --- | --- | --- | --- |
| 5 | Incorrect + High | Open_Diagnose | Open-ended | Identify specific misconception |
| 5 | Correct + Low | Open_Confirm | Open-ended | Verify reasoning |
| 4 | Do Not Know | Lower_MCQ | Multiple choice | Test foundation, detect hidden errors |
| 3 | Incorrect + Mid | Lower_MCQ | Multiple choice | Test foundation, clarify error |
| 2 | Incorrect + Low / T/F Correct + Mid | Lower_TF | True/False | Confirm basic recognition |
| 1 | MCQ Correct + Mid | Same_MCQ | Multiple choice | Parallel difficulty check |
| 0 | Correct + High | Higher_MCQ | Multiple choice | Optional transfer/application |


### 7.2 Format Fallback Mechanism
Because the open-ended cap (maximum 3) may be reached before all Need = 5 items have been selected, the algorithm implements a format fallback mechanism. When an item's primary variant is open-ended (Open_Diagnose or Open_Confirm) but the cap has been reached, the item is not discarded; instead, it is assigned a closed-format fallback variant while retaining its Need = 5 score for priority purposes.
This design ensures that high-Need items are not excluded from selection merely because their preferred format is unavailable. The fallback assignments are presented in Table 12.

Table 12. Format Fallback Assignments When Open-Ended Cap Is Reached

| Response Pattern | Primary Variant | Fallback Variant | Rationale |
| --- | --- | --- | --- |
| Incorrect + High (Need 5) | Open_Diagnose | Lower_MCQ | Test foundation if reasoning unavailable |
| Correct + Low (Need 5) | Open_Confirm | Same_MCQ | Parallel check if confirmation unavailable |

Consequently, a student who produces four or more signal-conflict responses (Incorrect + High or Correct + Low) will have three items assigned open-ended variants and the remainder assigned closed-format fallbacks. The Need score continues to govern selection priority, but the format adapts to respect the burden constraint.

## 8. Tiebreaker Hierarchy
When multiple items share the same Need score, the algorithm applies a deterministic tiebreaker hierarchy to ensure reproducible selection. The hierarchy reflects both constraint satisfaction (domain balance) and diagnostic value (format priority, subcategory spread).

### 8.1 Tiebreaker Order
The tiebreaker criteria are applied in the following sequence:

- First, domain deficit: Items from domains that have not yet met the minimum (2 items) are prioritized. This ensures that the domain balance constraint is satisfied before filling remaining slots.
- Second, format priority: Among items with equal domain deficit, T/F anchors are prioritized over MCQ anchors. This reflects the higher information deficit of T/F responses: T/F items provide no distractor information when incorrect, and have higher guess probability when correct. Prioritizing T/F ensures that open-ended slots are allocated to cases where reasoning elicitation is most needed.
- Third, subcategory spread: Among items with equal domain deficit and format priority, those from subcategories with fewer items already selected are prioritized. This promotes diagnostic breadth across content areas.
- Fourth, domain order: If all preceding criteria are equal, items are ordered by a fixed domain sequence (Borrowing and Credit, then Risk Management, then Investment and Risk). This ordering is arbitrary but deterministic.
- Fifth, seeded random: If all preceding criteria fail to differentiate candidates, a seeded random selection is applied. The seed ensures reproducibility: identical inputs with the same seed will produce identical outputs. This approach acknowledges that items with identical Need scores and constraint states are genuinely equivalent from a diagnostic standpoint.

Table 13. Tiebreaker Hierarchy Summary

| Priority | Criterion | Description |
| --- | --- | --- |
| 1 | Domain deficit | Favor domains below the minimum (2) to ensure balance |
| 2 | Format priority | T/F anchors before MCQ anchors (higher information deficit) |
| 3 | Subcategory spread | Favor subcategories with fewer items selected (0 over 1) |
| 4 | Domain order | Fixed sequence: Borrowing/Credit, Risk Management, Investment/Risk |
| 5 | Seeded random | Reproducible random selection if all above criteria are equal |

## 9. Real-Time Pre-Calculation for Seamless Transition
Because the SDM-10 is administered immediately after the final anchor item (Q40), the selection algorithm must execute with minimal latency to preserve the assessment experience. To ensure a perceptually instantaneous transition from item 40 to item 41, the selection algorithm employs a real-time pre-calculation strategy in which Need scores and constraint states are updated incrementally as the student completes each anchor item.

## 9.1 Incremental State Maintenance
Rather than computing all Need scores and running the full selection algorithm after item 40, the system maintains a running state that is updated after each anchor response. This state includes the following components:
* Need score array: A 26-element array storing the current Need score for each knowledge anchor. Each element is updated immediately after the student submits a response and confidence rating (or "Do Not Know") for the corresponding anchor. The anchor format (MCQ vs T/F) is used to determine format-aware Need scores.
* Domain counters: Three counters tracking the number of high-Need items (Need >= 4) in each domain. These counters inform the domain balance constraint during selection.
* Subcategory counters: A dictionary mapping each subcategory to the count of high-Need items. These counters inform the subcategory cap constraint.
* Open-ended budget tracker: A counter tracking the number of Need = 5 items that would require open-ended variants. This informs the open-ended cap and fallback logic.

## 9.2 Pre-Sorted Candidate List
After each anchor response, the system inserts the updated Need score into a pre-sorted candidate list. Because insertion into a sorted list requires O(log n) operations and n = 26, this process completes in under one millisecond. By the time the student completes item 40, the candidate list is already sorted by Need score with tiebreakers applied, and the selection algorithm reduces to a single pass through the list to enforce constraints.

## 9.3 Execution Timeline
The pre-calculation strategy produces the following execution timeline:
* During items 1-40: Each anchor response triggers an O(log n) update to the pre-sorted candidate list and O(1) updates to constraint counters. These operations are imperceptible to the student.
* After item 40: The selection algorithm executes a single O(n) pass through the pre-sorted candidate list, selecting 10 items while enforcing constraints. Total execution time is under 5 milliseconds.
* Item 41 display: The first SDM-10 item is displayed immediately, with no observable delay.

## 10. Algorithm Execution Phases
The selection algorithm proceeds in three phases, each serving a distinct function. This phased approach ensures that hard constraints are satisfied before optimizing for diagnostic value.

## 10.1 Phase 1: Domain Minimum Enforcement
In the first phase, the algorithm iterates through each domain and selects the two highest-Need items that satisfy all constraints. This guarantees that the domain balance requirement (at least 2 items per domain) is met before any remaining slots are filled.

During this phase, the open-ended cap is enforced dynamically. If a Need = 5 item's primary variant is open-ended and the cap has been reached, the fallback variant is assigned. The item remains eligible for selection because its Need score is preserved.

At the conclusion of Phase 1, exactly six items have been selected (two per domain), and the algorithm has recorded the current state of all constraint counters.

## 10.2 Phase 2: Need-Based Slot Filling
In the second phase, the algorithm fills the remaining four slots by iterating through all unselected items in descending order of Need score, applying the tiebreaker hierarchy when scores are equal. For each candidate item, the algorithm verifies that selection would not violate the subcategory cap (maximum 2) or the open-ended cap (maximum 3, with fallback applied if necessary).

This phase continues until ten items have been selected or all eligible candidates have been exhausted. Because 26 anchor items are available and only 10 slots must be filled, exhaustion is not expected under normal circumstances.

## 10.3 Phase 3: Fallback for Underfilled Slots
In rare cases where constraint interactions prevent the algorithm from reaching ten items, Phase 3 activates a fallback mechanism. Items with Need = 0 (Correct + High Confidence) are shuffled using a seeded random generator, and the algorithm attempts to fill remaining slots from this pool.

This phase is expected to execute infrequently, given the diversity of subcategories across the 26 knowledge items. Its inclusion ensures that the SDM-10 always contains exactly ten items, even under edge-case input distributions.

## 11. Presentation Order
After selection, the ten SDM items are reordered for presentation according to a fixed sequence designed to optimize respondent experience and diagnostic coherence. The presentation order groups items by variant type rather than by Need score or anchor sequence.

The ordering proceeds as follows: Open_Diagnose items are presented first, because these items address confident misconceptions and benefit from early placement when respondent attention is highest. Lower_MCQ and Lower_TF items follow, providing foundational checks. Same_MCQ and Higher_MCQ items, which require moderate cognitive effort, are placed in the middle. Open_Confirm items are presented last, allowing students to articulate reasoning after engaging with related closed-format items.

Within each variant type group, items are ordered by descending Need score and then by the tiebreaker hierarchy. This ensures that the most diagnostically valuable items within each format category appear first.

## 12. Validation and Quality Assurance
Upon completion of the selection algorithm, a validation routine verifies that all constraints have been satisfied. The validation checks include: confirmation that exactly ten items have been selected; verification that each domain contains at least two items; confirmation that no subcategory contains more than two items; and verification that no more than three open-ended items have been assigned.

If any constraint violation is detected, the validation routine returns a structured error report identifying the specific violation. In production deployment, such errors would trigger a fallback to a default item set, though this scenario is not expected given the algorithm's constraint-enforcement logic.

## 13. Role of Artificial Intelligence in the SDM-10 Pipeline
The selection algorithm is entirely rule-based and does not involve artificial intelligence or machine learning at the item selection stage. This design choice reflects three considerations: execution speed (AI inference would introduce unacceptable latency), reproducibility (deterministic rules ensure identical inputs produce identical outputs), and auditability (the selection logic can be fully documented and inspected).

Artificial intelligence is employed in the SDM-10 pipeline at a subsequent stage: the scoring of open-ended responses. The Open_Diagnose and Open_Confirm variants elicit free-text explanations, which are scored against pre-specified rubrics using a natural language processing model. The rubrics define criteria for full credit, partial credit, and no credit, as well as a set of misconception tags that the model assigns based on the content of the response.

This division of labor ensures that the selection process remains fast and deterministic, while the scoring process benefits from the flexibility of AI-based text analysis. The misconception tags produced by the scoring model are aggregated into a diagnostic report that identifies patterns in student reasoning, which may inform subsequent instructional interventions.

## 14. Summary
The SDM-10 selection algorithm is grounded in an information deficit model that prioritizes follow-up items based on how little the anchor response reveals about the student's knowledge state. Three response patterns emerge as highest priority: Incorrect + High Confidence (confident misconception requiring identification), Correct + Low Confidence (possible guess requiring verification), and "Do Not Know" (maximum uncertainty requiring foundation check). These patterns receive Need scores of 5, 5, and 4 respectively, ensuring they are selected before lower-priority items.

The algorithm incorporates format-aware scoring that reflects the differential diagnostic value of MCQ versus T/F responses. T/F Correct + Mid Confidence is elevated to Need = 2 (from 1 for MCQ) to account for the higher guess probability on 50/50 questions. The tiebreaker hierarchy prioritizes T/F anchors over MCQ anchors at equal Need scores, ensuring that open-ended probes are allocated to cases with higher information deficit.

The algorithm reserves open-ended variants for signal-conflict cases (Need = 5) where reasoning elicitation is most valuable, while using closed-format variants for signal-absent and signal-aligned cases. A format fallback mechanism ensures that high-Need items are not excluded when the open-ended cap is reached. The tiebreaker hierarchy guarantees reproducibility through seeded randomness as the final criterion, and real-time pre-calculation ensures seamless transition from item 40 to item 41.

Taken together, these design choices produce a supplemental diagnostic module that is responsive to individual student performance, grounded in a principled theory of diagnostic value, and operationally efficient. The diagnostic output, consisting of identified misconceptions, verified understandings, and assessed knowledge gaps, provides actionable information for instructors without contributing to the primary pre-post learning gain estimates.
