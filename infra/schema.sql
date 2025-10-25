-- Financial Literacy Assessment Database Schema
-- FERPA Compliant: No raw student IDs stored, only hashed keys

-- Users table (hashed student identifiers only)
CREATE TABLE users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hashed_student_key TEXT NOT NULL UNIQUE, -- SHA256(course_pepper + student_id)
  sso_provider TEXT,
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
CREATE TABLE attempts (
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
CREATE TABLE responses (
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
CREATE TABLE scores (
  attempt_id UUID PRIMARY KEY REFERENCES attempts(attempt_id) ON DELETE CASCADE,
  overall DECIMAL(5,2) NOT NULL, -- Overall score (0-100)
  by_domain JSONB NOT NULL, -- Scores by domain: {"Financial Planning": 85, "Budgeting": 92}
  se_overall DECIMAL(5,2) NOT NULL, -- Standard error of overall score
  overconfidence_index DECIMAL(5,2), -- Confidence vs actual performance gap
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_attempts_user_course ON attempts(user_id, course_id);
CREATE INDEX idx_attempts_instrument ON attempts(instrument_id);
CREATE INDEX idx_responses_attempt ON responses(attempt_id);
CREATE INDEX idx_responses_item ON responses(item_id);
CREATE INDEX idx_items_domain ON items(domain);
CREATE INDEX idx_items_anchor ON items(is_anchor) WHERE is_anchor = true;

-- Row Level Security (RLS) - Essential for FERPA compliance
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE instruments ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies will be added after authentication setup</content>
<parameter name="path">/Users/guillaumebld/Documents/Graduate_Research/Professor Abol Jalilvand/fall2025/Financial literacy- abol paper/infra/schema.sql