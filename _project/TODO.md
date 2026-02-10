# TODO - Financial Literacy Toolkit

Last updated: 2026-01-28

## Legend

- `[ ]` Not started
- `[~]` In progress
- `[x]` Complete

---

## REMAINING TASKS

### 1. Automated Scoring for Short Answer Evaluation

- [ ] Integrate rubric-based scoring pipeline
  - Schema ready: `rubric JSONB` field exists in items table
  - Placeholder scoring in place (50% pending review)
  - Need: Scoring engine to evaluate open-ended responses

- [ ] Implement scoring rubric logic
  - Full Credit (2): Demonstrates mechanism understanding
  - Partial Credit (1): Directionally correct, lacks specificity
  - No Credit (0): No explanation or incorrect

- [ ] Add misconception tagging system
  - Predefined tags per question
  - Low-confidence classifications flagged for instructor review

- [ ] Build instructor review queue for scored responses
  - Allow override of automated scores
  - Track inter-rater reliability

### 2. LTI 1.3 Integration for Canvas/Blackboard

- [ ] Implement LTI 1.3 authentication flow
  - OIDC login initiation
  - JWT token validation
  - Platform registration

- [ ] Grade passback integration
  - Send scores back to LMS gradebook
  - Support Assignment and Grade Services (AGS)

- [ ] Deep linking support
  - Allow instructors to embed assessments in LMS

- [ ] Test with Canvas and Blackboard sandboxes

### 3. Advanced Pre/Post Analytics

- [ ] Implement overconfidence index calculation
  - Formula: `z(confidence) - z(score)` per domain
  - Track changes between pre and post assessments

- [ ] Build cohort comparison reports
  - Compare performance across sections/terms
  - Visualization of learning gains

- [ ] Add export functionality
  - CSV export for raw data
  - PDF reports for instructors

- [ ] Instructor dashboard enhancements
  - Domain-level performance breakdown
  - Individual student progress tracking

---

## INFRASTRUCTURE (Optional Improvements)

- [ ] Add PgBouncer monitoring (track `cl_active`, `cl_waiting`)
- [ ] Add Redis monitoring (hit rate, memory usage)
- [ ] Set up automated database backups
- [ ] Add app error rate alerts (>1% for 5 min)

---

## COMPLETED

### Core Platform - DONE
- [x] Database schema with B1-B13 baseline covariates
- [x] Onboarding form with all demographic questions (B9-B13 with conditional logic)
- [x] 1-3 confidence scale (Low, Mid, High)
- [x] Question import from CSV with `is_scored` flag
- [x] SDM-10 adaptive testing algorithm (Need score → Variant assignment → Selection)
- [x] Domain-level scoring (`by_domain JSONB`)
- [x] Rate limiting middleware (Redis-backed)

### Infrastructure - DONE
- [x] 500 concurrent user scaling (load tested)
- [x] PgBouncer connection pooling
- [x] Redis L2 cache integration
- [x] Traefik reverse proxy with SSL
- [x] Dokploy deployment

### Documentation - DONE
- [x] Source of truth alignment
- [x] `_project/` folder structure
- [x] Agent guidelines and changelog

---

## Quick Reference

| Item Range | Type | Scored | Domain |
|------------|------|--------|--------|
| B1-B13 | Baseline | No | - |
| Q1-Q10 | Knowledge | Yes | Borrowing & Credit |
| Q11-Q14 | Knowledge | Yes | Risk Management |
| Q15-Q28 | Preference | No | - |
| Q29-Q40 | Knowledge | Yes | Investment & Risk |
