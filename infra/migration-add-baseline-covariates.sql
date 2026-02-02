-- Migration: Add missing baseline covariates to match independent study document
-- Adds: first_language, prior_financial_products, self_rated_financial_knowledge, financial_stress_frequency
-- Updates: age to age_range, employment_status to match B5 format

-- Add new columns to student_profiles table
ALTER TABLE student_profiles
  ADD COLUMN IF NOT EXISTS age_range TEXT CHECK (age_range IN ('20-or-under', 'above-20', 'prefer-not-to-answer')),
  ADD COLUMN IF NOT EXISTS first_language TEXT CHECK (first_language IN ('english', 'spanish', 'chinese', 'french', 'russian', 'dutch', 'other', 'prefer-not-to-answer')),
  ADD COLUMN IF NOT EXISTS first_language_other TEXT, -- For "Other" option
  ADD COLUMN IF NOT EXISTS prior_financial_products JSONB, -- Array of selected products: ['credit-card', 'student-loan', 'auto-loan', 'investment-account', 'insurance', 'none']
  ADD COLUMN IF NOT EXISTS self_rated_financial_knowledge TEXT CHECK (self_rated_financial_knowledge IN ('very-low', 'low', 'moderate', 'high', 'very-high')),
  ADD COLUMN IF NOT EXISTS financial_stress_frequency TEXT CHECK (financial_stress_frequency IN ('never', 'rarely', 'sometimes', 'often', 'always'));

-- Update gender values to match independent study (B1: Female, Male, Prefer not to say)
-- Note: Current schema allows more options, but we'll align the form options

-- Update employment_status to match B5 format (No work experience, Part-time, Full-time)
-- Note: Current values are compatible, but we'll ensure form uses correct labels

-- Add comments for documentation
COMMENT ON COLUMN student_profiles.age_range IS 'Baseline B3: Age range (20 or under, Above 20)';
COMMENT ON COLUMN student_profiles.first_language IS 'Baseline B4: First language';
COMMENT ON COLUMN student_profiles.first_language_other IS 'Baseline B4: Other language specification';
COMMENT ON COLUMN student_profiles.prior_financial_products IS 'Baseline B6: Prior financial products used (JSONB array)';
COMMENT ON COLUMN student_profiles.self_rated_financial_knowledge IS 'Baseline B7: Self-rated financial knowledge before course';
COMMENT ON COLUMN student_profiles.financial_stress_frequency IS 'Baseline B8: Frequency of financial stress';

