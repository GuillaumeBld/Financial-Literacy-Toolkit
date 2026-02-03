-- Migration: Fix financial_stress_frequency CHECK constraint
-- Add 'prefer-not-to-answer' as valid value for B8
-- Fixes: "new row for relation student_profiles violates check constraint student_profiles_financial_stress_frequency_check"

ALTER TABLE student_profiles
DROP CONSTRAINT IF EXISTS student_profiles_financial_stress_frequency_check;

ALTER TABLE student_profiles
ADD CONSTRAINT student_profiles_financial_stress_frequency_check
CHECK (financial_stress_frequency IN ('never', 'rarely', 'sometimes', 'often', 'always', 'prefer-not-to-answer'));
