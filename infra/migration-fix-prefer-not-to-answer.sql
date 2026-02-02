-- Migration: Fix "Prefer not to answer" CHECK constraints
-- Fixes B3 (age_range), B4 (first_language), B5 (work_experience), B10 (first_generation_college), B11 (has_student_loan_debt)
-- Date: 2026-01-29

BEGIN;

-- B3: age_range - add 'prefer-not-to-answer'
ALTER TABLE student_profiles DROP CONSTRAINT IF EXISTS student_profiles_age_range_check;
ALTER TABLE student_profiles ADD CONSTRAINT student_profiles_age_range_check
  CHECK (age_range IN ('20-or-under', 'above-20', 'prefer-not-to-answer'));

-- B4: first_language - add 'prefer-not-to-answer'
ALTER TABLE student_profiles DROP CONSTRAINT IF EXISTS student_profiles_first_language_check;
ALTER TABLE student_profiles ADD CONSTRAINT student_profiles_first_language_check
  CHECK (first_language IN ('english', 'spanish', 'chinese', 'french', 'russian', 'dutch', 'other', 'prefer-not-to-answer'));

-- B5: work_experience - add 'prefer-not-to-answer'
ALTER TABLE student_profiles DROP CONSTRAINT IF EXISTS student_profiles_work_experience_check;
ALTER TABLE student_profiles ADD CONSTRAINT student_profiles_work_experience_check
  CHECK (work_experience IN ('no-work-experience', 'part-time', 'full-time', 'prefer-not-to-answer'));

-- B10: first_generation_college - change from BOOLEAN to TEXT with CHECK constraint
-- First convert existing boolean values to text equivalents
ALTER TABLE student_profiles
  ALTER COLUMN first_generation_college TYPE TEXT
  USING CASE
    WHEN first_generation_college::text = 'true' THEN 'yes'
    WHEN first_generation_college::text = 'false' THEN 'no'
    ELSE first_generation_college::text
  END;

ALTER TABLE student_profiles ADD CONSTRAINT student_profiles_first_generation_college_check
  CHECK (first_generation_college IN ('yes', 'no', 'prefer-not-to-say'));

-- B11: has_student_loan_debt - add CHECK constraint if missing (already TEXT on live DB)
-- Skip type conversion since it's already TEXT; just ensure CHECK constraint exists
ALTER TABLE student_profiles DROP CONSTRAINT IF EXISTS student_profiles_has_student_loan_debt_check;
ALTER TABLE student_profiles ADD CONSTRAINT student_profiles_has_student_loan_debt_check
  CHECK (has_student_loan_debt IN ('yes', 'no', 'prefer-not-to-say'));

COMMIT;
