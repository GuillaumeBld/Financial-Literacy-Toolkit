# AI Financial Literacy Assessment

AI assisted pre and post financial literacy assessment for finance students at Loyola University Chicago, Quinlan School of Business, Finance Department. Web based, privacy safe, scalable, and auditable.

## Institutional context
- Institution: Loyola University Chicago, Quinlan School of Business, Finance Department.
- Audience: finance students in Quinlan courses.
- Use: assess student level before and after the class only.
- Governance: instructor led administration, FERPA compliant storage, no raw student IDs.

## Outcomes
- Per student: pre score, post score, change, domain deltas, confidence gap.
- Per course: participation, mean pre, mean post, mean change with 95 percent CI, within subject effect size d, fairness checks.

## Tech stack
- Frontend: Next.js 14, React, TypeScript.
- Backend API: Next.js server actions or FastAPI, pick one per deployment.
- Database: Postgres with Row Level Security.
- Auth: LMS SSO or salted hash of Student ID, no raw IDs stored.
- Worker: Python 3.11 for NLP scoring and analytics.
- Storage: S3 compatible for exports and logs.
- Hosting example: Vercel for web, Supabase for Postgres and auth, Modal or AWS Lambda for workers.

## Branding and UX alignment
- Align visuals and tone with Loyola University Chicago and Quinlan School of Business brand guidelines, colors, typography, and editorial style.
- Design tokens live in `docs/BRAND_TOKENS.md` and drive the web theme.
- Copy style: academic, concise, student friendly, privacy clear.
- Accessibility: WCAG 2.1 AA, keyboard complete.

## Architecture
- Web app renders items, saves responses, and shows reports.
- API issues items, records answers, finalizes attempts, returns scores.
- Worker scores free text, runs analytics, and posts results.
- Postgres stores users, items, attempts, responses, scores, and audit logs.

## Repository layout
```
/
  apps/
    web/                 Next.js app
    worker/              Python scoring and analytics
  infra/                 IaC, migrations, seed data
  docs/                  Project documentation
```
## Quick start, local
Prerequisites: Node 20, PNPM or NPM, Python 3.11, Docker for Postgres.

1. Install
```bash
pnpm i
```
2. Start database
```bash
docker compose up -d db
```
3. Apply schema and seed
```bash
pnpm --filter infra db:migrate
pnpm --filter infra db:seed
```
4. Configure envs
- Copy `apps/web/.env.example` to `apps/web/.env.local`.
- Copy `apps/worker/.env.example` to `apps/worker/.env`.

5. Run web and worker
```bash
pnpm --filter web dev
pnpm --filter worker start
```

## Environment variables
Define per app. See `docs/ENVIRONMENT_VARIABLES.md`.

## Data model, minimal tables
See `docs/DATA_MODEL.md`.

## Identity and matching
Preferred SSO from LMS. Fallback hashed_student_key = SHA256(course_pepper + trimmed_student_id). Store pepper per course. Do not store raw IDs. See `docs/FERPA_COMPLIANCE.md`.

## Scoring
- MCQ and numeric: key based scoring.
- Short text: rubric scored by LLM, store rubric score and model confidence, queue for human review if confidence is low.
- Confidence index: per domain, z(confidence) minus z(score).

## AI assistance capabilities
1. Understand all types of answers, analyze numbers and short text, tag sentiment and behavioral signals.
2. Show what matters most, rank predictors of literacy and change by domain.
3. Help explain patterns, surface plausible causes for anomalies for instructor review.
4. Improve the questionnaire, test item quality, suggest rewrites, group items, and summarize variables.
5. Write the code for analysis, generate Python, R, or Stata scripts for replication.
6. Validate and double check results, compare ML models like Random Forest to baselines and cross check with literature.
7. Expand to bigger populations, identify higher risk groups for future studies, disabled for v1 class only use.
8. Make questionnaires shorter and smarter, propose short forms and optional adaptive routing after pilot.
9. Create personalized education, generate learning paths and gamification hooks, disabled in v1.

## Pre and post forms
- Form A for pre, Form B for post. Twelve anchors appear in both waves to link scores.
- Time cap per attempt, 20 minutes default.

## Dashboard
Cohort change, domain bars with CI, distributions, completion funnel, item diagnostics, DIF and anomaly flags. See `docs/UX_SPEC.md`.

## Security and privacy
Pseudonymous keys only, per course pepper, rotate each term. RLS on attempts, responses, and scores. Rate limit sensitive endpoints. Optional purge of raw free text. See `docs/SECURITY_PRIVACY.md` and `docs/FERPA_COMPLIANCE.md`.

## Deployment
See `docs/DEPLOY.md`.

## Operations
See `docs/OPERATIONS.md` and `docs/RELEASE_PLAYBOOK.md`.

## Contributing and license
See `docs/CONTRIBUTING.md`, `docs/CODE_OF_CONDUCT.md`, and `docs/LICENSE.md`.

_Last updated: 2025-10-17_
