# Financial Literacy Assessment Platform

> Technical Documentation for Quinn 102 Research Study

## Overview

This documentation hub provides comprehensive technical documentation for the Financial Literacy Assessment Platform, a web-based measurement system supporting research on student learning outcomes in Quinn 102 (Financial Literacy) at Loyola University Chicago.

## Research Questions

The platform is designed to support two primary research questions:

| Research Question | Focus |
|-------------------|-------|
| **RQ1: Learning Gains** | What is the magnitude of student learning, overall and by domain? |
| **RQ2: Heterogeneity** | Which baseline variables predict variation in learning gains? |

## Quick Links

### Core Documentation

- **[Technical Documentation](technical-documentation.md)** - Complete system documentation (~30 pages)
- **[Research Slides](slides/research-presentation.md)** - Presentation overview

### Reference Materials

| Appendix | Description |
|----------|-------------|
| [A: API Reference](appendices/api-endpoint-reference.md) | All API endpoints with parameters |
| [B: Database ERD](appendices/database-erd.md) | Entity-relationship documentation |
| [C: Question Bank](appendices/question-bank-mapping.md) | 40 items with domain mappings |
| [D: Sample Size](appendices/sample-size-considerations.md) | Statistical power analysis |
| [E: Codebook](appendices/baseline-covariates-codebook.md) | B1-B13 variable definitions |

### System Diagrams

| Diagram | Description |
|---------|-------------|
| [System Architecture](diagrams/system-architecture.md) | Infrastructure topology |
| [Assessment Flow](diagrams/assessment-flow.md) | Student journey |
| [Database ERD](diagrams/database-erd-diagram.md) | Data model |
| [SDM Algorithm](diagrams/sdm-selection.md) | Adaptive testing logic |

## Data Collection Status

**Assessment Window**: February 2–9, 2026

| Metric | Final |
|--------|-------|
| Total Enrolled | 433 |
| Completed | 421 |
| Completion Rate | 97.2% |
| Average Score | 66.55% |

*Pre-course assessment complete. Post-course assessment pending.*

## Technology Stack

```
Frontend:     Next.js 14 (App Router)
Database:     PostgreSQL 15 + PgBouncer
Deployment:   Docker + Dokploy + Traefik
Caching:      Redis + In-Memory LRU
```

## Assessment Structure

```
B1-B13 (Baseline)  →  Q1-Q40 (Anchor)  →  SDM 41-50 (Adaptive)
   13 items             40 items            10 items
   Not scored      26 scored/14 pref      Diagnostic
```

### Three Knowledge Domains

1. **Borrowing & Credit** (Q1-Q10) - 10 items
2. **Risk Management** (Q11-Q14) - 4 items
3. **Investment & Risk** (Q29-Q40) - 12 items

## Contact

- **Repository**: [github.com/GuillaumeBld/Financial-Literacy-Toolkit](https://github.com/GuillaumeBld/Financial-Literacy-Toolkit)
- **Production**: [financial-literacy.qualiaai.fr](https://financial-literacy.qualiaai.fr)

---

*Documentation Version 1.0 | February 2026*
