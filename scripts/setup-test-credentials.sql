-- Setup Test Credentials Script
-- This script creates test credentials for both instructor and student

-- Test Instructor Credentials
-- Email: test.instructor@university.edu
-- Password: TestInstructor123!

-- Create or update test instructor
INSERT INTO instructors (email, hashed_password, full_name, department, is_active)
VALUES (
  'test.instructor@university.edu',
  '1db998c13806ae96aa2e96167babf5c6172f483fde69d523de2a4abe49e81ecf', -- SHA256 of 'TestInstructor123!'
  'Test Instructor',
  'Finance',
  true
)
ON CONFLICT (email) DO UPDATE SET
  hashed_password = EXCLUDED.hashed_password,
  full_name = EXCLUDED.full_name,
  department = EXCLUDED.department,
  is_active = true;

-- Link instructor to Financial Literacy course (if it exists)
INSERT INTO instructor_courses (instructor_id, course_id, access_level)
SELECT 
  i.instructor_id,
  c.course_id,
  'admin'
FROM instructors i
CROSS JOIN courses c
WHERE i.email = 'test.instructor@university.edu'
  AND c.name = 'Financial Literacy'
ON CONFLICT (instructor_id, course_id) DO UPDATE SET access_level = 'admin';

-- Test Student Credentials
-- Course Code: Financial Literacy
-- Student ID: 123456789

-- Enable pgcrypto extension for SHA256 hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- First, ensure the course exists (if not, create it)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM courses WHERE name = 'Financial Literacy') THEN
    INSERT INTO courses (name, term, pepper)
    VALUES ('Financial Literacy', 'Fall 2025', 'test_course_pepper_12345678901234567890');
  END IF;
END $$;

-- Get the course pepper for hashing
DO $$
DECLARE
  course_pepper TEXT;
  student_id TEXT := '123456789';
  hashed_key TEXT;
  user_uuid UUID;
  course_uuid UUID;
BEGIN
  -- Get course pepper
  SELECT pepper, course_id INTO course_pepper, course_uuid
  FROM courses
  WHERE name = 'Financial Literacy'
  LIMIT 1;
  
  IF course_pepper IS NULL THEN
    RAISE EXCEPTION 'Course "Financial Literacy" not found';
  END IF;
  
  -- Create hashed student key: SHA256(course_pepper + student_id)
  -- Note: PostgreSQL doesn't have SHA256 built-in, so we'll use a placeholder
  -- The actual hashing should be done in the application
  -- For now, we'll create a deterministic test key
  hashed_key := encode(digest(course_pepper || student_id, 'sha256'), 'hex');
  
  -- Create or get user
  INSERT INTO users (hashed_student_key, sso_provider)
  VALUES (hashed_key, 'test')
  ON CONFLICT (hashed_student_key) DO NOTHING
  RETURNING user_id INTO user_uuid;
  
  -- If user already exists, get the ID
  IF user_uuid IS NULL THEN
    SELECT user_id INTO user_uuid
    FROM users
    WHERE hashed_student_key = hashed_key;
  END IF;
  
  -- Enroll student in course
  INSERT INTO enrollments (user_id, course_id, role)
  VALUES (user_uuid, course_uuid, 'student')
  ON CONFLICT (user_id, course_id) DO NOTHING;
  
  RAISE NOTICE 'Student setup complete. User ID: %, Course ID: %', user_uuid, course_uuid;
END $$;

-- Display summary
SELECT 
  'INSTRUCTOR CREDENTIALS' as credential_type,
  email as identifier,
  full_name as name,
  'test.instructor@university.edu' as email,
  'TestInstructor123!' as password
FROM instructors
WHERE email = 'test.instructor@university.edu'

UNION ALL

SELECT 
  'STUDENT CREDENTIALS' as credential_type,
  'Financial Literacy' as identifier,
  '123456789' as name,
  'Course Code: Financial Literacy' as email,
  'Student ID: 123456789' as password;

