# Build Note: QUIN 102 Pre-Test Results Report (v2)

**Generated:** 2026-02-17
**Report file:** `_project/source_of_truth/pretest_report.md`
**DOCX output:** `exports/QUIN102_Pretest_Results_Report.docx`
**Generator:** `exports/generate_report.js` (copy of `generate_paper.js` with 4 line changes)
**Figure pipeline:** `exports/generate_report_figures.py` (copies figures + patches fig2)

---

## 0. Changes from v1

| Change | Description |
| --- | --- |
| Expanded Section 2.2 | "What the SDM-10 Adds" expanded from 2 to 5 paragraphs: variant definition, why variants exist, why open-ended matters, Open_Diagnose vs Open_Confirm as alternatives |
| Section reorder | New order: 3 (Funnel), 4 (Student Chars), 5 (Overall Results), 6 (Diagnostic). Old order had Results before Chars. |
| Section 4.3 added | "Performance by Student Characteristics" with mean scores by gender, race, work, first-gen, self-rated knowledge, financial stress. Data from read-only DB queries. |
| Section 5.4 expanded | Overconfidence section expanded with pedagogical context and four practical teaching strategies |
| Section 6 rewritten | Diagnostic insights rewritten with bullet-point format for key findings |
| Figure R2 patched | ylim raised from 100 to 105 to fix clipped Behavioral bar label. Error bar explanation added to caption. |
| report_figures/ created | All figures copied to exports/report_figures/; fig2 regenerated with layout fix |
| subgroup_performance.csv | New file from read-only DB queries documenting all subgroup means |
| Em dashes removed | All em dashes replaced with regular dashes throughout |
| Limitation 5 updated | Old: "No subgroup comparisons." New: "Subgroup performance patterns are descriptive only." |
| Limitation 6 added | Suppression limits subgroup detail |

---

## 1. Source Traceability

Every numeric claim in the report traces to a specific file, and where applicable, a specific row/column or line number.

### Primary CSV sources

| Claim | File | Row(s) / Column(s) | Report Section |
| --- | --- | --- | --- |
| Below 50%: 55 students (12.8%) | `docs/data/domain-score-distribution.csv` | Rows 0-9 through 40-49 (count column), sum = 1+8+10+12+24 = 55; percentage = 55/431 = 12.8% | Sec 5.1 |
| 50-69%: 200 students (46.4%) | `docs/data/domain-score-distribution.csv` | Rows 50-59 + 60-69 (count column): 75+125 = 200; percentage = 200/431 = 46.4% | Sec 5.1 |
| 70-79%: 82 students (19.0%) | `docs/data/domain-score-distribution.csv` | Row 70-79 (count column): 82; percentage column: 19.03% | Sec 5.1 |
| 80%+: 94 students (21.8%) | `docs/data/domain-score-distribution.csv` | Rows 80-89 + 90-99 + 100 (count column): 60+23+11 = 94; percentage = 94/431 = 21.8% | Sec 5.1 |
| Modal bin 60-69%: 125 students (29.0%) | `docs/data/domain-score-distribution.csv` | Row 60-69: count=125, percentage=29.00% | Sec 5.1 |
| Diagnose totals: 258 misconception, 68 knowledge gap, 153 selection error, 14 unclassified | `exports/diagnose_by_item.csv` | Column sums: misconception=258, knowledge_gap=68, selection_error=153; total n=493, classified=479 | Sec 6.1 |
| Q6 diagnose: 42 of 53 misconceptions (79%) | `exports/diagnose_by_item.csv` | Q6 row: n=53, misconception=42, misconception_pct=79 | Sec 6.3, Table 8.1 |
| Q12 diagnose: 23 of 28 misconceptions (82%) | `exports/diagnose_by_item.csv` | Q12 row: n=28, misconception=23, misconception_pct=82 | Sec 6.3, Table 8.1 |
| Q30 diagnose: 14 of 17 misconceptions (82%) | `exports/diagnose_by_item.csv` | Q30 row: n=17, misconception=14, misconception_pct=82 | Sec 6.3, Table 8.1 |
| Q36 diagnose: 34 of 42 selection errors (81%) | `exports/diagnose_by_item.csv` | Q36 row: n=42, selection_error=34, selection_error_pct=81 | Sec 6.4, Table 8.1 |
| Q10 diagnose: 16 of 39 selection errors (41%) | `exports/diagnose_by_item.csv` | Q10 row: n=39, selection_error=16, selection_error_pct=41 | Sec 6.4, Table 8.1 |
| Q37 diagnose: 7 of 17 selection errors (41%) | `exports/diagnose_by_item.csv` | Q37 row: n=17, selection_error=7, selection_error_pct=41 | Sec 6.4 |
| Q2 diagnose: 7 of 22 selection errors (32%) | `exports/diagnose_by_item.csv` | Q2 row: n=22, selection_error=7, selection_error_pct=32 | Sec 6.4 |
| Confirm totals: 127 verified (44.6%), 119 partial (41.8%), 39 likely guess (13.7%) | `exports/confirm_by_item.csv` | Column sums: verified=127, partial=119, likely_guess=39; total=285 | Sec 6.2 |
| 62 observed misconception instances | `exports/misconception_taxonomy_observed.csv` | Row count: 62 rows | Sec 6.3 |

### Subgroup performance sources (new in v2)

| Claim | File | Row(s) / Column(s) | Report Section |
| --- | --- | --- | --- |
| Female mean 64.3%, Male mean 69.2% | `exports/subgroup_performance.csv` | gender rows: female n=251 mean=64.32, male n=174 mean=69.19 | Sec 4.3 |
| White 67.3%, Hispanic 63.6%, Asian 67.5%, Black 60.8%, Two+ 68.5% | `exports/subgroup_performance.csv` | race_ethnicity rows | Sec 4.3 |
| Full-time 71.4%, No work 67.8%, Part-time 64.9% | `exports/subgroup_performance.csv` | work_experience rows | Sec 4.3 |
| First-gen Yes 66.4%, No 66.4% | `exports/subgroup_performance.csv` | first_generation_college rows | Sec 4.3 |
| Self-rated High 73.6%, Moderate 67.0%, Low 62.3% | `exports/subgroup_performance.csv` | self_rated_knowledge rows | Sec 4.3 |
| Financial stress Never 71.0%, Always 61.4% | `exports/subgroup_performance.csv` | financial_stress rows | Sec 4.3 |

### generate_charts.py sources (values not available in any CSV)

| Claim | File | Line(s) | Report Section |
| --- | --- | --- | --- |
| Domain means: Borrowing 69.23%, Behavioral 73.26%, Investment 63.84% | `exports/generate_charts.py` | Lines 85-86 (hardcoded from DB query, N=431) | Sec 5.2 |
| Domain SDs: 18.99, 26.41, 21.52 | `exports/generate_charts.py` | Line 86 | Sec 5.2 |
| Confidence calibration: 140 / 160 / 101 / 30 | `exports/generate_charts.py` | Lines 190-191 (hardcoded from DB, N=431) | Sec 5.4 |
| Item difficulty: 26 items with % correct (Q4 92.8% down to Q38 23.7%) | `exports/generate_charts.py` | Lines 229-256 (hardcoded from DB, N=431) | Sec 5.3 |
| Gender: Female 58.2%, Male 40.4%, Other/PNS suppressed (n=6) | `exports/generate_charts.py` | Lines 297-308 (percentages only used; raw count n=6 NOT printed in report) | Sec 4.1 |
| Age: <=20 85.2%, >20 13.7%, PNA suppressed (n=5) | `exports/generate_charts.py` | Lines 313-324 (percentages only; raw count n=5 NOT printed) | Sec 4.1 |
| Race/ethnicity: White 48.7%, Hispanic 21.8%, Asian 12.5%, Black 6.7%, Two+ 6.5%, Other/PNS 3.7% | `exports/generate_charts.py` | Lines 328-338 | Sec 4.1 |
| Work: Part-time 70.3%, None 14.6%, Full-time 13.2%, PNA suppressed (n=8) | `exports/generate_charts.py` | Lines 340-353 (raw count n=8 NOT printed) | Sec 4.1 |
| First-gen: No 68.9%, Yes 28.1%, PNS 3.0% | `exports/generate_charts.py` | Lines 356-363 | Sec 4.1 |
| Financial stress: Never 10.7%, Rarely 21.6%, Sometimes 43.9%, Often 18.8%, Always 4.2%, PNA suppressed (n=4) | `exports/generate_charts.py` | Lines 387-398 (raw count n=4 NOT printed) | Sec 4.2 |
| Self-rated knowledge: Very Low 2.1% (n=9), Low 24.8%, Moderate 58.7%, High 12.1%, Very High 1.6% (n=7), PNA suppressed (n=3) | `exports/generate_charts.py` | Lines 406-417 (Very Low and Very High collapsed into adjacent categories in report; raw counts n=9 and n=7 NOT printed) | Sec 4.2 |

### Final DOCX sources (values not in CSVs or generate_charts.py)

| Claim | Source | Report Section |
| --- | --- | --- |
| Funnel: 653 roster, 443 onboarded, 431 submitted | Final DOCX Section 6.1 | Sec 2, Sec 3 |
| Mean anchor score 66.4% | Final DOCX Figure 1 annotation / Figure 2 overall-mean label | Sec 5.1 |
| 306 of 354 consented received follow-ups (86.4%) | Final DOCX Section 7.2 | Sec 6 |
| 778 scored responses, zero processing errors | Final DOCX Section 7.2 | Sec 6 |
| GPT-4.1 model used for AI classification | Final DOCX Section 5.3 | Sec 9 (Limitations) |
| Median active assessment time ~18 minutes | Final DOCX Section 6.4 | Sec 5.5 |
| Recommendations wording and structure | Final DOCX Table 8.1 (rewritten for instructor tone) | Sec 8 |

### Figures embedded in DOCX

| Report Figure | Source File | Used In |
| --- | --- | --- |
| Figure R1 (score distribution) | `exports/report_figures/fig1_score_distribution.png` | Sec 5.1 |
| Figure R2 (domain performance) | `exports/report_figures/fig2_domain_performance.png` (patched: ylim=105) | Sec 5.2 |
| Figure R3 (enrollment timeline) | `exports/report_figures/fig3_enrollment_timeline.png` | Sec 3 |
| Figure R4 (confidence calibration) | `exports/report_figures/fig5_confidence_calibration.png` | Sec 5.4 |
| Figure R5 (item difficulty) | `exports/report_figures/fig6_item_difficulty.png` | Sec 5.3 |
| Figure R6 (demographics) | `exports/report_figures/fig7_demographics.png` | Sec 4.1 |
| Figure R7 (financial background) | `exports/report_figures/fig8_financial_background.png` | Sec 4.2 |

---

## 2. Denominator Rules

| Denominator | Value | Scope |
| --- | --- | --- |
| Course roster | 653 | Context only. Never used as a performance denominator. |
| Platform onboarded | 443 | Used only in the participation funnel narrative. |
| **N = 431** (submitted) | 431 | All descriptive results: score distribution, domain means, confidence, item difficulty, demographics, financial background, subgroup performance (Sections 3-5). |
| **n = 354** (consented) | 354 | All diagnostic and open-ended classifications: diagnose composition, confirm composition, misconception clusters, selection-error hotspots (Section 6). |

**Rule:** N = 431 is used in Sections 3-5 and associated tables/figures. n = 354 is used in Section 6. No mixing of denominators across sections.

---

## 3. Suppression Rules Applied

- **Categories with fewer than 10 respondents** are either (a) labeled "suppressed" or (b) collapsed into adjacent categories.
- **No raw count below 10 is printed anywhere** in the report, including parentheses, footnotes, or examples.
- Specific suppressions applied:
  - Gender: Other/Prefer Not to Say (n=6) - reported as "< 10 (suppressed)" with no count
  - Age: Prefer Not to Answer (n=5) - reported as "suppressed" with no count
  - Work: Prefer Not to Answer (n=8) - reported as "suppressed" with no count
  - Financial stress: Prefer Not to Answer (n=4) - reported as "suppressed" with no count
  - Self-rated knowledge: Very Low (n=9) collapsed into "Low or Very Low" (combined 26.9%); Very High (n=7) collapsed into "High or Very High" (combined 13.7%); PNA (n=3) - suppressed
- **Subgroup performance tables (Section 4.3):** Gender Other/PNS suppressed. Self-rated knowledge "Very Low" and "Very High" collapsed into "Low" and "High" bins. Financial stress PNA suppressed. All groups with n < 10 show "< 10 (suppressed)" in the n column.
- The generate_charts.py source code and subgroup_performance.csv contain raw suppressed counts in comments/data. These were used only for verification and are NOT reproduced in the report.

---

## 4. Verification Checklist

| # | Check | Result | Notes |
| --- | --- | --- | --- |
| 1 | DOCX generated without errors | PASS | `node exports/generate_report.js` |
| 2 | Em dash grep | PASS | Zero em dashes in pretest_report.md and generate_report.js header |
| 3 | Causal verbs grep | PASS | Searched: improves, reduces, causes, leads to, results in, drives, impacts, increase, decrease, raise, lower, boost, diminish. Only factual uses found ("lower inflation" as a concept, not a causal claim). |
| 4 | N=431 in Sec 3-5, n=354 in Sec 6 | PASS | Confirmed via grep. N=431 appears in Sections 3-5 tables and text. n=354 appears in Section 6 and diagnostic tables. No cross-contamination. |
| 5 | <10 suppression: no raw count below 10 printed | PASS | All suppressed groups show "< 10 (suppressed)" or are omitted. No raw counts below 10 appear in the report text. |
| 6 | Paper files unmodified by this session | PASS | `exports/Bolivard_QUIN102_Paper1.docx` and `_project/source_of_truth/paper.md` unchanged. |
| 7 | Traceability check | PASS | Every numeric claim points to a specific file (and row/column for CSVs). Documented in Section 1 above. |
| 8 | Denominator map present | PASS | Methodology section (report lines 79-84) contains the denominator map as a markdown table with all four tiers. |
| 9 | Figure R2 label fix | PASS | ylim raised from 100 to 105 in generate_report_figures.py. Behavioral bar label (73.3%) no longer clipped. |
| 10 | report_figures/ complete | PASS | All 7 report figures present in exports/report_figures/. fig2 regenerated with layout fix. |
| 11 | subgroup_performance.csv present | PASS | 57 rows covering all demographic groups with suppression applied. |

### Human-voice checks (supplementary)

| Check | Result | Notes |
| --- | --- | --- |
| AI transition words (notably, furthermore, moreover, additionally, consequently) | PASS | None found. |
| "The present study" | PASS | Not used. |
| Trailing participle clauses (", VERBing") | PASS | None found. |
| AI power verbs (underscores, highlights, reveals, demonstrates, illuminates, elucidates) | PASS | None found. |

---

## 5. Generator Details

`exports/generate_report.js` is a copy of `exports/generate_paper.js` with exactly 4 line changes:

| Line | Original (generate_paper.js) | Changed to (generate_report.js) |
| --- | --- | --- |
| 29 | `const PAPER_MD = ".../_project/source_of_truth/paper.md";` | `const REPORT_MD = ".../_project/source_of_truth/pretest_report.md";` |
| 30 | `const OUTPUT_PATH = ".../exports/Bolivard_QUIN102_Paper1.docx";` | `const OUTPUT_PATH = ".../exports/QUIN102_Pretest_Results_Report.docx";` |
| 403 | `"QUIN 102 SDM-10 Pretest Analysis - Spring 2026"` | `"QUIN 102 Pre-Test Results Report - Spring 2026"` |
| 906 | `fs.readFileSync(PAPER_MD, "utf-8")` | `fs.readFileSync(REPORT_MD, "utf-8")` |

No structural changes to the markdown parser, table builder, image embedding, styles, numbering, or section layout.

`exports/generate_report_figures.py` copies all figures from `exports/figures/` to `exports/report_figures/` and regenerates only fig2 with ylim=105 (layout fix, identical data).

---

## 6. Files Produced

| File | Type | Size |
| --- | --- | --- |
| `_project/source_of_truth/pretest_report.md` | Report source (Markdown) | ~490 lines |
| `exports/generate_report.js` | DOCX generator (Node.js) | 1068 lines |
| `exports/generate_report_figures.py` | Figure pipeline (Python) | ~90 lines |
| `exports/report_figures/*.png` | Report-specific figures (8 files, fig2 patched) | ~2 MB total |
| `exports/subgroup_performance.csv` | Subgroup performance data (from DB) | 57 rows |
| `exports/QUIN102_Pretest_Results_Report.docx` | Final output (DOCX) | ~1 MB |
| `exports/QUIN102_Pretest_Report_BuildNote.md` | This file | - |
