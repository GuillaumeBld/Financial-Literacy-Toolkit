# Research Paper — Materials Intake

This file is the entry point for the academic-research-skills suite (`.claude/skills/`) when working on the QUIN 102 financial literacy paper. Skill agents (`/ars-revision-coach`, `/ars-reviewer`, `/ars-full`, `/ars-pipeline`) should read this file first to understand which materials are available and which are still pending.

## Project context

- **Course:** QUIN 102 — Financial Literacy, Loyola University Chicago, Spring 2026
- **Authors:** Guillaume Bolivard (lead), Dr. Abol Jalilvand
- **Working title:** Pre-to-Post Learning Gains in QUIN 102: Heterogeneity by Domain and Baseline Covariates
- **Research questions:**
  - RQ1 — Magnitude of student learning overall and by domain (BI / BR / IR)
  - RQ2 — Which baseline behavioral and contextual variables predict heterogeneity in gains

## Materials available

### Prior writing
- `_project/source_of_truth/paper.md` (128 KB) — Paper 1: instrument design, platform implementation, pre-course descriptives. Treat as the canonical baseline draft.
- `_project/source_of_truth/pretest_report.md` (48 KB) — Internal teaching-team report for pre-test results.
- `_project/source_of_truth/sdm.md` — SDM-10 adaptive algorithm specification.
- `exports/QUIN102_Pretest_Report_BuildNote.md` — How the pretest report was constructed.
- `exports/Bolivard_QUIN102_Paper1.docx` — Submitted Paper 1 (binary).

### Pre-assessment data (Feb 2-9, 2026)
- `exports/all_responses_421_students.csv` — De-identified response-level data, all completers (N=421/433).
- `exports/consented_responses_354.csv` — Subset with research consent (N=354).
- `exports/question_bank_40items.csv` — Q1-Q40 item bank.
- `exports/sdm10_item_bank.xlsx` — SDM-10 variant bank.
- `exports/sdm_open_answers.csv` — Open-ended SDM responses.
- `exports/diagnose_by_item.csv`, `exports/confirm_by_item.csv` — SDM-10 classification by anchor item.
- `exports/misconception_taxonomy_observed.csv` — Layer-1 taxonomy from pretest.
- `exports/subgroup_performance.csv` — Domain × subgroup means.
- `exports/model_selection_concordance.csv` — AI scorer agreement.
- `docs/data/collection-summary.csv`, `docs/data/domain-score-distribution.csv`, `docs/data/submission-timeline.csv`

### Figures (pre-only)
- `exports/figures/fig1_*.png` through `fig8_*.png` — score distribution, domain performance, enrollment timeline, submission timing, confidence calibration, item difficulty, demographics, financial background.

### Reference literature (PDF/)
- OECD Financial Competence Framework (2022, 2024 editions)
- PISA 2022 Financial Literacy framework + released items
- NFCS 2021 State-by-State questionnaire
- "The Missing Piece in Financial Literacy: Risk" (Jalilvand)

### Question bank (canonical)
- `_project/source_of_truth/baseline+40_Questions.csv` — B1-B13 baseline + Q1-Q40 anchor items.

## Materials PENDING

### Post-assessment data — REQUIRED for RQ1 / RQ2
The post-course assessment results are not yet committed to this repo. They live in the production PostgreSQL database on the Dokploy VPS:

```
host:     finlit-postgres-db-g6ifwu (Docker service, dokploy-network)
database: financial_literacy
user:     finlit_user
```

**To export post-data** (run on the VPS host that has Docker access):

```bash
# From the VPS, where /root/Financial-Literacy-Toolkit is the deployed copy:
cd /root/Financial-Literacy-Toolkit

# Adapt the generate-paper script or run a direct query:
docker exec finlit-pgbouncer sh -c "PGPASSWORD='FinLit2025SecurePassword' psql \
  -h finlit-postgres-db-g6ifwu -p 5432 -U finlit_user -d financial_literacy \
  -c \"COPY (SELECT * FROM attempts WHERE phase='post' AND status='submitted') \
       TO STDOUT WITH CSV HEADER\"" > exports/post_attempts.csv

docker exec finlit-pgbouncer sh -c "PGPASSWORD='FinLit2025SecurePassword' psql \
  -h finlit-postgres-db-g6ifwu -p 5432 -U finlit_user -d financial_literacy \
  -c \"COPY (SELECT * FROM responses r JOIN attempts a ON r.attempt_id=a.id \
              WHERE a.phase='post') TO STDOUT WITH CSV HEADER\"" > exports/post_responses.csv
```

(Adjust column / table names to match `infra/vps-postgres-complete-schema.sql`.)

Commit the resulting CSVs (de-identified — the platform uses SHA-256 hashed student IDs by design) and re-run the paper pipeline.

### Other gaps
- IRB approval letter for Paper 2 (referenced in Section 10 of `paper.md`; required for the disclosure section).
- Pre→post linkage table (hashed_student_id pairs across phases).
- Updated reference list with any 2026 sources used in revision.

## How to drive the pipeline

Once post-data is available, choose one of:

| Goal | Command | Notes |
|------|---------|-------|
| Plan the Paper 2 structure with Socratic guidance | `/ars-plan` | Best when you want to think through the structure |
| Get a multi-perspective review of the Paper 1 draft | `/ars-reviewer` | Produces editorial decision + per-reviewer comments |
| Turn reviewer comments into a revision roadmap | `/ars-revision-coach` | Pairs with `/ars-reviewer` output |
| Execute the full pipeline (research → write → review → revise → finalize) | `/ars-full` | Heaviest path; expects full materials |
| Just a lit-review pass to fold 2026 sources in | `/ars-lit-review` | Lighter; updates references only |
| Check citations against a corpus | `/ars-citation-check` | Reduces hallucinated-citation risk |

Mode catalogue: `.claude/MODE_REGISTRY.md`. Routing rules: `.claude/CLAUDE.md` "Routing Discipline (v3.9.2)".

## Output location

All generated artifacts (revision drafts, reviewer reports, abstracts, format-converted outputs) land in:

```
_project/research-paper/<artifact>.md
```

Do not overwrite `_project/source_of_truth/paper.md` — that is the canonical Paper 1 record.

## License and attribution

The academic-research-skills suite is licensed under CC-BY-NC-4.0 (see `.claude/LICENSE.academic-research-skills` and `.claude/NOTICE.academic-research-skills.md`). Author: Cheng-I Wu. Skills version: 3.9.4.2 (per `.claude/CLAUDE.md`).
