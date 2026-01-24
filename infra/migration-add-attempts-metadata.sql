-- Migration: Add metadata column to attempts table for anti-cheating tracking
-- This column stores tab switches, fullscreen status, and other behavioral data

ALTER TABLE attempts ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

COMMENT ON COLUMN attempts.metadata IS 'Anti-cheating metadata: tabSwitches, isFullscreen, etc.';
