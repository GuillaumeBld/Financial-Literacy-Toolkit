# Onboarding Refactor - Implementation Status

## Overview

This document tracks the implementation of the IRB-compliant onboarding flow refactor.

**Key Requirements**:
1. ✅ Separate course requirement from optional research consent
2. ✅ Remove password collection (use SSO/magic link approach)
3. ✅ Make sensitive demographics optional with "Prefer not to answer"
4. ✅ Restructure Step 3 into three blocks (A, B, C)
5. ✅ Update wording to use "coded/de-identified" instead of "anonymized"

---

## Implementation Status

### Phase 1: Database Migration ✅

- [x] Create migration file: `infra/migration-add-research-consent.sql`
- [ ] Apply migration to database (in progress)

**Migration SQL**:
```sql
ALTER TABLE student_profiles
ADD COLUMN IF NOT EXISTS research_consent BOOLEAN DEFAULT NULL,
ADD COLUMN IF NOT EXISTS research_consent_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS research_consent_version TEXT DEFAULT NULL;
```

---

### Phase 2: Step 0 - Consent Separation (NEW) 🔄

**Status**: In progress

**Changes Needed**:
- [ ] Add Step 0 before current Step 1
- [ ] Create UI for course requirement acknowledgment
- [ ] Create UI for research consent choice (yes/no toggle)
- [ ] Store research consent in state
- [ ] Update totalSteps from 3 to 4

**State Variables**:
```typescript
const [researchConsent, setResearchConsent] = useState<boolean | null>(null);
const [hasAcknowledgedCourseRequirement, setHasAcknowledgedCourseRequirement] = useState(false);
```

---

### Phase 3: Step 1 - Remove Password 🔄

**Status**: Pending

**Changes Needed**:
- [ ] Remove password field
- [ ] Remove confirm password field
- [ ] Remove password state variables
- [ ] Update validation (remove password checks)
- [ ] Update privacy notice text
- [ ] Update API call (remove password)

**Current Fields** (to keep):
- Course Code (read-only)
- Student ID (required)
- Email Address (required)

**Fields to Remove**:
- Password
- Confirm Password

---

### Phase 4: Step 2 - Optional Demographics 🔄

**Status**: Pending

**Changes Needed**:
- [ ] Add "Prefer not to answer" to ALL demographic fields
- [ ] Make sensitive fields optional (not required)
- [ ] Update validation (only validate non-sensitive fields)
- [ ] Update UI labels (remove required indicators from sensitive fields)

**Fields to Update**:
- Age range → Add "Prefer not to answer"
- Gender → Already has "Prefer not to say" ✅
- Race/ethnicity → Add "Prefer not to answer"
- First language → Add "Prefer not to answer"
- Work experience → Add "Prefer not to answer"

---

### Phase 5: Step 3 - Restructure 🔄

**Status**: Pending

**Changes Needed**:
- [ ] Separate into three blocks (A, B, C)
- [ ] Block A: Financial background (required, low sensitivity)
- [ ] Block B: Socio-economic (optional, higher sensitivity)
- [ ] Block C: Data-use notice with two confirmations
- [ ] Update wording ("coded/de-identified" instead of "anonymized")
- [ ] Add research consent confirmation/change option

---

### Phase 6: API Updates 🔄

**Status**: Pending

**Changes Needed**:
- [ ] Remove password from `/api/onboarding/submit`
- [ ] Add research_consent fields to API
- [ ] Update user creation (no password)
- [ ] Update profile creation with research consent

---

## Implementation Notes

### Database Connection
- User: `finlit_user`
- Database: `financial_literacy`
- Migration needs to be applied

### Current Flow
- Step 1: Student ID + Email + Password
- Step 2: Demographics (all required)
- Step 3: Financial background + Socio-economic + Acknowledgment

### New Flow
- Step 0: Consent separation (NEW)
- Step 1: Student ID + Email (NO password)
- Step 2: Demographics (sensitive fields optional)
- Step 3: Financial background (A) + Socio-economic (B, optional) + Data-use notice (C)

---

**Last Updated**: January 2025  
**Status**: Implementation in progress  
**Priority**: High (IRB compliance)
