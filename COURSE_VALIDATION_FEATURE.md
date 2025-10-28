# Course Validation Feature - Implementation Complete

## Overview
Added validation to prevent students from starting assessments with invalid course codes.

## What Was Added

### 1. Course Validation API Endpoint
**File**: `apps/web/src/app/api/courses/validate/route.ts`
- Validates course codes against database
- Returns `{ valid: true/false }` response
- Error handling for database issues

### 2. Enhanced Start Page Form
**File**: `apps/web/src/app/start/page.tsx`
- Added error state display
- Added validation loading state
- Shows "Validating..." button text during check
- Prevents submission if course is invalid

## How It Works

### User Flow
1. Student enters course code and student ID
2. Student checks consent box
3. Student clicks "Start Assessment"
4. System validates course code via API
5. If invalid → Shows error message
6. If valid → Redirects to assessment

### Validation Logic
```typescript
// Check if course exists in database
const { data: courses } = await supabase
  .from('courses')
  .select('course_id, name')
  .eq('name', courseCode.trim());

// Course is valid if found in database
valid: courses && courses.length > 0
```

## Test Cases

### ✅ Valid Course Codes
- "FINC 000" ✅
- "Financial Literacy" ✅

### ❌ Invalid Course Codes
- "INVALID123" ❌
- "Wrong Course" ❌
- Empty string ❌

## Error Messages

### Invalid Course Code
```
"Invalid course code. Please check your course code and try again."
```

### Validation Failure
```
"Unable to validate course code. Please try again."
```

### Missing Fields
```
"Please fill in all fields and check the consent box."
```

## Benefits

1. **Prevents Invalid Assessments** - No more attempts with wrong course codes
2. **Better User Experience** - Immediate feedback before starting assessment
3. **Data Integrity** - Ensures only valid courses get attempts
4. **Clear Error Messages** - Students know exactly what's wrong

## Current Valid Courses

Based on database:
- **FINC 000** (Fall 2025)
- **Financial Literacy** (Fall 2025) - 2 instances

## Future Enhancements

Could add:
- Course code hints/suggestions
- Active term validation
- Enrollment verification (check if student is enrolled)
- Course status check (active/inactive)

---

**Status**: ✅ Complete and Ready for Testing

