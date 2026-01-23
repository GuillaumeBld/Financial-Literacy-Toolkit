-- Migration: Add baseline student loan maturity field (B13)
-- Adds: student_loan_maturity

ALTER TABLE student_profiles
  ADD COLUMN IF NOT EXISTS student_loan_maturity TEXT CHECK (
    student_loan_maturity IN (
      'less-or-equal-3-years',
      'between-3-to-5-years',
      'above-5-years',
      'do-not-know',
      'prefer-not-to-say'
    )
  );

COMMENT ON COLUMN student_profiles.student_loan_maturity IS 'Baseline B13: Current maturity (length of loan time) for student loan debt';
