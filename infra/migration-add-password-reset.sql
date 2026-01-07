-- Migration: Add password reset functionality
-- Supports token-based password recovery

-- Add email field to student_profiles for password recovery (required)
ALTER TABLE student_profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Make email required (NOT NULL) for new records
-- Note: For existing records, you may need to update them first before adding the constraint
-- ALTER TABLE student_profiles ALTER COLUMN email SET NOT NULL;

-- Create password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  token_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE, -- Secure random token
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure token is unique per user per course
  UNIQUE(user_id, course_id, token)
);

-- Indexes for performance
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_user ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_expires ON password_reset_tokens(expires_at);

-- Enable Row Level Security
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Clean up expired tokens (can be run periodically)
-- DELETE FROM password_reset_tokens WHERE expires_at < NOW();

COMMENT ON TABLE password_reset_tokens IS 'Stores temporary tokens for password reset. Tokens expire after 1 hour.';
COMMENT ON COLUMN password_reset_tokens.token IS 'Secure random token for password reset';
COMMENT ON COLUMN password_reset_tokens.expires_at IS 'Token expiration time (typically 1 hour from creation)';
COMMENT ON COLUMN password_reset_tokens.used_at IS 'Timestamp when token was used (null if unused)';

