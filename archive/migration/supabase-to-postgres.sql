-- Financial Literacy Assessment Database Schema
-- Adapted for direct PostgreSQL (removed Supabase-specific features)
-- FERPA Compliant: No raw student IDs stored, only hashed keys

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable gen_random_uuid() function (PostgreSQL 13+)
-- If using older PostgreSQL, use uuid_generate_v4() from uuid-ossp instead

-- Users table (hashed student identifiers only)
CREATE TABLE IF NOT EXISTS users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hashed_student_key TEXT NOT NULL UNIQUE, -- SHA256(course_pepper + student_id)
  sso_provider TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
  course_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  term TEXT NOT NULL, -- e.g., "Fall 2025"
  pepper TEXT NOT NULL UNIQUE, -- Random salt for hashing student IDs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Course enrollments
CREATE TABLE IF NOT EXISTS enrollments (
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(course_id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'student', -- 'student', 'instructor', 'admin'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, course_id)
);

-- Assessment instruments (forms/versions)
CREATE TABLE IF NOT EXISTS instruments (
  instrument_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- e.g., "Pre-Course Assessment", "Post-Course Assessment"
  version TEXT NOT NULL, -- e.g., "1.0", "A", "B"
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'deprecated', 'archived'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assessment items/questions
CREATE TABLE IF NOT EXISTS items (
  item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL, -- e.g., "Financial Planning", "Budgeting"
  subdomain TEXT NOT NULL, -- e.g., "Inflation", "Credit Cards"
  difficulty DECIMAL(3,2) NOT NULL CHECK (difficulty >= 0 AND difficulty <= 1),
  type TEXT NOT NULL, -- 'multiple_choice', 'short_answer', 'numeric'
  stem TEXT NOT NULL, -- The question text
  options JSONB, -- For multiple choice: [{"id": "a", "text": "Option A"}, ...]
  key TEXT, -- Correct answer (for auto-grading)
  rubric JSONB, -- Scoring rubric for short answers
  is_anchor BOOLEAN NOT NULL DEFAULT false, -- For linking pre/post scores
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assessment attempts
CREATE TABLE IF NOT EXISTS attempts (
  attempt_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
  instrument_id UUID NOT NULL REFERENCES instruments(instrument_id) ON DELETE CASCADE,
  attempt_type TEXT NOT NULL, -- 'pre', 'post'
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  duration_s INTEGER, -- Total time spent
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Student responses
CREATE TABLE IF NOT EXISTS responses (
  response_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES attempts(attempt_id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(item_id) ON DELETE CASCADE,
  raw_answer JSONB NOT NULL, -- Student's answer (text, selected option, etc.)
  score DECIMAL(5,2), -- Auto-calculated score (0-100)
  confidence INTEGER CHECK (confidence >= 1 AND confidence <= 5), -- Student's confidence 1-5
  ai_confidence DECIMAL(3,2), -- AI model's confidence in scoring (0-1)
  ai_flags JSONB, -- Additional AI analysis flags
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(attempt_id, item_id) -- One response per item per attempt
);

-- Calculated scores
CREATE TABLE IF NOT EXISTS scores (
  attempt_id UUID PRIMARY KEY REFERENCES attempts(attempt_id) ON DELETE CASCADE,
  overall DECIMAL(5,2) NOT NULL, -- Overall score (0-100)
  by_domain JSONB NOT NULL, -- Scores by domain: {"Financial Planning": 85, "Budgeting": 92}
  se_overall DECIMAL(5,2) NOT NULL, -- Standard error of overall score
  overconfidence_index DECIMAL(5,2), -- Confidence vs actual performance gap
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_attempts_user_course ON attempts(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_attempts_instrument ON attempts(instrument_id);
CREATE INDEX IF NOT EXISTS idx_responses_attempt ON responses(attempt_id);
CREATE INDEX IF NOT EXISTS idx_responses_item ON responses(item_id);
CREATE INDEX IF NOT EXISTS idx_items_domain ON items(domain);
CREATE INDEX IF NOT EXISTS idx_items_anchor ON items(is_anchor) WHERE is_anchor = true;

-- Row Level Security (RLS) - Essential for FERPA compliance
-- RLS will be enabled, but policies will be created in migrate-rls-policies.sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE instruments ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

-- Add instructor tables if they exist in the schema
-- These are from infra/instructor-schema.sql
CREATE TABLE IF NOT EXISTS instructors (
  instructor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  hashed_password TEXT NOT NULL, -- bcrypt hash
  full_name TEXT NOT NULL,
  department TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS instructor_courses (
  instructor_id UUID REFERENCES instructors(instructor_id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(course_id) ON DELETE CASCADE,
  access_level TEXT NOT NULL DEFAULT 'view', -- 'view', 'edit', 'admin'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (instructor_id, course_id)
);

CREATE TABLE IF NOT EXISTS instructor_sessions (
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES instructors(instructor_id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for instructor tables
CREATE INDEX IF NOT EXISTS idx_instructor_sessions_token ON instructor_sessions(token);
CREATE INDEX IF NOT EXISTS idx_instructor_sessions_expires ON instructor_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_instructor_courses_instructor ON instructor_courses(instructor_id);

-- Enable RLS on instructor tables
ALTER TABLE instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructor_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructor_sessions ENABLE ROW LEVEL SECURITY;

-- Comments for documentation
COMMENT ON TABLE users IS 'FERPA-compliant user table storing only hashed student identifiers';
COMMENT ON TABLE courses IS 'Course information with unique peppers for hashing student IDs';
COMMENT ON TABLE enrollments IS 'User-course enrollment relationships';
COMMENT ON TABLE instruments IS 'Assessment instruments (pre/post assessments)';
COMMENT ON TABLE items IS 'Assessment questions/items';
COMMENT ON TABLE attempts IS 'Student assessment attempts';
COMMENT ON TABLE responses IS 'Individual question responses from students';
COMMENT ON TABLE scores IS 'Calculated scores for assessment attempts';



