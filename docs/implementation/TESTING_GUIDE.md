# Testing Guide: Baseline Covariates Implementation

This guide provides step-by-step instructions for testing the baseline covariates implementation.

## Prerequisites

1. Database migration executed (`infra/migration-add-baseline-covariates.sql`)
2. Development server running (`npm run dev` in `apps/web/`)
3. Database connection configured
4. Test course created in database

## Test Scenarios

### Scenario 1: Complete Onboarding Flow

**Objective**: Verify all baseline questions (B1-B8) collect and save data correctly.

**Steps**:

1. **Navigate to Start Page**
   - Go to `http://localhost:3001/start`
   - Enter course code: `Financial Literacy`
   - Click "Continue to Onboarding"

2. **Step 1: Student ID**
   - Enter Student ID: `TEST001`
   - Click "Continue"
   - ✅ Verify: Progress shows 33% complete

3. **Step 2: Demographics (B1-B5)**
   - **B1 (Gender)**: Select "Female"
   - **B2 (Race/Ethnicity)**: Select "Asian"
   - **B3 (Age Range)**: Select "Above 20"
   - **B4 (First Language)**: Select "English"
   - **B5 (Work Experience)**: Select "Part-time employment"
   - Click "Continue"
   - ✅ Verify: Progress shows 67% complete
   - ✅ Verify: No validation errors

4. **Step 3: Financial Background (B6-B8)**
   - **B6 (Prior Financial Products)**: 
     - Check "Credit card"
     - Check "Student loan"
   - **B7 (Self-Rated Knowledge)**: Select "Moderate"
   - **B8 (Financial Stress)**: Select "Sometimes"
   - Fill optional socioeconomic fields if desired
   - Check consent checkbox
   - Click "Complete & Start Assessment"
   - ✅ Verify: Form submits successfully
   - ✅ Verify: Redirects to assessment page

5. **Verify Data in Database**
   ```sql
   SELECT 
     age_range, gender, race_ethnicity, first_language,
     prior_financial_products, self_rated_financial_knowledge,
     financial_stress_frequency
   FROM student_profiles
   WHERE user_id = (
     SELECT user_id FROM users 
     WHERE hashed_student_key LIKE '%TEST001%'
   );
   ```
   - ✅ Verify: All fields contain expected values
   - ✅ Verify: `prior_financial_products` is a valid JSONB array

### Scenario 2: Edge Cases

**Test "Other" Language Field**:
1. In Step 2, select "Other" for first language
2. ✅ Verify: Text input field appears
3. Enter "Portuguese"
4. ✅ Verify: Field is required and validated
5. Submit and verify data saves

**Test Multi-Select (B6)**:
1. Select multiple financial products
2. Select "None of the above"
3. ✅ Verify: Other selections are cleared (if logic implemented)
4. Or verify: Multiple selections are saved correctly

**Test Validation**:
1. Try to proceed without filling required fields
2. ✅ Verify: Error messages appear
3. ✅ Verify: Cannot proceed to next step

### Scenario 3: Data Integrity

**Test JSONB Storage**:
```sql
-- Check JSONB array structure
SELECT 
  prior_financial_products,
  jsonb_array_length(prior_financial_products) as count
FROM student_profiles
WHERE prior_financial_products IS NOT NULL;
```
- ✅ Verify: Array is valid JSONB
- ✅ Verify: Contains expected product codes

**Test Constraints**:
```sql
-- Try to insert invalid data (should fail)
INSERT INTO student_profiles (
  user_id, course_id, age_range, self_rated_financial_knowledge
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000000',
  'invalid-value',  -- Should fail CHECK constraint
  'invalid-rating'  -- Should fail CHECK constraint
);
```
- ✅ Verify: Constraints prevent invalid data

## API Testing

### Test Onboarding Submit Endpoint

```bash
curl -X POST http://localhost:3001/api/onboarding/submit \
  -H "Content-Type: application/json" \
  -d '{
    "courseCode": "Financial Literacy",
    "studentId": "TEST002",
    "demographic": {
      "age_range": "20-or-under",
      "gender": "male",
      "race_ethnicity": "White or Caucasian",
      "first_language": "spanish",
      "work_experience": "no-work-experience"
    },
    "financial_background": {
      "prior_financial_products": ["credit-card", "investment-account"],
      "self_rated_financial_knowledge": "high",
      "financial_stress_frequency": "rarely"
    },
    "socioeconomic": {
      "household_income": "50000-74999",
      "parental_education": "bachelors"
    }
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Onboarding data saved successfully",
  "data": {
    "userId": "...",
    "courseId": "..."
  }
}
```

## Database Verification

### Check Migration Applied

```sql
-- Verify all new columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'student_profiles'
AND column_name IN (
  'age_range', 'first_language', 'first_language_other',
  'prior_financial_products', 'self_rated_financial_knowledge',
  'financial_stress_frequency'
)
ORDER BY column_name;
```

**Expected**: 6 rows returned with correct data types

### Check Constraints

```sql
-- Verify CHECK constraints
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'student_profiles'::regclass
AND contype = 'c'
AND conname LIKE '%age_range%' OR conname LIKE '%first_language%' 
   OR conname LIKE '%financial%';
```

## Frontend Testing

### Browser Console Checks

1. Open browser DevTools (F12)
2. Navigate through onboarding
3. Check Console tab for:
   - ✅ No JavaScript errors
   - ✅ API calls succeed (200 status)
   - ✅ No validation warnings

### Network Tab Verification

1. Open Network tab in DevTools
2. Complete onboarding form
3. Submit form
4. Check `/api/onboarding/submit` request:
   - ✅ Request payload contains all fields
   - ✅ Response is 200 OK
   - ✅ Response contains success message

## Test Data Examples

### Complete Test Profile 1
```json
{
  "studentId": "TEST001",
  "demographic": {
    "age_range": "above-20",
    "gender": "female",
    "race_ethnicity": "Asian",
    "first_language": "english",
    "work_experience": "part-time"
  },
  "financial_background": {
    "prior_financial_products": ["credit-card", "student-loan"],
    "self_rated_financial_knowledge": "moderate",
    "financial_stress_frequency": "sometimes"
  }
}
```

### Complete Test Profile 2
```json
{
  "studentId": "TEST002",
  "demographic": {
    "age_range": "20-or-under",
    "gender": "male",
    "race_ethnicity": "Hispanic or Latino",
    "first_language": "other",
    "first_language_other": "Portuguese",
    "work_experience": "no-work-experience"
  },
  "financial_background": {
    "prior_financial_products": ["none"],
    "self_rated_financial_knowledge": "very-low",
    "financial_stress_frequency": "often"
  }
}
```

## Troubleshooting

### Issue: Migration Fails

**Error**: `column already exists`
- **Solution**: Columns may already exist. Check with:
  ```sql
  SELECT column_name FROM information_schema.columns 
  WHERE table_name = 'student_profiles';
  ```

### Issue: Form Validation Not Working

**Check**:
- Browser console for JavaScript errors
- Form state variables are initialized
- Validation logic in `handleNext()` function

### Issue: Data Not Saving

**Check**:
- API endpoint is accessible
- Database connection is working
- RLS policies allow inserts
- Transaction is committing

### Issue: JSONB Array Not Storing

**Check**:
- Array is being sent as array, not string
- PostgreSQL version supports JSONB
- Column type is JSONB (not TEXT)

## Success Criteria

✅ All tests pass when:
1. All 8 baseline questions collect data
2. Data saves correctly to database
3. JSONB array stores properly
4. Validation works for all fields
5. Form submission succeeds
6. No console errors
7. API returns success responses

## Next Steps After Testing

Once testing is complete:
1. Verify question bank (30 scored questions)
2. Test full assessment flow
3. Verify analytics can access baseline data
4. Document any issues found

