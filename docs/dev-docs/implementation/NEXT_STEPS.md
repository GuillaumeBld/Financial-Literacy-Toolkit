# Next Steps: Baseline Covariates Implementation

This document outlines the immediate next steps to complete the baseline covariates implementation and verify system readiness.

## ✅ Completed

- [x] Database migration script created
- [x] Onboarding form updated with all B1-B8 questions
- [x] API endpoint updated to handle new fields
- [x] Documentation organized and updated

## 🔄 Immediate Actions Required

### 1. Run Database Migration

**Location**: `infra/migration-add-baseline-covariates.sql`

**Steps**:
1. Connect to your Supabase PostgreSQL database
2. Open the SQL Editor
3. Execute the migration script:
   ```sql
   -- Copy and paste contents of:
   -- infra/migration-add-baseline-covariates.sql
   ```
4. Verify columns were added:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'student_profiles' 
   AND column_name IN (
     'age_range', 'first_language', 'first_language_other',
     'prior_financial_products', 'self_rated_financial_knowledge', 
     'financial_stress_frequency'
   );
   ```

**Expected Result**: 6 new columns should exist in `student_profiles` table

### 2. Test Onboarding Flow

**Test Steps**:
1. Navigate to `/start` page
2. Enter course code (e.g., "Financial Literacy")
3. Complete Step 1: Student ID
4. Complete Step 2: Demographics (B1-B5)
   - Verify all 5 questions appear
   - Test "Other" language field appears when selected
   - Submit and verify validation works
5. Complete Step 3: Financial Background (B6-B8)
   - Verify multi-select checkboxes work for B6
   - Verify all dropdowns work
   - Submit and verify data saves
6. Check database to confirm data was saved correctly

**Test Data Example**:
```json
{
  "studentId": "TEST001",
  "ageRange": "above-20",
  "gender": "female",
  "raceEthnicity": "Asian",
  "firstLanguage": "english",
  "workExperience": "part-time",
  "priorFinancialProducts": ["credit-card", "student-loan"],
  "selfRatedFinancialKnowledge": "moderate",
  "financialStressFrequency": "sometimes"
}
```

### 3. Verify Question Bank

**Objective**: Ensure all 38 questions from the independent study are in the database

**Required Questions**:
- 8 Baseline questions (B1-B8) - These are collected in onboarding, not in items table
- 30 Scored questions (Q1-Q30) - These should be in the `items` table

**Verification Steps**:

1. **Check items table count**:
   ```sql
   SELECT COUNT(*) as total_items FROM items;
   -- Should return 30 (scored questions only)
   ```

2. **Verify domain structure**:
   ```sql
   SELECT domain, COUNT(*) as count 
   FROM items 
   GROUP BY domain 
   ORDER BY domain;
   ```
   
   Expected domains:
   - "Borrowing, Interest Rates, and Financial Numeracy Knowledge" (13 items)
   - "Behavioral and Risk Management Knowledge" (10 items)
   - "Risk and Return Knowledge" (7 items)

3. **Check for answer keys**:
   ```sql
   SELECT 
     COUNT(*) as total,
     COUNT(key) as with_keys,
     COUNT(*) - COUNT(key) as missing_keys
   FROM items;
   -- All items should have answer keys
   ```

4. **Verify question coverage**:
   - Compare questions in database with `docs/research/independant_study.md`
   - Ensure all 30 scored questions are present
   - Verify answer keys match the study document

**Script**: See `scripts/verify-question-bank.sh` (to be created)

## 📋 Verification Checklist

### Database
- [ ] Migration executed successfully
- [ ] All 6 new columns exist in `student_profiles`
- [ ] Column constraints are correct
- [ ] JSONB column accepts array data

### Onboarding Form
- [ ] Step 2 displays all B1-B5 questions
- [ ] Step 3 displays all B6-B8 questions
- [ ] Validation works for all required fields
- [ ] "Other" language field appears conditionally
- [ ] Multi-select checkboxes work for B6
- [ ] Form submission succeeds

### Data Storage
- [ ] Demographic data (B1-B5) saves correctly
- [ ] Financial background data (B6-B8) saves correctly
- [ ] JSONB array (prior_financial_products) stores correctly
- [ ] Data persists after page refresh
- [ ] Data can be retrieved for analysis

### Question Bank
- [ ] 30 scored questions exist in database
- [ ] All questions have answer keys
- [ ] Domain assignments match study structure
- [ ] Question text matches study document
- [ ] Options match study document

## 🔍 Testing Commands

### Test Onboarding API
```bash
curl -X POST http://localhost:3001/api/onboarding/submit \
  -H "Content-Type: application/json" \
  -d '{
    "courseCode": "QUIN 102",
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
    },
    "socioeconomic": {}
  }'
```

### Verify Stored Data
```sql
SELECT 
  age_range, gender, race_ethnicity, first_language,
  prior_financial_products, self_rated_financial_knowledge,
  financial_stress_frequency
FROM student_profiles
WHERE user_id = (
  SELECT user_id FROM users 
  WHERE hashed_student_key = '...' -- Use actual hashed key
);
```

## 🚨 Troubleshooting

### Migration Fails
- Check if columns already exist
- Verify table name is correct
- Check PostgreSQL version compatibility
- Review error messages for constraint violations

### Onboarding Form Issues
- Check browser console for errors
- Verify API endpoint is accessible
- Check network tab for request/response
- Verify form validation logic

### Data Not Saving
- Check API response for errors
- Verify database connection
- Check RLS policies allow inserts
- Review transaction logs

## 📊 Success Criteria

Implementation is complete when:
1. ✅ Database migration executed
2. ✅ All 8 baseline questions collect data
3. ✅ Data saves correctly to database
4. ✅ All 30 scored questions verified in database
5. ✅ End-to-end test passes (onboarding → assessment → results)

## 🔗 Related Documentation

- **Research objectives**: [`../research/independant_study.md`](../research/independant_study.md)
- **Alignment summary**: [`../research/ALIGNMENT_SUMMARY.md`](../research/ALIGNMENT_SUMMARY.md)
- **Implementation details**: [`IMPLEMENTATION_NOTES.md`](./IMPLEMENTATION_NOTES.md)
- **Testing guide**: [`TESTING_GUIDE.md`](./TESTING_GUIDE.md)
- **Migration checklist**: [`MIGRATION_CHECKLIST.md`](./MIGRATION_CHECKLIST.md)
- **Database schema**: [`../../infra/schema.sql`](../../infra/schema.sql)

