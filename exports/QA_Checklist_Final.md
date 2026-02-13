# Pre-Submission QA Checklist: Bolivard QUIN 102 Paper 1

| # | Constraint | Status | Verification |
|---|-----------|--------|--------------|
| 1 | **Walkthrough uses qualitative language only** (no internal numeric values for diagnostic priority, no "0 to 5," no "exceeds threshold") | PASS | Grep for numeric priority patterns in Section 4.1: zero matches. Cases use "high diagnostic priority" and "flagged for follow-up" only. |
| 2 | **"Mastery" does not appear in main text** (Sections 1 through 10) | PASS | Single allowed occurrence in Appendix A Table A.4: "labeled `mastery` in the codebase." Zero occurrences in Sections 1 through 10. |
| 3 | **SDM item bank count consistent across all references** (182 variant rows) | PASS | Verified in Table 3.1 (line 134), Section 4.2 (line 176), Appendix A Table A.1 (line 674), and Appendix E (line 1089). All read "182." |
| 4 | **No causal claims about instructional effectiveness** | PASS | All "caused by" references describe item format effects on error patterns (diagnostic finding), not learning outcomes. Limitation 1 (Section 9) explicitly disclaims causal claims. |
| 5 | **Planned Validation Study is 500 to 700 words with protocol-preview hedging** | PASS | Word count: 584. Contains 15 hedging instances: "if approved" (2x), "planned" (4x), "contingent on" (2x), "would" (7x). No guarantees of IRB approval or commitments to specific analyses. |
| 6 | **SDM conditioning caveat appears in all required locations** | PASS | Present in Section 7 opener (line 284), Section 7.3 (line 335), Section 7.4 (line 397), Section 7.5 (line 433), and Section 7.6 (line 470). |
| 7 | **Demographic suppression rule stated and applied** | PASS | Rule stated in Section 6.2 (line 263). Applied in Table 6.1: "Other/Prefer not to say" row shows n = 2 with "< 10 (suppressed)." |
| 8 | **AI scoring uses concordance/agreement language, not accuracy** | PASS | Section 4.4 describes "11-model concordance protocol." Appendix D tables titled "Multi-Model Concordance Results" and "Inter-Model Agreement." No claims of classification accuracy against labeled ground truth. |
| 9 | **Recommendations table percentages match verified denominators** | PASS | All 12 item-level percentages verified against `diagnose_by_item.csv` and `confirm_by_item.csv` with explicit numerator/denominator: Q6 79% (42/53), Q12 82% (23/28), Q30 82% (14/17), Q35 78% (7/9), Q36 81% (34/42), Q10 41% (16/39), Q29 46% (11/24) + 33% (4/12), Q13 32% (6/19), Q9 83% (5/6), Q14 71% (5/7), Q2 36% (8/22), Q8 56% (19/34). |
| 10 | **Automated data verification passes** | PASS | `verify_paper_tables.py` reports 31/31 PASS. DOCX regenerated at 998.3 KB. No broken table, figure, or section cross-references detected. |
