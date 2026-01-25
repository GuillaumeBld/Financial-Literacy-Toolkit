-- Load Test Data Cleanup Script
-- Run this AFTER load testing to remove synthetic test data
-- IMPORTANT: Review the WHERE clauses before running in production!

-- This script removes data created by load tests (identified by 'loadtest-' prefix)
-- It preserves all real student/user data

BEGIN;

-- 1. Show what will be deleted (DRY RUN - review before committing)
SELECT 'Responses to delete:' as info, COUNT(*) as count
FROM responses r
JOIN attempts a ON r.attempt_id = a.attempt_id
JOIN users u ON a.user_id = u.user_id
WHERE u.hashed_student_key LIKE 'loadtest-%';

SELECT 'Scores to delete:' as info, COUNT(*) as count
FROM scores s
JOIN attempts a ON s.attempt_id = a.attempt_id
JOIN users u ON a.user_id = u.user_id
WHERE u.hashed_student_key LIKE 'loadtest-%';

SELECT 'Attempts to delete:' as info, COUNT(*) as count
FROM attempts a
JOIN users u ON a.user_id = u.user_id
WHERE u.hashed_student_key LIKE 'loadtest-%';

SELECT 'Enrollments to delete:' as info, COUNT(*) as count
FROM enrollments e
JOIN users u ON e.user_id = u.user_id
WHERE u.hashed_student_key LIKE 'loadtest-%';

SELECT 'Users to delete:' as info, COUNT(*) as count
FROM users
WHERE hashed_student_key LIKE 'loadtest-%';

-- 2. Delete in correct order (respecting foreign keys)

-- Delete responses first (references attempts)
DELETE FROM responses
WHERE attempt_id IN (
  SELECT a.attempt_id
  FROM attempts a
  JOIN users u ON a.user_id = u.user_id
  WHERE u.hashed_student_key LIKE 'loadtest-%'
);

-- Delete scores (references attempts)
DELETE FROM scores
WHERE attempt_id IN (
  SELECT a.attempt_id
  FROM attempts a
  JOIN users u ON a.user_id = u.user_id
  WHERE u.hashed_student_key LIKE 'loadtest-%'
);

-- Delete attempts (references users)
DELETE FROM attempts
WHERE user_id IN (
  SELECT user_id FROM users WHERE hashed_student_key LIKE 'loadtest-%'
);

-- Delete enrollments (references users)
DELETE FROM enrollments
WHERE user_id IN (
  SELECT user_id FROM users WHERE hashed_student_key LIKE 'loadtest-%'
);

-- Delete student profiles if they exist (references users)
DELETE FROM student_profiles
WHERE user_id IN (
  SELECT user_id FROM users WHERE hashed_student_key LIKE 'loadtest-%'
);

-- Finally delete the test users
DELETE FROM users
WHERE hashed_student_key LIKE 'loadtest-%';

-- 3. Verify cleanup
SELECT 'Remaining load test users:' as info, COUNT(*) as count
FROM users WHERE hashed_student_key LIKE 'loadtest-%';

-- COMMIT only after reviewing the counts above
-- Uncomment the next line when ready:
COMMIT;

-- To rollback instead (if something looks wrong):
-- ROLLBACK;
