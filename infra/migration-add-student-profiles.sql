-- Migration: Add student_profiles table for demographic and socio-economic data
-- FERPA Compliant: Linked to user_id (hashed), not raw student IDs

-- Student profiles table for demographic and socio-economic data
CREATE TABLE IF NOT EXISTS student_profiles (
  profile_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
  
  -- Demographic data
  age INTEGER CHECK (age >= 16 AND age <= 100),
  gender TEXT CHECK (gender IN ('male', 'female', 'non-binary', 'prefer-not-to-say', 'other')),
  race_ethnicity TEXT, -- e.g., 'White', 'Black or African American', 'Hispanic or Latino', 'Asian', 'Native American', 'Pacific Islander', 'Other', 'Prefer not to say'
  
  -- Socio-economic data
  household_income TEXT CHECK (household_income IN ('under-25000', '25000-49999', '50000-74999', '75000-99999', '100000-149999', '150000-199999', '200000-plus', 'prefer-not-to-say')),
  parental_education TEXT CHECK (parental_education IN ('high-school-or-less', 'some-college', 'bachelors', 'masters', 'doctorate', 'prefer-not-to-say')),
  employment_status TEXT CHECK (employment_status IN ('full-time', 'part-time', 'unemployed', 'student-only', 'prefer-not-to-say')),
  first_generation_college BOOLEAN, -- First generation college student
  financial_aid_recipient BOOLEAN, -- Receives financial aid
  
  -- Additional context
  living_situation TEXT CHECK (living_situation IN ('on-campus', 'off-campus', 'with-family', 'other')),
  work_study BOOLEAN, -- Participates in work-study program
  
  -- Metadata
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one profile per user per course
  UNIQUE(user_id, course_id)
);

-- Indexes for performance
CREATE INDEX idx_student_profiles_user ON student_profiles(user_id);
CREATE INDEX idx_student_profiles_course ON student_profiles(course_id);

-- Enable Row Level Security
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own profile data
-- (This will need to be configured based on your authentication setup)

COMMENT ON TABLE student_profiles IS 'Stores demographic and socio-economic data for students. FERPA compliant - linked to hashed user_id only.';
COMMENT ON COLUMN student_profiles.user_id IS 'References users table (hashed student key, no raw IDs)';
COMMENT ON COLUMN student_profiles.course_id IS 'Course context for the profile data';

