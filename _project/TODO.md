# TODO - Financial Literacy Toolkit

Last updated: 2026-01-23

## Legend

- `[ ]` Not started
- `[~]` In progress
- `[x]` Complete
- `[!]` Blocked
- `[?]` Needs clarification

---

## HIGH PRIORITY

### Database Schema Alignment

- [ ] Run migration to add B13 (student_loan_maturity) to student_profiles table
  - File: `infra/migration-add-student-loan-maturity.sql`
  - Depends on: Database access

- [ ] Run migration to add confidence 1-3 scale and preference flag to items
  - File: `infra/migration-confidence-1-3-and-preference.sql`

- [ ] Verify items table has `is_scored` column properly set for Q1-Q14, Q29-Q40

### Frontend Alignment

- [ ] Update onboarding form to include B9-B13 questions
  - B9: Parental education
  - B10: First-generation college student
  - B11: Has student loan debt?
  - B12: Interest rate (conditional on B11=Yes)
  - B13: Maturity (conditional on B11=Yes)
  - File: `apps/web/src/app/onboarding/page.tsx`

- [ ] Update assessment to use 1-3 confidence scale (not 1-5)
  - File: `apps/web/src/app/assessment/page.tsx`

### Question Import

- [ ] Import questions from `source_of_truth/baseline+40_Questions.csv`
  - Mark Q1-Q14, Q29-Q40 as `is_scored=true`
  - Mark Q15-Q28 as `is_scored=false`
  - Use script: `scripts/import_questions_from_source_of_truth.py`

---

## MEDIUM PRIORITY

### SDM-10 Implementation

- [ ] Implement Need score calculation based on `sdm.md`
  - Format-aware: T/F correct+mid → Need=2, MCQ correct+mid → Need=1
  - Store in responses table

- [ ] Implement variant type assignment
  - Need 5 + Incorrect → Open_Diagnose
  - Need 5 + Correct → Open_Confirm
  - Need 4 → Lower_MCQ
  - Need 3 → Lower_MCQ
  - Need 2 → Lower_TF
  - Need 1 → Same_MCQ
  - Need 0 → Higher_MCQ

- [ ] Build SDM-10 selection algorithm
  - Phase 1: Domain minimum enforcement (2 per domain)
  - Phase 2: Need-based slot filling
  - Phase 3: Fallback with mastery items
  - Constraints: max 3 open-ended, max 2 per subcategory

- [ ] Create SDM-10 item bank
  - 6 variants per anchor (Lower_TF, Lower_MCQ, Same_MCQ, Higher_MCQ, Open_Confirm, Open_Diagnose)
  - Use CSV format from implementation guide

### Scoring & Analytics

- [ ] Implement domain-level scoring
  - Borrowing & Credit: Q1-Q10
  - Risk Management: Q11-Q14
  - Investment & Risk: Q29-Q40

- [ ] Implement overconfidence index calculation
  - `z(confidence) - z(score)` per domain

- [ ] Add pre/post comparison report for instructors

### AI Scoring

- [ ] Implement rubric-based scoring for open-ended responses
  - Full Credit (2): Demonstrates mechanism understanding
  - Partial Credit (1): Directionally correct, lacks specificity
  - No Credit (0): No explanation or incorrect

- [ ] Add misconception tagging system
  - Predefined tags per question
  - Low-confidence AI classifications flagged for review

---

## LOW PRIORITY

### Documentation

- [x] Align all docs with source of truth v2
- [x] Create _project/ folder structure
- [x] Create AGENT_GUIDELINES.md
- [x] Create CHANGELOG.md
- [x] Create TODO.md
- [ ] Update INDEX.md to reference _project/ structure
- [ ] Clean up redundant deployment docs

### Infrastructure

- [ ] Set up automated database backups
- [ ] Configure monitoring/alerting for production
- [ ] Review and update Traefik SSL certificates

### Future Features (Post-MVP)

- [ ] LTI 1.3 integration for Canvas/Blackboard
- [ ] Instructor dashboard analytics
- [ ] Cohort comparison reports
- [ ] Export functionality (CSV, PDF reports)

---

## COMPLETED (Recent)

- [x] 2026-01-23: Documentation alignment with source of truth v2
- [x] 2026-01-23: Created _project/ folder with control files
- [x] 2026-01-23: Archived obsolete documentation
- [x] 2026-01-23: Fixed placeholder domains in configs
- [x] 2026-01-17: Email service and password recovery
- [x] 2026-01-07: Dokploy deployment setup
- [x] 2026-01-07: VPS PostgreSQL migration

---

## BLOCKED

None currently.

---

## Notes

### Key Constraints from Source of Truth

1. **26 knowledge items** (Q1-Q14, Q29-Q40) are scored
2. **14 preference items** (Q15-Q28) are NOT scored
3. **13 baseline covariates** (B1-B13) collected during onboarding
4. **Confidence scale is 1-3** (Low, Mid, High), NOT 1-5
5. **SDM-10 constraints**: 10 items, min 2 per domain, max 3 open-ended, max 2 per subcategory

### Dependencies

```
Database migrations → Question import → Frontend updates → SDM-10 implementation
```

### Quick Reference

| Item Range | Type | Scored | Domain |
|------------|------|--------|--------|
| B1-B13 | Baseline | No | - |
| Q1-Q10 | Knowledge | Yes | Borrowing & Credit |
| Q11-Q14 | Knowledge | Yes | Risk Management |
| Q15-Q28 | Preference | No | - |
| Q29-Q40 | Knowledge | Yes | Investment & Risk |
