# Changelog

All notable changes to the Financial Literacy Toolkit are documented in this file.

Format: `[YYYY-MM-DD] <Type>: <Description>`

Types: `FEAT` (feature), `FIX` (bug fix), `DOCS` (documentation), `REFACTOR`, `CHORE` (maintenance)

---

## 2026-01-24

### CHORE: Close PR #2 - Authentication middleware (not needed)

**Context**: PR #2 "Refine authentication fetch helpers and forbidden messaging" was open but incompatible with the project.

**Reasons for closing:**
- Project already has working authentication (FERPA-compliant hashed student keys, JWT for instructors)
- PR files were at wrong location (root instead of `apps/web/`)
- PR used NextAuth.js, different from existing custom JWT system
- Critical middleware bug would break public routes
- FERPA compliance risk from session storage

**Files Affected**: PR closed with explanatory comment

---

### CHORE: Major repository cleanup - remove Supabase/Vercel artifacts

**Context**: Repository contained outdated Supabase and Vercel files from before the migration to self-hosted PostgreSQL and Dokploy.

**Deleted:**
- Supabase client libraries (`apps/web/src/lib/supabase*.ts`)
- Vercel configuration (`vercel.json`)
- Migration scripts (completed migrations)
- Test files for Supabase
- Old `archive/` folder with Supabase setup docs
- Old `migration/` folder
- Old `export/` folder
- Old `questions/` folder (superseded by `_project/source_of_truth/`)
- 21 placeholder docs with minimal content

**Archived to docs/archive/:**
- Completed status docs
- Resolved troubleshooting docs
- Old deployment status docs

**Repository structure now:**
- `apps/web/` - Main Next.js application
- `_project/` - Project control center + source of truth
- `docs/` - Active documentation only
- `scripts/` - Active utility scripts + SDM tests
- `infra/` - Database migrations and SQL

---

### FEAT: Instructor question bank redesign with anchor-variant grouped view

**Context**: User requested better visualization of anchor questions and their SDM variants in the instructor portal.

**Changes**:
- Redesigned question bank with accordion-style anchor list (Q1-Q40)
- Each anchor expands to show all its SDM variants in a grid layout
- Color-coded variant type cards:
  - Lower_TF (blue): Basic recognition
  - Lower_MCQ (indigo): Foundation check
  - Same_MCQ (green): Parallel difficulty
  - Higher_MCQ (amber): Transfer/application
  - Open_Confirm (purple): Verify reasoning
  - Open_Diagnose (red): Identify misconception
- Click variant card opens detailed modal with question, options, correct answer
- Domain filtering and search functionality
- Legend explaining SDM-10 variant types
- Separate collapsible section for preference items (Q15-Q28)

**Files Affected**: `apps/web/src/app/instructor/questions/page.tsx`

---

## 2026-01-23

### FEAT: SDM-10 anchor ID mapping fix

**Context**: SDM item bank uses "Q1#" suffix for anchors, but responses use "Q1" or "1".

**Changes**:
- Added `normalizeAnchorId()` to handle "Q1#" vs "Q1" vs "1" format differences
- Added `anchorIdsMatch()` for flexible anchor-variant matching
- Updated `findVariantForAnchor()` to use flexible matching
- Added 18 tests for anchor ID normalization and matching (82 total tests now)

**Files Affected**: `apps/web/src/app/assessment/page.tsx`, `scripts/sdm-algorithm.test.ts`

---

### FEAT: SDM-10 algorithm rewrite to match source of truth

**Context**: SDM implementation needed to match the exact specification in sdm.md and SDM10_Implementation_Guide.md.

**Changes**:
- Rewrote Need score calculation (Table 4): absolute scores 0-5 per anchor, not deltas
- Added format awareness: T/F anchors (Q2, Q3, Q11, Q30, Q35, Q36, Q39) get elevated Need for Correct+Mid (2 vs 1)
- Implemented proper variant type assignment (Table 11): Need score determines variant type
- Added fallback mechanism (Table 12): Open_Diagnose→Lower_MCQ, Open_Confirm→Same_MCQ when cap reached
- Implemented 3-phase selection algorithm:
  - Phase 1: Domain minimum enforcement (2 per domain)
  - Phase 2: Need-based slot filling (remaining 4 slots)
  - Phase 3: Fallback with mastery items
- Added tiebreaker hierarchy (Section 8.1): domain deficit, T/F priority, subcategory spread, domain order, seeded random
- Implemented presentation order (Section 11): Open_Diagnose first, Open_Confirm last
- Added validation for all constraints (size=10, domain min=2, subcategory cap=2, open-ended cap=3)
- Changed state from subcategory totals to individual anchor scores

**Files Affected**: `apps/web/src/app/assessment/page.tsx`

---

### FEAT: Pre-assessment screen UI updates

**Context**: User requirements for cleaner pre-assessment UI without intimidating monitoring language.

**Changes**:
- Updated intro text to: "To assess your financial knowledge, you must answer these questions without assistance."
- Changed "Time Limit" to "Time requirement:" with friendlier wording
- Removed "Monitoring" section (suspicious behavior tracking language)
- Removed "Recommended: Use Fullscreen Mode" section
- Removed "Switching tabs or windows will be monitored" from start screen instructions

**Files Affected**: `apps/web/src/app/assessment/page.tsx`

---

### DOCS: Major documentation alignment with Source of Truth v2

**Context**: Received new source of truth archive (Archive_v2.zip) with updated research methodology.

**Changes**:
- Added `_project/` folder for centralized project control
- Created `AGENT_GUIDELINES.md` for AI agent behavior standards
- Created `CHANGELOG.md` (this file) for change tracking
- Created `TODO.md` for task management

**Source of Truth Updates**:
- Added `paper.md` - Research methodology, RQ1/RQ2, full question bank
- Added `sdm.md` - SDM-10 selection algorithm specification
- Added `SDM10_Implementation_Guide.md` - Python implementation guide
- Added `baseline+40_Questions.csv` - Machine-readable question bank

**Documentation Alignment**:
- Updated `ADAPTIVE_TESTING.md`: B1-B12 → B1-B13, total 62 → 63 items
- Updated `FORM_DESIGN.md`: Added B13 (student loan maturity)
- Updated `ONBOARDING_IMPLEMENTATION.md`: Added B9-B13 questions, 4-step flow
- Updated `QUESTION_IMPORT_SETUP.md`: Updated file paths to source_of_truth/
- Rewrote `SCORING_AND_ANALYTICS.md`: Complete scoring methodology
- Rewrote `AI_SCORING_RUBRICS.md`: Rubric tiers and misconception tagging
- Rewrote `DATA_MODEL.md`: Added anchor/variant/confidence fields

**Archived Files** (moved to `docs/archive/`):
- Migration docs: MIGRATION_*.md
- Status docs: COMPLETION_STATUS.md, CODE_FIXES_SUMMARY.md
- Refactor docs: ONBOARDING_REFACTOR_*.md
- Planning docs: NEXT_STEPS*.md, REMAINING_TASKS.md
- Anti-cheating docs: *_ANTI_CHEATING_STRATEGIES.md

**Deleted Files** (obsolete):
- `docs/research/independant_study.md` - Superseded by source_of_truth/paper.md
- `docs/ITEM_BANK.md` - Referenced deleted paths
- `docs/archive-2026-01/` - Old historical folder
- `Archive.zip`, `finlit_docs.zip`, `Archive_v2.zip` - Extracted, no longer needed
- `independant_study.md` (root) - Superseded
- `SDM10_Item_Bank.xlsx` - Superseded by CSV

**Config Fixes**:
- Fixed placeholder domain `your-domain.com` → `financial-literacy.qualiaai.fr` in:
  - README.md
  - docker-compose.yml

**Files Affected**: 50+ files modified, deleted, or created

---

## 2026-01-20

### DOCS: Initial source of truth archive received

- Received Archive.zip with initial research documents
- Extracted to archive_source_of_truth/ (later superseded)

---

## 2026-01-17

### FEAT: Email service and password recovery

- Implemented password recovery flow
- Added email service integration
- Created TEST_CREDENTIALS.md and TEST_EMAIL_PASSWORD_RECOVERY.md

### FIX: Gateway timeout resolution

- Fixed Traefik configuration for long-running requests
- Added buffering middleware
- Documented in GATEWAY_TIMEOUT_*.md

---

## 2026-01-13

### DOCS: Documentation restructuring

- Created docs/current/, docs/deployment/, docs/development/, etc.
- Added INDEX.md for documentation navigation
- Created DOCUMENTATION_GUIDE.md

---

## 2026-01-07

### FEAT: Initial Dokploy deployment

- Set up GitHub → Dokploy auto-deployment pipeline
- Configured Traefik reverse proxy with SSL
- Created deployment documentation suite

### FEAT: Database migration to VPS PostgreSQL

- Migrated from Supabase to self-hosted PostgreSQL
- Created vps-postgres-complete-schema.sql
- Documented in VPS_POSTGRES_MIGRATION_COMPLETE.md

---

## Pre-2026-01

### FEAT: MVP Development

- Next.js 14 application with assessment flow
- Supabase integration (later migrated)
- FERPA-compliant student ID hashing
- Instructor portal with question management
- Basic analytics and scoring

---

## How to Update This Log

After completing any task:

```markdown
## YYYY-MM-DD

### TYPE: Brief description

**Context**: Why this change was needed

**Changes**:
- Bullet points of what was done

**Files Affected**: List key files

**Notes**: Any important observations or follow-up needed
```
