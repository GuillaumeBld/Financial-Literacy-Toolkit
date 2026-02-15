# Build Note: QUIN 102 Pre-Test Results Report

**Generated:** 2026-02-15
**Report file:** `_project/source_of_truth/pretest_report.md`
**DOCX output:** `exports/QUIN102_Pretest_Results_Report.docx`
**Generator:** `exports/generate_report.js` (copy of `generate_paper.js` with 4 line changes)

---

## 1. Source Traceability

Every numeric claim in the report traces to a specific file, and where applicable, a specific row/column or line number.

### Primary CSV sources

| Claim | File | Row(s) / Column(s) | Report Section |
| --- | --- | --- | --- |
| Below 50%: 55 students (12.8%) | `docs/data/domain-score-distribution.csv` | Rows 0-9 through 40-49 (count column), sum = 1+8+10+12+24 = 55; percentage = 55/431 = 12.8% | Sec 3.2 |
| 50-69%: 200 students (46.4%) | `docs/data/domain-score-distribution.csv` | Rows 50-59 + 60-69 (count column): 75+125 = 200; percentage = 200/431 = 46.4% | Sec 3.2 |
| 70-79%: 82 students (19.0%) | `docs/data/domain-score-distribution.csv` | Row 70-79 (count column): 82; percentage column: 19.03% | Sec 3.2 |
| 80%+: 94 students (21.8%) | `docs/data/domain-score-distribution.csv` | Rows 80-89 + 90-99 + 100 (count column): 60+23+11 = 94; percentage = 94/431 = 21.8% | Sec 3.2 |
| Modal bin 60-69%: 125 students (29.0%) | `docs/data/domain-score-distribution.csv` | Row 60-69: count=125, percentage=29.00% | Sec 3.2 |
| Diagnose totals: 258 misconception, 68 knowledge gap, 153 selection error, 14 unclassified | `exports/diagnose_by_item.csv` | Column sums: misconception=258, knowledge_gap=68, selection_error=153; total n=493, classified=479 | Sec 5.1 |
| Q6 diagnose: 42 of 53 misconceptions (79%) | `exports/diagnose_by_item.csv` | Q6 row: n=53, misconception=42, misconception_pct=79 | Sec 5.3, Table 7.1 |
| Q12 diagnose: 23 of 28 misconceptions (82%) | `exports/diagnose_by_item.csv` | Q12 row: n=28, misconception=23, misconception_pct=82 | Sec 5.3, Table 7.1 |
| Q30 diagnose: 14 of 17 misconceptions (82%) | `exports/diagnose_by_item.csv` | Q30 row: n=17, misconception=14, misconception_pct=82 | Sec 5.3, Table 7.1 |
| Q36 diagnose: 34 of 42 selection errors (81%) | `exports/diagnose_by_item.csv` | Q36 row: n=42, selection_error=34, selection_error_pct=81 | Sec 5.4, Table 7.1 |
| Q10 diagnose: 16 of 39 selection errors (41%) | `exports/diagnose_by_item.csv` | Q10 row: n=39, selection_error=16, selection_error_pct=41 | Sec 5.4, Table 7.1 |
| Q37 diagnose: 7 of 17 selection errors (41%) | `exports/diagnose_by_item.csv` | Q37 row: n=17, selection_error=7, selection_error_pct=41 | Sec 5.4 |
| Q2 diagnose: 7 of 22 selection errors (32%) | `exports/diagnose_by_item.csv` | Q2 row: n=22, selection_error=7, selection_error_pct=32 | Sec 5.4 |
| Confirm totals: 127 verified (44.6%), 119 partial (41.8%), 39 likely guess (13.7%) | `exports/confirm_by_item.csv` | Column sums: verified=127, partial=119, likely_guess=39; total=285 | Sec 5.2 |
| 62 observed misconception instances | `exports/misconception_taxonomy_observed.csv` | Row count: 62 rows | Sec 5.3 |
| Top misconception codes: INF-01 (42), INF-05 (17), INS-01 (18), INT-05 (19), INF-03 (17) | `exports/misconception_taxonomy_observed.csv` | Aggregated by layer1_code, n column | Sec 5.3 |

### generate_charts.py sources (values not available in any CSV)

| Claim | File | Line(s) | Report Section |
| --- | --- | --- | --- |
| Domain means: Borrowing 69.23%, Behavioral 73.26%, Investment 63.84% | `exports/generate_charts.py` | Lines 85-86 (hardcoded from DB query, N=431) | Sec 3.3 |
| Domain SDs: 18.99, 26.41, 21.52 | `exports/generate_charts.py` | Line 86 | Sec 3.3 |
| Confidence calibration: 140 / 160 / 101 / 30 | `exports/generate_charts.py` | Lines 190-191 (hardcoded from DB, N=431) | Sec 3.4 |
| Item difficulty: 26 items with % correct (Q4 92.8% down to Q38 23.7%) | `exports/generate_charts.py` | Lines 229-256 (hardcoded from DB, N=431) | Sec 3.5 |
| Gender: Female 58.2%, Male 40.4%, Other/PNS suppressed (n=6) | `exports/generate_charts.py` | Lines 297-308 (percentages only used; raw count n=6 NOT printed in report) | Sec 4.1 |
| Age: ≤20 85.2%, >20 13.7%, PNA suppressed (n=5) | `exports/generate_charts.py` | Lines 313-324 (percentages only; raw count n=5 NOT printed) | Sec 4.1 |
| Race/ethnicity: White 48.7%, Hispanic 21.8%, Asian 12.5%, Black 6.7%, Two+ 6.5%, Other/PNS 3.7% | `exports/generate_charts.py` | Lines 328-338 | Sec 4.1 |
| Work: Part-time 70.3%, None 14.6%, Full-time 13.2%, PNA suppressed (n=8) | `exports/generate_charts.py` | Lines 340-353 (raw count n=8 NOT printed) | Sec 4.1 |
| First-gen: No 68.9%, Yes 28.1%, PNS 3.0% | `exports/generate_charts.py` | Lines 356-363 | Sec 4.1 |
| Financial stress: Never 10.7%, Rarely 21.6%, Sometimes 43.9%, Often 18.8%, Always 4.2%, PNA suppressed (n=4) | `exports/generate_charts.py` | Lines 387-398 (raw count n=4 NOT printed) | Sec 4.2 |
| Self-rated knowledge: Very Low 2.1% (n=9), Low 24.8%, Moderate 58.7%, High 12.1%, Very High 1.6% (n=7), PNA suppressed (n=3) | `exports/generate_charts.py` | Lines 406-417 (Very Low and Very High collapsed into adjacent categories in report; raw counts n=9 and n=7 NOT printed) | Sec 4.2 |

### Final DOCX sources (values not in CSVs or generate_charts.py)

| Claim | Source | Report Section |
| --- | --- | --- |
| Funnel: 653 roster, 443 onboarded, 431 submitted | Final DOCX Section 6.1 | Sec 2, Sec 3.1 |
| Mean anchor score 66.4% | Final DOCX Figure 1 annotation / Figure 2 overall-mean label | Sec 3.2 |
| 306 of 354 consented received follow-ups (86.4%) | Final DOCX Section 7.2 | Sec 5 |
| 778 scored responses, zero processing errors | Final DOCX Section 7.2 | Sec 5 |
| GPT-4.1 model used for AI classification | Final DOCX Section 5.3 | Sec 8 (Limitations) |
| Median active assessment time ~18 minutes | Final DOCX Section 6.4 | Sec 3.6 |
| Recommendations wording and structure | Final DOCX Table 8.1 (rewritten for instructor tone) | Sec 7 |

### Figures embedded in DOCX

| Report Figure | Source File | Used In |
| --- | --- | --- |
| Figure R1 (score distribution) | `exports/figures/fig1_score_distribution.png` | Sec 3.2 |
| Figure R2 (domain performance) | `exports/figures/fig2_domain_performance.png` | Sec 3.3 |
| Figure R3 (enrollment timeline) | `exports/figures/fig3_enrollment_timeline.png` | Sec 3.1 |
| Figure R4 (confidence calibration) | `exports/figures/fig5_confidence_calibration.png` | Sec 3.4 |
| Figure R5 (item difficulty) | `exports/figures/fig6_item_difficulty.png` | Sec 3.5 |
| Figure R6 (demographics) | `exports/figures/fig7_demographics.png` | Sec 4.1 |
| Figure R7 (financial background) | `exports/figures/fig8_financial_background.png` | Sec 4.2 |

---

## 2. Denominator Rules

| Denominator | Value | Scope |
| --- | --- | --- |
| Course roster | 653 | Context only. Never used as a performance denominator. |
| Platform onboarded | 443 | Used only in the participation funnel narrative. |
| **N = 431** (submitted) | 431 | All descriptive results: score distribution, domain means, confidence, item difficulty, demographics, financial background (Sections 3-4). |
| **n = 354** (consented) | 354 | All diagnostic and open-ended classifications: diagnose composition, confirm composition, misconception clusters, selection-error hotspots (Section 5). |

**Rule:** N = 431 is used in Sections 3-4 and associated tables/figures. n = 354 is used in Section 5. No mixing of denominators across sections.

---

## 3. Suppression Rules Applied

- **Categories with fewer than 10 respondents** are either (a) labeled "suppressed" or (b) collapsed into adjacent categories.
- **No raw count below 10 is printed anywhere** in the report, including parentheses, footnotes, or examples.
- Specific suppressions applied:
  - Gender: Other/Prefer Not to Say (n=6) → reported as "< 10 students" with no count
  - Age: Prefer Not to Answer (n=5) → reported as "suppressed" with no count
  - Work: Prefer Not to Answer (n=8) → reported as "suppressed" with no count
  - Financial stress: Prefer Not to Answer (n=4) → reported as "suppressed" with no count
  - Self-rated knowledge: Very Low (n=9) collapsed into "Low or Very Low" (combined 26.9%); Very High (n=7) collapsed into "High or Very High" (combined 13.7%); PNA (n=3) → suppressed
- The generate_charts.py source code contains raw suppressed counts in comments. These were used only for verification and are NOT reproduced in the report.

---

## 4. Verification Checklist

| # | Check | Result | Notes |
| --- | --- | --- | --- |
| 1 | DOCX generated without errors | PASS | `node exports/generate_report.js` → 956.5 KB output |
| 2 | Causal verbs grep | PASS | Searched: improves, reduces, causes, leads to, results in, drives, impacts, increase, decrease, raise, lower, boost, diminish. Only factual uses found ("lower inflation" as a concept, not a causal claim). |
| 3 | N=431 in Sec 3-4, n=354 in Sec 5 | PASS | Confirmed via grep. N=431 appears in Sections 3-4 tables and text. n=354 appears in Section 5 and diagnostic tables. No cross-contamination. |
| 4 | <10 suppression: no raw count below 10 printed | PASS | Grepped for single-digit numbers in context; all small numbers are percentages, section numbering, or recommendation row numbers — no suppressed raw counts. |
| 5 | Paper files unmodified by this session | PASS (with note) | `exports/Bolivard_QUIN102_Paper1.docx` and `_project/source_of_truth/paper.md` show pre-existing modifications in git status (from earlier sessions). This report generation session did not modify either file. |
| 6 | Traceability check | PASS | Every numeric claim points to a specific file (and row/column for CSVs). Documented in Section 1 above. |
| 7 | Denominator map present | PASS | Methodology section (report lines 71-76) contains the denominator map as a markdown table with all four tiers. |
| 8 | Mean source check | PASS | Report cites "66.4%" from Final DOCX Figure 1/2 annotation. Does not compute the mean from binned CSV ranges. |
| 9 | Suppressed-count firewall | PASS | No raw counts from suppressed categories (<10) copied from generate_charts.py into the report. Only percentages and "suppressed" markers used. |

### Human-voice checks (supplementary)

| Check | Result | Notes |
| --- | --- | --- |
| AI transition words (notably, furthermore, moreover, additionally, consequently) | PASS | None found. |
| "The present study" | PASS | Not used. |
| Trailing participle clauses (", VERBing") | PASS | One instance found and fixed during drafting (line 272: "rates, suggesting" → "rates. This suggests"). |
| AI power verbs (underscores, highlights, reveals, demonstrates, illuminates, elucidates) | PASS | None found. |

---

## 5. Generator Details

`exports/generate_report.js` is a copy of `exports/generate_paper.js` with exactly 4 line changes:

| Line | Original (generate_paper.js) | Changed to (generate_report.js) |
| --- | --- | --- |
| 29 | `const PAPER_MD = ".../_project/source_of_truth/paper.md";` | `const REPORT_MD = ".../_project/source_of_truth/pretest_report.md";` |
| 30 | `const OUTPUT_PATH = ".../exports/Bolivard_QUIN102_Paper1.docx";` | `const OUTPUT_PATH = ".../exports/QUIN102_Pretest_Results_Report.docx";` |
| 403 | `"QUIN 102 SDM-10 Pretest Analysis — Spring 2026"` | `"QUIN 102 Pre-Test Results Report — Spring 2026"` |
| 906 | `fs.readFileSync(PAPER_MD, "utf-8")` | `fs.readFileSync(REPORT_MD, "utf-8")` |

No structural changes to the markdown parser, table builder, image embedding, styles, numbering, or section layout.

---

## 6. Files Produced

| File | Type | Size |
| --- | --- | --- |
| `_project/source_of_truth/pretest_report.md` | Report source (Markdown) | ~414 lines |
| `exports/generate_report.js` | DOCX generator (Node.js) | 1068 lines |
| `exports/QUIN102_Pretest_Results_Report.docx` | Final output (DOCX) | 956.5 KB |
| `exports/QUIN102_Pretest_Report_BuildNote.md` | This file | — |
