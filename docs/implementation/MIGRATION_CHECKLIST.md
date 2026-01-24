# Database Migration Checklist

This checklist ensures the baseline covariates migration is executed correctly and safely.

## Pre-Migration

- [ ] **Check if Columns Already Exist**
  ```sql
  -- Check if baseline columns already exist
  SELECT column_name, data_type 
  FROM information_schema.columns 
  WHERE table_name = 'student_profiles'
  AND column_name IN (
    'age_range', 'first_language', 'first_language_other',
    'prior_financial_products', 'self_rated_financial_knowledge',
    'financial_stress_frequency'
  )
  ORDER BY column_name;
  ```
  
  **Note**: If columns already exist (from `migration-add-student-profiles.sql`), the migration will skip them safely using `IF NOT EXISTS`.

- [ ] **Backup Database** (Optional but recommended)
  ```sql
  -- Create backup of student_profiles table
  CREATE TABLE student_profiles_backup AS 
  SELECT * FROM student_profiles;
  ```

- [ ] **Verify Current Schema**
  ```sql
  -- Check all existing columns
  SELECT column_name, data_type 
  FROM information_schema.columns 
  WHERE table_name = 'student_profiles'
  ORDER BY column_name;
  ```

- [ ] **Check for Existing Data**
  ```sql
  -- Count existing profiles
  SELECT COUNT(*) FROM student_profiles;
  ```

- [ ] **Review Migration Script**
  - Open `infra/migration-add-baseline-covariates.sql`
  - Verify column names match requirements
  - Check constraint values match form options

## Migration Execution

- [ ] **Connect to Database**
  - Supabase SQL Editor, or
  - psql command line, or
  - Database management tool

- [ ] **Execute Migration**
  ```sql
  -- Copy and paste entire contents of:
  -- infra/migration-add-baseline-covariates.sql
  ```

- [ ] **Verify Execution Success**
  - Check for error messages
  - Verify "ALTER TABLE" completed
  - Check "COMMENT ON COLUMN" statements executed

## Post-Migration Verification

- [ ] **Verify New Columns Exist**
  ```sql
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
  **Expected**: 6 rows returned

- [ ] **Verify Column Types**
  - `age_range`: TEXT
  - `first_language`: TEXT
  - `first_language_other`: TEXT
  - `prior_financial_products`: JSONB
  - `self_rated_financial_knowledge`: TEXT
  - `financial_stress_frequency`: TEXT

- [ ] **Verify Constraints**
  ```sql
  -- Check CHECK constraints
  SELECT 
    conname,
    pg_get_constraintdef(oid)
  FROM pg_constraint
  WHERE conrelid = 'student_profiles'::regclass
  AND contype = 'c'
  AND (conname LIKE '%age_range%' 
       OR conname LIKE '%first_language%'
       OR conname LIKE '%financial%');
  ```

- [ ] **Test JSONB Column**
  ```sql
  -- Test inserting JSONB array
  INSERT INTO student_profiles (
    user_id, course_id, prior_financial_products
  ) VALUES (
    (SELECT user_id FROM users LIMIT 1),
    (SELECT course_id FROM courses LIMIT 1),
    '["credit-card", "student-loan"]'::jsonb
  );
  
  -- Verify it worked
  SELECT prior_financial_products 
  FROM student_profiles 
  WHERE prior_financial_products IS NOT NULL;
  
  -- Clean up test
  DELETE FROM student_profiles 
  WHERE prior_financial_products = '["credit-card", "student-loan"]'::jsonb;
  ```

- [ ] **Verify Comments Added**
  ```sql
  SELECT 
    column_name,
    col_description('student_profiles'::regclass, ordinal_position) as comment
  FROM information_schema.columns
  WHERE table_name = 'student_profiles'
  AND column_name IN (
    'age_range', 'first_language', 'prior_financial_products',
    'self_rated_financial_knowledge', 'financial_stress_frequency'
  );
  ```

## Rollback Plan (If Needed)

If migration causes issues:

```sql
-- Remove new columns (only if necessary)
ALTER TABLE student_profiles
  DROP COLUMN IF EXISTS age_range,
  DROP COLUMN IF EXISTS first_language,
  DROP COLUMN IF EXISTS first_language_other,
  DROP COLUMN IF EXISTS prior_financial_products,
  DROP COLUMN IF EXISTS self_rated_financial_knowledge,
  DROP COLUMN IF EXISTS financial_stress_frequency;
```

## Common Issues

### Issue: "Column already exists"
- **Cause**: Columns may already exist from `migration-add-student-profiles.sql`
- **Solution**: Migration uses `IF NOT EXISTS`, so it's safe. Columns will be skipped if they exist.
- **Verification**: Check if columns exist before running migration (see Pre-Migration section)

### Issue: "Constraint violation"
- **Cause**: Existing data doesn't match new constraints
- **Solution**: Check existing data, update or remove invalid rows

### Issue: "Permission denied"
- **Cause**: Insufficient database privileges
- **Solution**: Use database admin account or request permissions

## Success Criteria

✅ Migration is successful when:
1. All 6 new columns exist
2. Column types are correct
3. Constraints are applied
4. Comments are added
5. JSONB column accepts array data
6. No errors in migration log

## Next Steps

After successful migration:
1. Test onboarding form (see `TESTING_GUIDE.md`)
2. Verify data saves correctly
3. Check API endpoint works
4. Update application code if needed

