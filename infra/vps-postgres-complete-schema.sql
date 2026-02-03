-- Financial Literacy Assessment Database - Complete Schema for VPS PostgreSQL
-- Consolidated from: schema.sql, instructor-schema.sql, and all feature migrations
-- Adapted for direct PostgreSQL (removed Supabase-specific features)
-- FERPA Compliant: No raw student IDs stored, only hashed keys

-- ============================================================================
-- BASE SCHEMA: Core Financial Literacy Assessment Tables
-- ============================================================================

-- Users table (hashed student identifiers only)
CREATE TABLE users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hashed_student_key TEXT NOT NULL UNIQUE, -- SHA256(course_pepper + student_id)
  sso_provider TEXT,
  hashed_password TEXT, -- Bcrypt hash for student authentication (migration-add-student-password.sql)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Courses table
CREATE TABLE courses (
  course_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  term TEXT NOT NULL, -- e.g., "Fall 2025"
  pepper TEXT NOT NULL UNIQUE, -- Random salt for hashing student IDs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Course enrollments
CREATE TABLE enrollments (
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(course_id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'student', -- 'student', 'instructor', 'admin'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, course_id)
);

-- Assessment instruments (forms/versions)
CREATE TABLE instruments (
  instrument_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- e.g., "Pre-Course Assessment", "Post-Course Assessment"
  version TEXT NOT NULL, -- e.g., "1.0", "A", "B"
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'deprecated', 'archived'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assessment items/questions
CREATE TABLE items (
  item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_item_id TEXT, -- Original question ID from source CSV (e.g., "1", "2", ..., "40")
  domain TEXT NOT NULL, -- e.g., "Financial Planning", "Budgeting"
  subdomain TEXT NOT NULL, -- e.g., "Inflation", "Credit Cards"
  difficulty DECIMAL(3,2) NOT NULL CHECK (difficulty >= 0 AND difficulty <= 1),
  type TEXT NOT NULL, -- 'multiple_choice', 'short_answer', 'numeric'
  stem TEXT NOT NULL, -- The question text
  options JSONB, -- For multiple choice: [{"id": "a", "text": "Option A"}, ...]
  key TEXT, -- Correct answer (for auto-grading)
  rubric JSONB, -- Scoring rubric for short answers
  is_anchor BOOLEAN NOT NULL DEFAULT false, -- For linking pre/post scores
  is_active BOOLEAN NOT NULL DEFAULT false, -- Whether question is active
  is_scored BOOLEAN NOT NULL DEFAULT true, -- Whether item contributes to learning gain scores. Q15-Q28 are preference items (is_scored=false)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for external_item_id lookups
CREATE INDEX idx_items_external_item_id ON items(external_item_id);

-- Assessment attempts
CREATE TABLE attempts (
  attempt_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
  instrument_id UUID NOT NULL REFERENCES instruments(instrument_id) ON DELETE CASCADE,
  attempt_type TEXT NOT NULL, -- 'pre', 'post'
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  duration_s INTEGER, -- Total time spent
  metadata JSONB DEFAULT '{}', -- Anti-cheating metadata: tabSwitches, isFullscreen, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Student responses
CREATE TABLE responses (
  response_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES attempts(attempt_id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(item_id) ON DELETE CASCADE,
  raw_answer JSONB NOT NULL, -- Student's answer (text, selected option, etc.)
  score DECIMAL(5,2), -- Auto-calculated score (0-100)
  confidence INTEGER CHECK (confidence >= 1 AND confidence <= 3), -- Student's confidence: 1=Low, 2=Mid, 3=High
  ai_confidence DECIMAL(3,2), -- AI model's confidence in scoring (0-1)
  ai_flags JSONB, -- Additional AI analysis flags
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(attempt_id, item_id) -- One response per item per attempt
);

-- Calculated scores
CREATE TABLE scores (
  attempt_id UUID PRIMARY KEY REFERENCES attempts(attempt_id) ON DELETE CASCADE,
  overall DECIMAL(5,2) NOT NULL, -- Overall score (0-100)
  by_domain JSONB NOT NULL, -- Scores by domain: {"Financial Planning": 85, "Budgeting": 92}
  se_overall DECIMAL(5,2) NOT NULL, -- Standard error of overall score
  overconfidence_index DECIMAL(5,2), -- Confidence vs actual performance gap
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- STUDENT PROFILES: Demographic and Socio-economic Data
-- ============================================================================

-- Student profiles table for demographic and socio-economic data (migration-add-student-profiles.sql + migration-add-baseline-covariates.sql)
CREATE TABLE student_profiles (
  profile_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
  
  -- Contact information (migration-add-password-reset.sql)
  email TEXT,
  
  -- Baseline Demographic Characteristics (B1-B5)
  gender TEXT CHECK (gender IN ('female', 'male', 'prefer-not-to-say')), -- B1
  race_ethnicity TEXT, -- B2: 'White or Caucasian', 'Asian', 'Black or African American', 'Hispanic or Latino', 'Native Hawaiian or Pacific Islander', 'Native American or Alaska Native', 'Two or more racial or ethnic backgrounds', 'Other', 'Prefer not to say'
  age_range TEXT CHECK (age_range IN ('20-or-under', 'above-20', 'prefer-not-to-answer')), -- B3 (migration-add-baseline-covariates.sql)
  first_language TEXT CHECK (first_language IN ('english', 'spanish', 'chinese', 'french', 'russian', 'dutch', 'other', 'prefer-not-to-answer')), -- B4
  first_language_other TEXT, -- B4: Specification when 'other' is selected
  work_experience TEXT CHECK (work_experience IN ('no-work-experience', 'part-time', 'full-time', 'prefer-not-to-answer')), -- B5
  
  -- Baseline Financial Background & Context (B6-B8)
  prior_financial_products JSONB, -- B6: Array of selected products: ['credit-card', 'student-loan', 'auto-loan', 'investment-account', 'insurance', 'none']
  self_rated_financial_knowledge TEXT CHECK (self_rated_financial_knowledge IN ('very-low', 'low', 'moderate', 'high', 'very-high', 'prefer-not-to-answer')), -- B7
  financial_stress_frequency TEXT CHECK (financial_stress_frequency IN ('never', 'rarely', 'sometimes', 'often', 'always', 'prefer-not-to-answer')), -- B8
  
  -- Baseline Socio-economic data (B9-B10)
  parental_education TEXT CHECK (parental_education IN ('less-than-high-school', 'high-school-diploma-or-ged', 'some-college-no-degree', 'associate-degree', 'bachelors-degree', 'graduate-or-professional-degree', 'dont-know', 'prefer-not-to-answer')), -- B9
  first_generation_college TEXT CHECK (first_generation_college IN ('yes', 'no', 'prefer-not-to-say')), -- B10: First generation college student

  -- Baseline Student Loan Debt Status (B11-B13)
  has_student_loan_debt TEXT CHECK (has_student_loan_debt IN ('yes', 'no', 'prefer-not-to-say')), -- B11
  student_loan_interest_rate TEXT CHECK (student_loan_interest_rate IN ('less-than-5', 'between-5-and-10', 'above-10', 'do-not-know', 'prefer-not-to-say')), -- B12 (conditional on B11=yes)
  student_loan_maturity TEXT CHECK (student_loan_maturity IN ('less-or-equal-3-years', 'between-3-to-5-years', 'above-5-years', 'do-not-know', 'prefer-not-to-say')), -- B13 (conditional on B11=yes)

  -- Additional optional data (not part of core baseline)
  household_income TEXT CHECK (household_income IN ('under-25000', '25000-49999', '50000-74999', '75000-99999', '100000-149999', '150000-199999', '200000-plus', 'prefer-not-to-say')),
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

-- ============================================================================
-- PASSWORD RESET: Token-based Password Recovery
-- ============================================================================

-- Password reset tokens table (migration-add-password-reset.sql)
CREATE TABLE password_reset_tokens (
  token_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE, -- Secure random token
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure token is unique per user per course
  UNIQUE(user_id, course_id, token)
);

-- ============================================================================
-- INSTRUCTOR SCHEMA: Instructor Authentication and Management
-- ============================================================================

-- Instructors table
CREATE TABLE instructors (
  instructor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  hashed_password TEXT NOT NULL, -- bcrypt hash
  full_name TEXT NOT NULL,
  department TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE
);

-- Instructor-Course assignments
CREATE TABLE instructor_courses (
  instructor_id UUID REFERENCES instructors(instructor_id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(course_id) ON DELETE CASCADE,
  access_level TEXT NOT NULL DEFAULT 'view', -- 'view', 'edit', 'admin'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (instructor_id, course_id)
);

-- Instructor sessions (for dashboard authentication)
CREATE TABLE instructor_sessions (
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES instructors(instructor_id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES: Performance Optimization
-- ============================================================================

-- Base schema indexes
CREATE INDEX idx_attempts_user_course ON attempts(user_id, course_id);
CREATE INDEX idx_attempts_instrument ON attempts(instrument_id);
CREATE INDEX idx_responses_attempt ON responses(attempt_id);
CREATE INDEX idx_responses_item ON responses(item_id);
CREATE INDEX idx_items_domain ON items(domain);
CREATE INDEX idx_items_anchor ON items(is_anchor) WHERE is_anchor = true;
CREATE INDEX idx_items_is_active ON items(is_active) WHERE is_active = true;
CREATE INDEX idx_users_hashed_student_key ON users(hashed_student_key);

-- Student profiles indexes
CREATE INDEX idx_student_profiles_user ON student_profiles(user_id);
CREATE INDEX idx_student_profiles_course ON student_profiles(course_id);

-- Password reset indexes
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_user ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_expires ON password_reset_tokens(expires_at);

-- Instructor indexes
CREATE INDEX idx_instructor_sessions_token ON instructor_sessions(token);
CREATE INDEX idx_instructor_sessions_expires ON instructor_sessions(expires_at);
CREATE INDEX idx_instructor_courses_instructor ON instructor_courses(instructor_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS): Enable RLS on all tables
-- ============================================================================

-- Enable RLS on all tables for security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE instruments ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructor_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructor_sessions ENABLE ROW LEVEL SECURITY;

-- NOTE: RLS policies are managed at the application level for direct PostgreSQL
-- The application will handle authentication and authorization via connection roles
-- For Supabase, specific policies were defined in rls-policies.sql that use auth.role() and auth.uid()
-- For direct PostgreSQL, the application's database connection user will have appropriate permissions
-- and the application code enforces access control based on user roles

-- ============================================================================
-- COMMENTS: Documentation
-- ============================================================================

COMMENT ON TABLE users IS 'Stores hashed student identifiers only (FERPA compliant). No raw student IDs stored.';
COMMENT ON COLUMN users.hashed_student_key IS 'SHA256 hash of (course_pepper + student_id)';
COMMENT ON COLUMN users.hashed_password IS 'Bcrypt hashed password for student authentication. NULL if password not yet set.';

COMMENT ON TABLE courses IS 'Course information including pepper (salt) for hashing student IDs';
COMMENT ON COLUMN courses.pepper IS 'Random salt used to hash student IDs for this course';

COMMENT ON TABLE student_profiles IS 'Stores demographic and socio-economic data for students. FERPA compliant - linked to hashed user_id only.';
COMMENT ON COLUMN student_profiles.user_id IS 'References users table (hashed student key, no raw IDs)';
COMMENT ON COLUMN student_profiles.course_id IS 'Course context for the profile data';
COMMENT ON COLUMN student_profiles.age_range IS 'Baseline B3: Age range (20 or under, Above 20)';
COMMENT ON COLUMN student_profiles.first_language IS 'Baseline B4: First language';
COMMENT ON COLUMN student_profiles.first_language_other IS 'Baseline B4: Other language specification';
COMMENT ON COLUMN student_profiles.prior_financial_products IS 'Baseline B6: Prior financial products used (JSONB array)';
COMMENT ON COLUMN student_profiles.self_rated_financial_knowledge IS 'Baseline B7: Self-rated financial knowledge before course';
COMMENT ON COLUMN student_profiles.financial_stress_frequency IS 'Baseline B8: Frequency of financial stress';

COMMENT ON TABLE password_reset_tokens IS 'Stores temporary tokens for password reset. Tokens expire after 1 hour.';
COMMENT ON COLUMN password_reset_tokens.token IS 'Secure random token for password reset';
COMMENT ON COLUMN password_reset_tokens.expires_at IS 'Token expiration time (typically 1 hour from creation)';
COMMENT ON COLUMN password_reset_tokens.used_at IS 'Timestamp when token was used (null if unused)';

COMMENT ON TABLE items IS 'Assessment questions/items with domain, difficulty, type, and scoring information';
COMMENT ON COLUMN items.is_active IS 'Whether this question is active and available for use in assessments';

COMMENT ON TABLE instructors IS 'Instructor accounts with password-based authentication';
COMMENT ON TABLE instructor_courses IS 'Links instructors to courses they can manage';
COMMENT ON TABLE instructor_sessions IS 'Session tokens for instructor dashboard authentication';

-- Plan B: Google Forms fallback settings per course
CREATE TABLE IF NOT EXISTS plan_b_settings (
  setting_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT false,
  active_level TEXT CHECK (active_level IN ('full', 'assessment_only', 'minimal')),
  url_full TEXT,
  url_assessment_only TEXT,
  url_minimal TEXT,
  updated_by UUID REFERENCES instructors(instructor_id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(course_id)
);

CREATE INDEX IF NOT EXISTS idx_plan_b_settings_course_id ON plan_b_settings(course_id);
COMMENT ON TABLE plan_b_settings IS 'Google Forms fallback settings per course, managed by instructors';
