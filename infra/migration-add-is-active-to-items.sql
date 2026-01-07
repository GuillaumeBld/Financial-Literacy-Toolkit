-- Migration: Add is_active field to items table
-- This allows questions to be entered but not activated for use in assessments

-- Add is_active column to items table
ALTER TABLE items
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT false;

-- Add index for performance when filtering active questions
CREATE INDEX IF NOT EXISTS idx_items_is_active ON items(is_active) WHERE is_active = true;

-- Add comment for documentation
COMMENT ON COLUMN items.is_active IS 'Whether this question is active and available for use in assessments';

