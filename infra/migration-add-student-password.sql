-- Migration: Add password authentication for students
-- Allows students to log in with student ID + password for pre and post assessments

-- Add password field to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS hashed_password TEXT;

-- Add index for faster lookups (though we'll still use hashed_student_key for primary lookup)
CREATE INDEX IF NOT EXISTS idx_users_hashed_student_key ON users(hashed_student_key);

-- Add comment
COMMENT ON COLUMN users.hashed_password IS 'Bcrypt hashed password for student authentication. NULL if password not yet set.';

