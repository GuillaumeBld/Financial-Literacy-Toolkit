# Changes Since Professor Review: Bolivard QUIN 102 Paper 1

## Structural Refactoring (Findings-Forward)

1. **Restructured from engineering-forward to findings-forward.** Technical platform details (architecture, authentication, deployment) moved out of the main text into a new Appendix F. The main body now centers on Results (Section 7) and Discussion (Section 8).

2. **New Section 7 (Results) consolidates all diagnostic findings.** Seven subsections cover anchor score distributions, confidence calibration, diagnose and confirm classification breakdowns, misconception clusters, selection error patterns, and AI scoring validation. Each subsection that relies on SDM-conditioned data opens with an explicit conditioning caveat.

3. **New Section 8.2 adds a 10-row course improvement recommendations table.** Each row links a specific finding to its evidence source, a recommended instructional or instrument change, and how Paper 2 will evaluate the change. Recommendations span content gaps (e.g., inflation rate vs. price level confusion), item format revisions (e.g., removing negation framing on Q10 and Q36), and per-student misconception profiling.

4. **Planned Validation Study (Section 10) rewritten as a protocol preview** at 584 words, with explicit hedging ("if approved," "planned," "contingent on") and no commitments regarding IRB approval.

## Terminology and Constraint Compliance

5. **Renamed internal algorithm labels to reader-friendly terms.** "Need score" replaced with "diagnostic priority score" throughout. "Mastery-probing fallback" replaced with "understanding-verification fallback." The term "mastery" appears only once in Appendix A, noting it as the codebase implementation label.

6. **Added a two-case illustrative walkthrough (Section 4.1).** Case A (Q6, Open_Diagnose) and Case B (Q29, Open_Confirm) demonstrate the pipeline using qualitative language only, with no internal numeric priority values or threshold references.

7. **SDM item bank count corrected to 182 variant rows** across all references (Table 3.1, Section 4.2, Appendix A, Appendix E), matching the verified count from `sdm10_item_bank.xlsx`.

## Readability Improvements

8. **Condensed Section 4 from approximately 3,500 words to 1,200 words.** Algorithm tables (mapping matrix, variant assignment rules) moved to Appendix A. Section 4 now provides conceptual summaries with "see Appendix" pointers.

9. **Condensed Section 5 from approximately 800 words to 250 words.** Platform architecture and authentication details consolidated into a single sentence pointing to Appendix F. Only consent mechanics remain in the main text.

10. **Replaced all raw URLs with a Data and Materials Availability statement** in Appendix E, directing readers to the project repository.

## Data Integrity and Privacy

11. **Applied demographic suppression rule.** Cells with fewer than 10 respondents are collapsed into an "Other/Prefer not to say" grouping or reported as suppressed, stated explicitly in Section 6.2 and applied in Table 6.1 (n = 2 cell suppressed).

12. **All statistics verified against source CSV files.** The automated verification script (`verify_paper_tables.py`) confirms 31/31 data checks pass. Recommendation table percentages verified with explicit numerator/denominator from `diagnose_by_item.csv` and `confirm_by_item.csv`.
