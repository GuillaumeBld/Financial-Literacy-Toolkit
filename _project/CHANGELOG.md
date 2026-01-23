# Changelog

All notable changes to the Financial Literacy Toolkit are documented in this file.

Format: `[YYYY-MM-DD] <Type>: <Description>`

Types: `FEAT` (feature), `FIX` (bug fix), `DOCS` (documentation), `REFACTOR`, `CHORE` (maintenance)

---

## 2026-01-23

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
