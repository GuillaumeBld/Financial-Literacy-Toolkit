-- Migration: Add research consent tracking to student_profiles
-- Separates course requirement from optional research consent (IRB best practice)

-- Add research consent fields to student_profiles
ALTER TABLE student_profiles
ADD COLUMN IF NOT EXISTS research_consent BOOLEAN DEFAULT NULL, -- NULL = not answered, true = consented, false = declined
ADD COLUMN IF NOT EXISTS research_consent_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NULL, -- When consent was given/declined
ADD COLUMN IF NOT EXISTS research_consent_version TEXT DEFAULT NULL; -- Version of consent form (for tracking changes)

-- Add comment
COMMENT ON COLUMN student_profiles.research_consent IS 'Research consent status: true = consented, false = declined, NULL = not answered. Separate from course requirement.';
COMMENT ON COLUMN student_profiles.research_consent_timestamp IS 'Timestamp when research consent was given or declined';
COMMENT ON COLUMN student_profiles.research_consent_version IS 'Version of consent form used (for tracking consent form changes)';
