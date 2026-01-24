-- Performance Indexes for 500 Concurrent User Scaling
-- Run with CONCURRENTLY to avoid locking production tables
-- Execute each CREATE INDEX separately to avoid long locks

-- 1. Composite index for checking existing attempts (most frequent query during submission)
-- Used by: SELECT attempt_id FROM attempts WHERE user_id = $1 AND course_id = $2 AND instrument_id = $3 AND attempt_type = $4 AND submitted_at IS NOT NULL
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attempts_user_course_instrument_type
ON attempts(user_id, course_id, instrument_id, attempt_type)
WHERE submitted_at IS NOT NULL;

-- 2. Covering index for response lookups during scoring
-- Includes score, raw_answer, confidence to avoid heap lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_responses_attempt_item_score
ON responses(attempt_id, item_id) INCLUDE (score, raw_answer, confidence);

-- 3. Index for item lookups during batch scoring
-- Includes type, key, is_scored for covering index benefit
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_items_scoring
ON items(item_id) INCLUDE (type, key, is_scored);

-- 4. Case-insensitive course lookup (used by findCourseByName)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_courses_name_lower
ON courses(LOWER(name));

-- 5. Instructor dashboard queries - submitted attempts by course
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attempts_course_submitted
ON attempts(course_id, submitted_at DESC)
WHERE submitted_at IS NOT NULL;

-- 6. Index for student profile lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_student_profiles_user_course
ON student_profiles(user_id, course_id);

-- Update table statistics for query planner
ANALYZE attempts;
ANALYZE responses;
ANALYZE items;
ANALYZE courses;
ANALYZE student_profiles;
