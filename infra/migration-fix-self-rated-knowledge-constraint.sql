-- Migration: Fix self_rated_financial_knowledge CHECK constraint
-- Add 'prefer-not-to-answer' as valid value for B7
-- Fixes: "new row for relation student_profiles violates check constraint student_profiles_self_rated_financial_knowledge_check"

ALTER TABLE student_profiles
DROP CONSTRAINT IF EXISTS student_profiles_self_rated_financial_knowledge_check;

ALTER TABLE student_profiles
ADD CONSTRAINT student_profiles_self_rated_financial_knowledge_check
CHECK (self_rated_financial_knowledge IN ('very-low', 'low', 'moderate', 'high', 'very-high', 'prefer-not-to-answer'));
