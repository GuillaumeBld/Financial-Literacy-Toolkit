-- Migration: Add baseline student loan debt status fields (B11-B12)
-- Adds: has_student_loan_debt, student_loan_interest_rate

ALTER TABLE student_profiles
  ADD COLUMN IF NOT EXISTS has_student_loan_debt BOOLEAN,
  ADD COLUMN IF NOT EXISTS student_loan_interest_rate TEXT CHECK (
    student_loan_interest_rate IN (
      'less-than-5',
      'between-5-and-10',
      'above-10',
      'do-not-know',
      'prefer-not-to-say'
    )
  );

COMMENT ON COLUMN student_profiles.has_student_loan_debt IS 'Baseline B11: Do you currently have any student loan debt?';
COMMENT ON COLUMN student_profiles.student_loan_interest_rate IS 'Baseline B12: Interest rate on student loan debt (best estimate)';
