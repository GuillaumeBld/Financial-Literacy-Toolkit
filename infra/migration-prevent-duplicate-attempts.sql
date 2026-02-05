-- Migration: Prevent duplicate in-progress attempts (TOCTOU race condition fix)
-- Date: 2026-02-05
-- Issue: Race condition allowed multiple concurrent requests to create duplicate attempts
--
-- Root cause: The SELECT-then-INSERT pattern in save/route.ts and submit/route.ts
-- is not atomic. Multiple requests could pass the "check for existing" step before
-- any INSERT commits, resulting in duplicate attempts.
--
-- Fix: Add a partial unique index that enforces at most one in-progress attempt
-- per user/course/instrument combination. Combined with INSERT ... ON CONFLICT
-- in the application code, this makes find-or-create atomic.

-- Add partial unique index (only applies to rows where submitted_at IS NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_attempts_single_in_progress
ON attempts (user_id, course_id, instrument_id)
WHERE submitted_at IS NULL;

-- Verify the index was created
-- SELECT indexname, indexdef FROM pg_indexes WHERE indexname = 'idx_attempts_single_in_progress';
