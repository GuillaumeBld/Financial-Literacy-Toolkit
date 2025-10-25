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
-- In production, these would be: SHA256(course_pepper + student_id)
INSERT INTO users (user_id, hashed_student_key, sso_provider) VALUES
('660e8400-e29b-41d4-a716-446655440000', 'test_student_001_hash', 'hashed'),
('660e8400-e29b-41d4-a716-446655440001', 'test_student_002_hash', 'hashed');

-- Enroll students in course
INSERT INTO enrollments (user_id, course_id, role) VALUES
('660e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', 'student'),
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'student');

-- Sample completed assessment (for testing instructor dashboard)
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
NOW());</content>
<parameter name="path">/Users/guillaumebld/Documents/Graduate_Research/Professor Abol Jalilvand/fall2025/Financial literacy- abol paper/infra/seed.sql