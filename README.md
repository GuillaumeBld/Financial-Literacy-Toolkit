# Financial Literacy Assessment Toolkit

A web-based assessment platform for measuring financial literacy among university students, developed to support pre-post research on learning outcomes in QUINN 102 (Financial Literacy) at Loyola University Chicago.

## Overview

This platform implements a three-part assessment instrument designed to evaluate student financial literacy across the domains of Borrowing and Credit, Behavioral and Risk Management, and Investment and Risk-Return. The assessment combines a 13-item baseline demographic and socioeconomic questionnaire (B1-B13), a 40-item anchor assessment (26 scored knowledge items and 14 unscored preference items), and a 10-item adaptive diagnostic module (SDM-10) that targets individual knowledge gaps based on anchor response patterns.

The platform is built with FERPA compliance as a first-class requirement: student identifiers are one-way hashed using SHA-256 with per-course peppers, and no raw personally identifiable information is stored at any point in the data pipeline. Research consent is collected during onboarding, separating the required course assessment from voluntary research participation.

The pre-course assessment was administered from February 2-9, 2026. Of 433 enrolled students, 421 completed the full assessment, yielding a 97.2% completion rate. The mean overall score was 66.55% (SD = 17.38%), with domain-level variation suggesting targeted areas for instruction.

## Research Questions

- **RQ1 (Learning Gains)**: What is the magnitude of student learning in QUINN 102, overall and within the domains of borrowing and credit, investment, and risk management, as measured by pre-to-post changes in knowledge?
- **RQ2 (Heterogeneity)**: Which baseline behavioral and contextual variables predict heterogeneity in learning gains across students, and do these predictors differ by domain?

## Assessment Structure

| Phase | Items | Description |
|-------|-------|-------------|
| Baseline Covariates (B1-B13) | 13 | Demographics, financial background, self-rated knowledge |
| Anchor Assessment (Q1-Q40) | 40 | 26 scored knowledge items + 14 unscored preference items across 3 domains |
| SDM-10 Adaptive Diagnostic | 10 | Selected from variant bank based on individual anchor response signal |

### Knowledge Domains

| Domain | Anchor Items | Description |
|--------|-------------|-------------|
| Borrowing and Interest (BI) | Q1-Q10 | Compound interest, credit, loan concepts |
| Behavioral and Risk Management (BR) | Q11-Q14 | Insurance, risk assessment, behavioral finance |
| Investment and Risk-Return (IR) | Q29-Q40 | Portfolio theory, bonds, inflation, diversification |

### SDM-10 Adaptive Module

The Supplemental Diagnostic Module selects 10 follow-up items tailored to each student's anchor performance. A Need Score (0-5) is computed for each anchor based on correctness, confidence rating, and item format (MCQ vs. True/False). Variant types include open-ended diagnose/confirm prompts (capped at 3) and closed-format items at varying difficulty levels. The full selection algorithm is documented in `_project/source_of_truth/sdm.md`.

## Pre-Course Baseline Results (February 2-9, 2026)

| Metric | Value |
|--------|-------|
| Enrolled | 433 |
| Completed | 421 (97.2%) |
| Mean Score | 66.55% |
| Standard Deviation | 17.38% |
| Score Range | 7.69% - 100% |
| Median Duration | 18.4 minutes |

### Domain Performance

| Domain | Mean Score | SD |
|--------|-----------|-----|
| Behavioral and Risk Management | 73.46% | 24.70% |
| Borrowing and Interest | 69.33% | 19.35% |
| Investment and Risk-Return | 63.97% | 20.47% |

### Confidence Calibration

The Overconfidence Index (OC = mean confidence - mean correctness, normalized to [-1, +1]) was -0.0167 overall, indicating slight underconfidence. 41.1% of students were well-calibrated, 32.8% underconfident, and 26.1% overconfident.

## Repository Structure

```
Financial-Literacy-Toolkit/
  apps/web/                        Next.js 14 application (App Router, TypeScript)
  _project/source_of_truth/        Research paper, question bank CSV, SDM-10 specification
  docs/                            Technical documentation, appendices, data summaries
  docs/data/                       Assessment data (CSV) and analysis summaries
  exports/                         De-identified response-level data exports and figures
  infra/                           Database schema, migrations, PgBouncer configuration
  scripts/                         Utility scripts, test suites, data export tools
  PDF/                             Reference literature and assessment frameworks
```

### Key Files

| File | Description |
|------|-------------|
| `_project/source_of_truth/paper.md` | Full research paper with pre-course results |
| `_project/source_of_truth/sdm.md` | SDM-10 adaptive algorithm specification |
| `_project/source_of_truth/baseline+40_Questions.csv` | Complete question bank (B1-B13 + Q1-Q40) |
| `exports/all_responses_421_students.csv` | De-identified response-level data for all completers |
| `docs/data/collection-summary.csv` | Daily enrollment and completion statistics |
| `docs/data/domain-score-distribution.csv` | Score distribution by range |

## Technology

- **Application**: Next.js 14 (App Router), React 18, TypeScript
- **Database**: PostgreSQL 15 via PgBouncer (raw SQL, no ORM)
- **Deployment**: Docker multi-stage build, Dokploy PaaS, Traefik reverse proxy
- **Privacy**: SHA-256 hashed student identifiers with per-course peppers (FERPA compliant)

## Citation

If you use this software, assessment instrument, or data in your research, please cite using the metadata in [CITATION.cff](CITATION.cff):

> Jalilvand, A. & Bolivard, G. (2026). *Financial Literacy Assessment Toolkit* (Version 1.0.0) [Computer software]. https://github.com/GuillaumeBld/Financial-Literacy-Toolkit

## Authors

- **Dr. Abol Jalilvand** -- Department of Finance, Quinlan School of Business, Loyola University Chicago
- **Guillaume Bolivard** -- Platform Development, Loyola University Chicago

## License

This project is licensed under the Apache License 2.0. See [LICENSE](LICENSE) for the full text.

## Development

For setup instructions, deployment guides, and technical documentation, see [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).
