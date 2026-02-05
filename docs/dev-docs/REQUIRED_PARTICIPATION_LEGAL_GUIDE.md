# Required Participation: Legal and Implementation Guide

## Overview

This guide covers how to make student participation **required** (mandatory) rather than voluntary, while maintaining legal compliance and ethical research standards.

**⚠️ IMPORTANT**: This is **not legal advice**. Consult your institution's **IRB (Institutional Review Board)** and legal counsel before implementing required participation.

---

## Legal Framework for Required Participation

### 1. **IRB Approval Required**

For **any research involving human subjects**, including educational research, you **must** obtain IRB approval. Required participation must be:
- Explicitly approved by your institution's IRB
- Documented in the IRB protocol
- Reviewed for ethical considerations

**Action Items**:
- ✅ Submit IRB protocol describing required participation
- ✅ Obtain IRB approval before requiring participation
- ✅ Keep IRB approval documentation on file

### 2. **Course Requirement Framework**

When participation is **required for course completion**, it is generally treated as:
- **Course requirement** (academic assignment), not "voluntary research"
- Students participate as part of their coursework
- Research data is collected as part of educational assessment

**Key Distinction**:
- **Voluntary Research**: "Consent to participate" (opt-in)
- **Required Participation**: "Acknowledge course requirement" (mandatory assignment)

### 3. **FERPA Compliance** (Already Implemented)

Your current implementation is FERPA-compliant:
- ✅ Hashed student IDs (no raw identifiers stored)
- ✅ Limited access (instructor-level access controls)
- ✅ Data anonymization for research analysis

**No changes needed** - FERPA requirements are already met.

---

## Implementation Changes

### 1. **Update Consent Language**

**Current Language** (Voluntary):
```
"I consent to participate and understand how my data will be used"
```

**Recommended Language** (Required):
```
"I acknowledge that completion of this assessment is required for this course and understand how my data will be used"
```

**Alternative** (More Explicit):
```
"I understand that completion of this assessment is a required course assignment and acknowledge how my assessment data will be used"
```

### 2. **Update Information Text**

**Current Text**:
```
"Your assessment data will be anonymized and used for learning improvement purposes. All information is confidential and protected under FERPA guidelines."
```

**Recommended Text** (Required Participation):
```
"Completion of this assessment is required for course credit. Your assessment data will be anonymized and used for learning improvement and research purposes. All information is confidential and protected under FERPA guidelines. If you have concerns about participation, please contact [instructor email] to discuss alternative arrangements."
```

### 3. **Alternative Options** (Recommended)

Even for required participation, consider providing alternatives:
- Alternative assignment (e.g., written reflection, alternative assessment)
- Accommodation for students with objections
- Clear process for requesting alternatives

**Why**: This demonstrates good faith, protects students, and strengthens legal position.

---

## Implementation Code Changes

### Option 1: Update Consent Language Only

Change the consent checkbox label and description text in `apps/web/src/app/onboarding/page.tsx`:

```typescript
// Line ~786: Update label
<I acknowledge that completion of this assessment is required for this course and understand how my data will be used <span className="text-red-500">*</span>

// Line ~789: Update description
Completion of this assessment is required for course credit. Your assessment data will be anonymized and used for learning improvement and research purposes. All information is confidential and protected under FERPA guidelines.
```

### Option 2: Add Alternative Assignment Option

Add a link or information about alternative arrangements:

```typescript
<p className="text-gray-500 mt-1">
  Completion of this assessment is required for course credit. 
  Your assessment data will be anonymized and used for learning improvement and research purposes. 
  All information is confidential and protected under FERPA guidelines. 
  <Link href="/alternatives" className="text-loyola-maroon underline">
    Learn about alternative arrangements
  </Link>.
</p>
```

---

## Best Practices Checklist

### Before Implementation

- [ ] **IRB Approval**: Obtain IRB approval for required participation
- [ ] **Course Syllabus**: Include assessment as required course assignment in syllabus
- [ ] **Instructor Communication**: Clearly communicate requirement to students
- [ ] **Alternative Process**: Establish process for students requesting alternatives
- [ ] **Legal Review**: Have institutional legal counsel review language

### Implementation

- [ ] **Language Update**: Update consent language to reflect required participation
- [ ] **Information Text**: Update data usage description
- [ ] **Database Records**: Consider storing acknowledgment timestamp (currently stores consent)
- [ ] **Documentation**: Keep records of participation requirements

### After Implementation

- [ ] **Monitor Compliance**: Track participation rates
- [ ] **Handle Objections**: Process requests for alternatives professionally
- [ ] **Document Exceptions**: Keep records of any accommodations provided

---

## Legal Considerations

### 1. **Institutional Policies**

- Check your institution's policies on required research participation
- Some institutions prohibit requiring participation in research
- Ensure compliance with university research policies

### 2. **FERPA Compliance** ✅

Your current implementation is FERPA-compliant:
- Hashed identifiers (no raw student IDs)
- Limited access controls
- Data anonymization

**Status**: ✅ No changes needed for FERPA compliance

### 3. **IRB Requirements**

IRB protocols typically require:
- Clear description of participation requirements
- Process for handling objections/alternatives
- Data protection measures (already implemented)
- Informed acknowledgment (not "consent" for required participation)

### 4. **Ethical Considerations**

Even for required participation:
- Students should understand what they're doing
- Data usage should be transparent
- Alternatives should be available (recommended)
- No coercion beyond course requirement

---

## Database Schema Consideration

**Current Implementation**: Stores consent as boolean in onboarding submission.

**For Required Participation**: Consider renaming/tracking as:
- `acknowledgment` (instead of `consent`)
- Store timestamp of acknowledgment
- Track whether alternative was requested/provided

**Current Schema Status**: The consent checkbox is stored implicitly through onboarding completion. No schema changes are strictly necessary, but consider explicitly tracking acknowledgment.

---

## Example Implementation

### Updated Onboarding Consent Section

```tsx
<div className="mt-6">
  <div className="flex items-start">
    <div className="flex items-center h-5">
      <input
        id="acknowledgment"
        name="acknowledgment"
        type="checkbox"
        checked={acknowledgment}
        onChange={(e) => setAcknowledgment(e.target.checked)}
        className="focus:ring-loyola-maroon h-5 w-5 text-loyola-maroon accent-loyola-maroon border-loyola-gray-300 rounded"
        required
      />
    </div>
    <div className="ml-3 text-sm">
      <label htmlFor="acknowledgment" className="font-medium text-gray-700">
        I acknowledge that completion of this assessment is required for this course and understand how my data will be used <span className="text-red-500">*</span>
      </label>
      <p className="text-gray-500 mt-1">
        Completion of this assessment is required for course credit. Your assessment data will be anonymized and used for learning improvement and research purposes. All information is confidential and protected under FERPA guidelines. If you have concerns about participation, please contact your instructor to discuss alternative arrangements.
      </p>
    </div>
  </div>
</div>
```

---

## Summary

### Key Steps for Required Participation

1. **Obtain IRB Approval** - Required before implementation
2. **Update Language** - Change "consent" to "acknowledge required"
3. **Provide Alternatives** - Establish process for students with objections
4. **Update Course Materials** - Include requirement in syllabus
5. **Legal Review** - Have institutional counsel review
6. **Document Everything** - Keep records of requirements and accommodations

### Current Status

- ✅ **FERPA Compliance**: Already implemented correctly
- ✅ **Data Protection**: Hash-based identifiers, access controls
- ⚠️ **IRB Approval**: Required before making participation mandatory
- ⚠️ **Language Updates**: Need to update consent language
- ⚠️ **Alternative Process**: Should establish process for objections

---

## Resources

- [Office for Human Research Protections (OHRP)](https://www.hhs.gov/ohrp/)
- [FERPA Guidelines](https://www2.ed.gov/policy/gen/guid/fpco/ferpa/index.html)
- Your institution's IRB office
- Your institution's legal counsel

---

## Next Steps

1. **Review with IRB**: Submit protocol for required participation
2. **Update Language**: Modify onboarding consent section (code changes provided above)
3. **Establish Alternatives**: Create process for student objections
4. **Update Syllabus**: Include assessment as course requirement
5. **Legal Review**: Have counsel review implementation
6. **Deploy Changes**: Update application with new language
7. **Monitor**: Track participation and handle exceptions professionally

---

**Last Updated**: January 2025  
**Status**: Guidance document - Not legal advice  
**Recommendation**: Consult IRB and legal counsel before implementation
