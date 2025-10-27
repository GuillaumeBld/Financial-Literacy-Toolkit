-- Instructor Authentication and Management
-- Simple password-based auth for instructors (not students)

-- Instructors table
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

-- Instructor-Course assignments
CREATE TABLE IF NOT EXISTS instructor_courses (
  instructor_id UUID REFERENCES instructors(instructor_id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(course_id) ON DELETE CASCADE,
  access_level TEXT NOT NULL DEFAULT 'view', -- 'view', 'edit', 'admin'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (instructor_id, course_id)
);

-- Instructor sessions (for dashboard authentication)
CREATE TABLE IF NOT EXISTS instructor_sessions (
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES instructors(instructor_id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_instructor_sessions_token ON instructor_sessions(token);
CREATE INDEX idx_instructor_sessions_expires ON instructor_sessions(expires_at);
CREATE INDEX idx_instructor_courses_instructor ON instructor_courses(instructor_id);

-- Enable RLS
ALTER TABLE instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructor_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructor_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for service role (API access)
CREATE POLICY "Service role can manage instructors"
  ON instructors
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage instructor courses"
  ON instructor_courses
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage instructor sessions"
  ON instructor_sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
