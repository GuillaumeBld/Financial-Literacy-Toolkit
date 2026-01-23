# Agent Guidelines

## Purpose

This document establishes rules and behaviors for any AI agent (Claude, GPT, Copilot, etc.) working on the Financial Literacy Toolkit project. Following these guidelines ensures consistency, traceability, and alignment with the research methodology.

---

## Core Principles

### 1. Source of Truth is Sacred

The files in `_project/source_of_truth/` are the canonical reference for all research methodology, assessment structure, and implementation details.

| File | Authority Over |
|------|----------------|
| `paper.md` | Research questions, assessment structure, baseline covariates, question bank |
| `sdm.md` | SDM-10 selection algorithm, Need scoring, variant types |
| `SDM10_Implementation_Guide.md` | Technical implementation of SDM-10 |
| `baseline+40_Questions.csv` | Exact question text, options, correct answers |

**Rule**: Before modifying any assessment logic, question content, or scoring methodology, READ the source of truth files first. Changes must align with these documents.

### 2. Document Everything

All changes must be logged in `_project/CHANGELOG.md`:
- What was changed
- Why it was changed
- Files affected
- Date of change

**Rule**: After completing any task, update the CHANGELOG before considering the task complete.

### 3. Check TODO Before Starting

Review `_project/TODO.md` before beginning work:
- Understand current priorities
- Check for dependencies
- Avoid duplicate work

**Rule**: If starting a new task not in TODO.md, add it first with context.

---

## Assessment Structure (Immutable Reference)

```
BASELINE COVARIATES (B1-B13) - 13 items, NOT scored
├── Demographic (B1-B5): Gender, Race, Age, Language, Work Experience
├── Financial Background (B6-B10): Products, Self-rating, Stress, Parental Ed, First-gen
└── Student Loan (B11-B13): Has debt?, Interest rate, Maturity

ANCHOR ASSESSMENT (Q1-Q40) - 40 items
├── Knowledge Items (26 items) - SCORED
│   ├── Q1-Q14: Borrowing, Interest, Numeracy, Risk Management
│   └── Q29-Q40: Investment & Risk
└── Preference Items (14 items) - NOT scored
    └── Q15-Q28: Financial attitudes and behaviors

SDM-10 (Adaptive) - 10 items selected from item bank
└── Based on Need score calculation from anchor responses
```

---

## Code Standards

### Database Changes
1. Create migration file in `infra/migration-*.sql`
2. Test migration locally first
3. Document in CHANGELOG
4. Update DATA_MODEL.md if schema changes

### API Changes
1. Maintain backward compatibility when possible
2. Update API documentation
3. Test with existing frontend

### Frontend Changes
1. Match existing code style
2. Maintain accessibility (WCAG 2.1 AA)
3. Test on mobile viewports

---

## Prohibited Actions

1. **DO NOT** modify source of truth files without explicit human approval
2. **DO NOT** change the 26 knowledge vs 14 preference item split
3. **DO NOT** alter the Need score calculation without updating all dependent docs
4. **DO NOT** commit directly to production database
5. **DO NOT** store raw student IDs (always hash with course pepper)
6. **DO NOT** skip the CHANGELOG update

---

## File Organization

```
_project/
├── AGENT_GUIDELINES.md     ← You are here
├── CHANGELOG.md            ← Log all changes here
├── TODO.md                 ← Current tasks and priorities
├── source_of_truth/        ← Canonical research documents (READ-ONLY by default)
│   ├── paper.md
│   ├── sdm.md
│   ├── SDM10_Implementation_Guide.md
│   └── baseline+40_Questions.csv
└── docs/                   ← Implementation documentation
    ├── ADAPTIVE_TESTING.md
    ├── FORM_DESIGN.md
    ├── SCORING_AND_ANALYTICS.md
    ├── DATA_MODEL.md
    ├── AI_SCORING_RUBRICS.md
    ├── ONBOARDING_IMPLEMENTATION.md
    └── QUESTION_IMPORT_SETUP.md
```

---

## Workflow for Any Task

```
1. READ _project/TODO.md          → Understand current state
2. READ relevant source_of_truth  → Understand requirements
3. READ relevant docs/            → Understand implementation
4. MAKE changes                   → Implement the task
5. UPDATE CHANGELOG.md            → Document what you did
6. UPDATE TODO.md                 → Mark complete or add new items
7. COMMIT with descriptive message
```

---

## Communication Standards

When reporting to the user:
- Be concise and specific
- Reference file paths when discussing code
- Summarize changes in bullet points
- Flag any deviations from source of truth
- Recommend next steps

---

## Version Control

- **Branch**: All work happens on `main` (auto-deploys via Dokploy)
- **Commits**: One logical change per commit
- **Messages**: Format: `<type>: <description>`
  - `feat:` New feature
  - `fix:` Bug fix
  - `docs:` Documentation only
  - `refactor:` Code restructuring
  - `chore:` Maintenance tasks

---

## Contact

- **Project Lead**: Dr. Abol Jalilvand
- **Developer**: Guillaume Bolivard
- **Repository**: https://github.com/GuillaumeBld/Financial-Literacy-Toolkit
- **Production**: https://financial-literacy.qualiaai.fr
