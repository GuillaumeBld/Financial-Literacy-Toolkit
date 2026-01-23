-- Migration: Update confidence scale from 1-5 to 1-3 and add is_scored column
-- This aligns with the source of truth: confidence is 1 (Low), 2 (Mid), 3 (High)
-- Q15-Q28 are preference items that should not be scored

-- 1. Update confidence constraint from 1-5 to 1-3
ALTER TABLE responses DROP CONSTRAINT IF EXISTS responses_confidence_check;
ALTER TABLE responses ADD CONSTRAINT responses_confidence_check CHECK (confidence >= 1 AND confidence <= 3);

-- 2. Add is_scored column to items table (default true for backward compatibility)
-- Q1-Q14 and Q29-Q40 are scored knowledge items (is_scored = true)
-- Q15-Q28 are preference items used as covariates (is_scored = false)
ALTER TABLE items ADD COLUMN IF NOT EXISTS is_scored BOOLEAN NOT NULL DEFAULT true;

-- 3. Add external_item_id column to store original question IDs (1-40) from source CSV
ALTER TABLE items ADD COLUMN IF NOT EXISTS external_item_id TEXT;

-- 4. Create index for external_item_id lookups
CREATE INDEX IF NOT EXISTS idx_items_external_item_id ON items(external_item_id);

-- 5. Add comment explaining the columns
COMMENT ON COLUMN items.is_scored IS 'Whether this item contributes to learning gain scores. Q15-Q28 are preference items (is_scored=false).';
COMMENT ON COLUMN items.external_item_id IS 'Original question ID from source CSV (e.g., "1", "2", ..., "40")';
