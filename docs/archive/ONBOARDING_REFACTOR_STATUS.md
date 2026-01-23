# Onboarding Refactor - Implementation Status

## ✅ Completed

### Phase 1: Database Migration ✅
- ✅ Added `research_consent` BOOLEAN column
- ✅ Added `research_consent_timestamp` TIMESTAMP column
- ✅ Added `research_consent_version` TEXT column
- ✅ Migration applied to database

### Phase 2: Step 0 - Consent Separation ✅
- ✅ Added Step 0 UI (consent separation screen)
- ✅ Course requirement acknowledgment (required)
- ✅ Research consent choice (optional: yes/no)
- ✅ State management for research consent
- ✅ Updated totalSteps to 4
- ✅ Added Step 0 validation

### Phase 3: Step 1 - Remove Password ✅
- ✅ Removed password fields from UI
- ✅ Removed password state variables
- ✅ Updated validation (removed password checks)
- ✅ Updated privacy notice text
- ✅ Updated API call (removed password)

### Phase 4: API Updates ✅
- ✅ Removed password from API validation
- ✅ Removed password hashing and storage
- ✅ Added research_consent fields to API
- ✅ Updated user creation (no password)
- ✅ Updated profile INSERT/UPDATE with research_consent fields

---

## ⏳ Remaining Work

### Phase 5: Step 2 - Optional Demographics (PENDING)
- [ ] Make sensitive demographic fields optional (not required)
- [ ] Add "Prefer not to answer" to ALL demographic fields (some already have it)
- [ ] Update validation to make sensitive fields optional
- [ ] Update UI labels (remove required indicators from sensitive fields)

**Current Status**: Gender already has "Prefer not to say", but validation still requires all fields.

### Phase 6: Step 3 - Restructure (PENDING)
- [ ] Separate into three blocks (A, B, C)
  - Block A: Financial background (required, low sensitivity)
  - Block B: Socio-economic (OPTIONAL, higher sensitivity)
  - Block C: Data-use notice with two confirmations
- [ ] Update wording ("coded/de-identified" instead of "anonymized")
- [ ] Add research consent confirmation/change option in Block C
- [ ] Update acknowledgment text to separate course requirement from research use

---

## Current State

### Steps
- **Step 0**: ✅ Consent separation (NEW)
- **Step 1**: ✅ Access and Identity (password removed)
- **Step 2**: ⏳ Demographics (needs optional fields)
- **Step 3**: ⏳ Financial Background (needs restructuring)

### Database
- ✅ Research consent fields added
- ✅ Password fields removed from user creation

### API
- ✅ Password removed
- ✅ Research consent fields added
- ✅ User creation without password

---

## Next Steps

1. **Update Step 2**: Make demographics optional with "Prefer not to answer"
2. **Update Step 3**: Restructure into blocks and update wording
3. **Testing**: Test the complete flow
4. **Documentation**: Update user-facing documentation

---

**Last Updated**: January 2025  
**Status**: Partial implementation (Steps 0-1 complete, Steps 2-3 pending)  
**Priority**: High (IRB compliance)
