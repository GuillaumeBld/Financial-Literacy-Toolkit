# Quick Start: Execute Baseline Covariates Implementation

**Time Required**: ~20 minutes  
**Prerequisites**: Database access, development server

## Step-by-Step Execution

### 1. Verify Readiness (2 minutes)

```bash
./scripts/execute-next-steps.sh
```

This verifies all files are in place and ready.

### 2. Execute Database Migration (5 minutes)

**Option A: Supabase SQL Editor**
1. Log into Supabase dashboard
2. Go to SQL Editor
3. Copy contents of: `infra/migration-add-baseline-covariates.sql`
4. Paste and execute
5. Verify success

**Option B: Command Line**
```bash
psql $DATABASE_URL -f infra/migration-add-baseline-covariates.sql
```

**Verify Migration**:
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'student_profiles' 
AND column_name IN (
  'age_range', 'first_language', 'prior_financial_products',
  'self_rated_financial_knowledge', 'financial_stress_frequency'
);
```

**Expected**: 5-6 rows (depending on existing schema)

### 3. Test Onboarding Flow (10 minutes)

1. **Start Dev Server**:
   ```bash
   cd apps/web
   npm run dev
   ```

2. **Navigate to Onboarding**:
   - Go to: `http://localhost:3001/start`
   - Enter course code: `Financial Literacy`
   - Enter student ID: `TEST001`

3. **Complete Step 2 (B1-B5)**:
   - Gender: Select "Female"
   - Race/Ethnicity: Select "Asian"
   - Age Range: Select "Above 20"
   - First Language: Select "English"
   - Work Experience: Select "Part-time employment"
   - Click "Continue"

4. **Complete Step 3 (B6-B8)**:
   - Prior Financial Products: Check "Credit card" and "Student loan"
   - Self-Rated Knowledge: Select "Moderate"
   - Financial Stress: Select "Sometimes"
   - Check consent box
   - Click "Complete & Start Assessment"

5. **Verify Success**:
   - Should redirect to assessment page
   - No errors in browser console
   - Check database to confirm data saved

### 4. Verify Question Bank (3 minutes)

```bash
./scripts/verify-question-bank.sh
```

**Expected Output**:
- Total questions: 30
- All questions have answer keys
- Domain distribution matches study

## Troubleshooting

**Migration fails**: Check if columns already exist (safe to skip if they do)

**Form doesn't submit**: Check browser console for errors

**Data not saving**: Verify migration executed successfully

## Success!

✅ All 8 baseline questions working  
✅ Data saving correctly  
✅ Ready for data collection  

## Next Steps

- Verify question bank contains all 30 scored questions
- Test full assessment flow
- Review analytics access to baseline data

For detailed guides, see:
- `docs/implementation/TESTING_GUIDE.md`
- `docs/implementation/MIGRATION_CHECKLIST.md`

