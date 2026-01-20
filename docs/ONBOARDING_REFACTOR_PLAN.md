# Onboarding Refactor Plan - IRB-Compliant Flow

## Overview

This document outlines the refactoring plan to update the onboarding flow to separate course requirements from optional research consent, remove password collection, and align with IRB best practices.

---

## Key Changes

### 1. **Step 0: Consent and Role Separation** (NEW)

**Purpose**: Clearly separate course requirement from optional research consent

**Screen Title**: "Consent and Data Use"

**Content**:
1. **Course Requirement** (No choice - acknowledgment only):
   - "This assessment is a required course assignment in QUINN 102. Completion affects course credit, but your answers are not graded for correctness."

2. **Research Consent** (Choice):
   - "You may choose whether your responses are used for research evaluating course learning outcomes. Declining has no impact on grades."
   - Toggle: "Yes, I consent" or "No, I do not consent"

**Storage**:
- `research_consent`: boolean (true/false)
- `research_consent_timestamp`: timestamp
- `research_consent_version`: string (e.g., "1.0")

---

### 2. **Step 1: Access and Identity** (UPDATED)

**Current**: Collects email + password
**New**: Email only (SSO or magic link)

**Options**:
- **Preferred**: Institutional SSO (if available)
- **Fallback**: Magic link sign-in (email-based)

**Fields**:
- Course Code (pre-filled, read-only)
- Email Address
- Student ID

**Remove**:
- Password field
- Confirm Password field

**Update Privacy Notice**:
- Remove: "We'll use this email to send you password reset links."
- Replace with: "We use your email only to authenticate access and to help you resume later if needed."

**Storage**:
- Email stored in `student_profiles.email`
- No password in `users.hashed_password`
- Use `hashed_student_key` for linking pre/post assessments

---

### 3. **Step 2: Demographics** (UPDATED)

**Changes**:
- Add "Prefer not to answer" to ALL demographic questions
- Make sensitive items optional (not required)
- Keep required only for non-sensitive operational fields

**Fields** (5-8 total, not all required):
- Age range (add "Prefer not to answer")
- Gender identity (add "Prefer not to answer")
- Race/ethnicity (add "Prefer not to answer")
- First language (add "Prefer not to answer")
- Work experience (add "Prefer not to answer")
- First-generation status (optional, can be in Step 3)

**Validation**: Only validate non-sensitive fields as required

---

### 4. **Step 3: Financial Background and Context** (UPDATED)

**Structure**: Three separate blocks

**Block A: Financial Background** (Low sensitivity, required)
- Products used (select all)
- Self-rated financial knowledge (baseline)
- Financial stress frequency (optional)

**Block B: Socio-Economic** (Higher sensitivity, OPTIONAL)
- Household income (add "Prefer not to say")
- Parental education (add "Prefer not to say")
- Financial aid (add "Prefer not to say")
- Living situation (add "Prefer not to say")
- Work-study (add "Prefer not to say")

**Block C: Data-Use Notice and Confirmation**
- Two separate confirmations:
  1. "I understand this assessment is required for the course." (required)
  2. "My research participation choice is:" (show selection from Step 0, allow changing)

**Wording Updates**:
- Remove "anonymized" (use "coded" or "de-identified")
- Separate course requirement from research use
- Clear language about data usage

---

## Database Changes

### Migration: Add Research Consent Fields

```sql
ALTER TABLE student_profiles
ADD COLUMN IF NOT EXISTS research_consent BOOLEAN DEFAULT NULL,
ADD COLUMN IF NOT EXISTS research_consent_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS research_consent_version TEXT DEFAULT NULL;
```

### Remove Password Dependency

- `users.hashed_password` can remain in schema (for backward compatibility)
- But onboarding should NOT set it
- Authentication should use SSO/magic link instead

---

## API Changes

### Update `/api/onboarding/submit`

**Remove**:
- Password validation
- Password hashing
- Password storage

**Add**:
- `research_consent`: boolean
- `research_consent_timestamp`: timestamp
- `research_consent_version`: string (e.g., "1.0")

**Update**:
- User creation without password
- Email storage (for authentication/support)
- Profile creation with research consent fields

---

## UI Changes

### Step 0 (NEW)
- Modal/page before Step 1
- Two separate sections:
  - Course requirement (acknowledgment)
  - Research consent (choice)
- Store selections in state

### Step 1 (UPDATED)
- Remove password fields
- Update privacy notice text
- For now: Keep email + Student ID (SSO/magic link can be added later)

### Step 2 (UPDATED)
- Add "Prefer not to answer" to all demographic questions
- Make validation optional for sensitive fields
- Update required field indicators

### Step 3 (UPDATED)
- Separate into three blocks (A, B, C)
- Update Block B to be optional
- Update Block C with new wording and two confirmations
- Allow changing research consent from Step 0

---

## Implementation Phases

### Phase 1: Database Migration
1. Create migration file for `research_consent` fields
2. Apply migration to database

### Phase 2: Step 0 - Consent Separation
1. Create Step 0 UI component
2. Add state management for research consent
3. Store consent values

### Phase 3: Step 1 - Remove Password
1. Remove password fields from UI
2. Update validation
3. Update API to not require/handle password
4. Update privacy notice text

### Phase 4: Step 2 - Optional Demographics
1. Add "Prefer not to answer" to all demographic fields
2. Update validation to make sensitive fields optional
3. Update UI labels

### Phase 5: Step 3 - Restructure
1. Separate into three blocks (A, B, C)
2. Make Block B optional
3. Update Block C with new wording
4. Add research consent confirmation

### Phase 6: API Updates
1. Update `/api/onboarding/submit` to handle research_consent
2. Remove password handling
3. Update user creation logic

---

## Notes

### SSO/Magic Link (Future)
- For now, keep email + Student ID approach
- SSO/magic link can be added in future phase
- Current implementation uses hashed_student_key for linking (no password needed)

### Backward Compatibility
- Keep `hashed_password` column in schema (for existing data)
- New users won't have passwords
- Existing password-based users can continue (but new onboarding won't create passwords)

### Testing
- Test with research consent = true
- Test with research consent = false
- Test with research consent changed in Step 3
- Test without password fields

---

**Last Updated**: January 2025  
**Status**: Implementation plan  
**Priority**: High (IRB compliance)
