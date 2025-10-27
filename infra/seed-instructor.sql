-- Seed test instructor account
-- Password: "instructor123" (SHA256 hash - REPLACE WITH BCRYPT IN PRODUCTION)

INSERT INTO instructors (email, hashed_password, full_name, department, is_active)
VALUES (
  'instructor@university.edu',
  'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', -- SHA256 of "instructor123"
  'Dr. Test Instructor',
  'Finance',
  true
)
ON CONFLICT (email) DO NOTHING;

-- Link instructor to Financial Literacy course
INSERT INTO instructor_courses (instructor_id, course_id, access_level)
SELECT 
  i.instructor_id,
  c.course_id,
  'admin'
FROM instructors i
CROSS JOIN courses c
WHERE i.email = 'instructor@university.edu'
  AND c.name = 'Financial Literacy'
ON CONFLICT (instructor_id, course_id) DO NOTHING;
