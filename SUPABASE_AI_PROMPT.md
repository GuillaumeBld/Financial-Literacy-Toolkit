# 🚀 Supabase AI Assistant Setup Prompt

**Copy and paste this entire prompt into Supabase's AI Assistant:**

---

## 🎓 Financial Literacy Assessment Database Setup

I need help setting up a complete database schema for a FERPA-compliant educational assessment platform. Please execute the following SQL in order and help me troubleshoot any issues.

### 📋 Context
- **Institution**: L. University, Quinlan School of Business
- **Purpose**: Pre and post financial literacy assessments
- **Compliance**: FERPA (no raw student IDs stored)
- **Tech Stack**: Next.js, Supabase, PostgreSQL

### 🗄️ Step 1: Create Database Schema

Execute this SQL to create all tables with Row Level Security:

```sql
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
```

### 🧪 Step 2: Add Sample Data

After the schema is created, execute this seed data:

```sql
-- Seed Data for Financial Literacy Assessment
-- This creates a sample course and questions for testing

-- Insert sample course
INSERT INTO courses (course_id, name, term, pepper) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Financial Literacy', 'Fall 2025', 'course_pepper_salt_123456789');

-- Insert sample instruments
INSERT INTO instruments (instrument_id, name, version, status) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Pre-Course Assessment', '1.0', 'active'),
('550e8400-e29b-41d4-a716-446655440002', 'Post-Course Assessment', '1.0', 'active');

-- Insert sample questions
INSERT INTO items (item_id, domain, subdomain, difficulty, type, stem, options, key, rubric, is_anchor) VALUES
-- Question 1: Multiple Choice
('550e8400-e29b-41d4-a716-446655440010', 'Financial Planning', 'Inflation', 0.3, 'multiple_choice',
'If inflation increases while your income stays the same, your purchasing power will:',
'[
  {"id": "a", "text": "Increase"},
  {"id": "b", "text": "Stay the same"},
  {"id": "c", "text": "Decrease"},
  {"id": "d", "text": "Become unpredictable"}
]',
'c',
NULL,
true),

-- Question 2: Multiple Choice
('550e8400-e29b-41d4-a716-446655440011', 'Budgeting', 'Expense Tracking', 0.2, 'multiple_choice',
'What is the primary purpose of a budget?',
'[
  {"id": "a", "text": "To track income and expenses"},
  {"id": "b", "text": "To limit spending"},
  {"id": "c", "text": "To save money on taxes"},
  {"id": "d", "text": "To get approved for loans"}
]',
'a',
NULL,
false),

-- Question 3: Short Answer
('550e8400-e29b-41d4-a716-446655440012', 'Credit Management', 'Credit Cards', 0.4, 'short_answer',
'Explain the difference between a debit card and a credit card.',
NULL,
NULL,
'{
  "criteria": [
    {"name": "Understanding of Debit Cards", "description": "Correctly explains that debit cards withdraw directly from checking account", "points": 25},
    {"name": "Understanding of Credit Cards", "description": "Correctly explains that credit cards borrow money to be paid back later", "points": 25},
    {"name": "Key Differences", "description": "Clearly articulates main differences (timing of payment, interest, credit building)", "points": 30},
    {"name": "Clarity", "description": "Response is clear and well-organized", "points": 20}
  ],
  "total_points": 100
}',
false);

-- Sample hashed student keys (for testing)
INSERT INTO users (user_id, hashed_student_key, sso_provider) VALUES
('660e8400-e29b-41d4-a716-446655440000', 'test_student_001_hash', 'hashed'),
('660e8400-e29b-41d4-a716-446655440001', 'test_student_002_hash', 'hashed');

-- Enroll students in course
INSERT INTO enrollments (user_id, course_id, role) VALUES
('660e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', 'student'),
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'student');

-- Sample completed assessment
INSERT INTO attempts (attempt_id, user_id, course_id, instrument_id, attempt_type, started_at, submitted_at, duration_s) VALUES
('770e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', 'pre', '2025-01-15 10:00:00+00', '2025-01-15 10:25:00+00', 1500);

-- Sample responses
INSERT INTO responses (response_id, attempt_id, item_id, raw_answer, score, confidence, ai_confidence) VALUES
('880e8400-e29b-41d4-a716-446655440000', '770e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440010', '"c"', 100, 4, 0.95),
('880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440011', '"a"', 100, 5, 0.98),
('880e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440012', '"A debit card takes money directly from your checking account, while a credit card allows you to borrow money and pay it back later."', 85, 3, 0.82);

-- Sample calculated scores
INSERT INTO scores (attempt_id, overall, by_domain, se_overall, overconfidence_index) VALUES
('770e8400-e29b-41d4-a716-446655440000', 95.0,
'{"Financial Planning": 100, "Budgeting": 100, "Credit Management": 85}',
2.5,
-0.2,
NOW());
```

### ✅ Step 3: Verify Setup

After running both SQL scripts, help me verify everything is working:

1. **Check tables were created**: Query `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`
2. **Check RLS is enabled**: Query `SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';`
3. **Check sample data**: Query `SELECT * FROM courses;` and `SELECT * FROM items;`
4. **Verify relationships**: Try some JOIN queries to ensure foreign keys work

### 🔍 Expected Results
- **Tables created**: users, courses, enrollments, instruments, items, attempts, responses, scores
- **RLS enabled**: All tables should show `rowsecurity = t`
- **Sample data**: 1 course, 3 questions, 2 users, 1 completed assessment
- **No errors**: All SQL should execute successfully

### 🆘 Troubleshooting
If you encounter any errors, please:
1. Show me the exact error message
2. Suggest a fix
3. Help me re-run the corrected SQL

### 🎯 Final Goal
After setup, I should be able to run my Next.js assessment app and have students complete assessments that save to this database while maintaining FERPA compliance.

---

**Please execute the schema SQL first, then the seed data, then help me verify everything is working correctly!**</content>
<parameter name="path">/Users/guillaumebld/Documents/Graduate_Research/Professor Abol Jalilvand/fall2025/Financial literacy- abol paper/SUPABASE_AI_PROMPT.md


---

## 🔍 QUICK VERIFICATION (If Database Already Exists)

If you think the database might already be set up, run these verification queries instead:

### Check if tables exist:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('users', 'courses', 'enrollments', 'instruments', 'items', 'attempts', 'responses', 'scores');
```

### Check if sample data exists:
```sql
-- Should return 1 course
SELECT name, term FROM courses WHERE name = 'Financial Literacy';

-- Should return 3 questions
SELECT domain, type, stem FROM items ORDER BY created_at;

-- Should return 2 users
SELECT user_id, hashed_student_key FROM users;
```

### Check RLS status:
```sql
SELECT schemaname, tablename, rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('users', 'courses', 'enrollments', 'instruments', 'items', 'attempts', 'responses', 'scores')
ORDER BY tablename;
```

### If verification shows missing tables/data:
**Then run the full setup above.**

### If verification shows everything exists:
**Great! The database is ready. Tell me "DATABASE READY" and we'll test the app.**

---

**Copy this section and add it to your existing prompt, or run the verification queries directly if you think setup is already done!**</content>
<parameter name="path">/Users/guillaumebld/Documents/Graduate_Research/Professor Abol Jalilvand/fall2025/Financial literacy- abol paper/QUICK_VERIFY_PROMPT.md