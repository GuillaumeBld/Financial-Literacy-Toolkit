-- Migration: Activate SDM items
-- Run this if SDM questions are not appearing in assessments

-- Activate all SDM items that have a valid anchor linkage
UPDATE items
SET is_active = true
WHERE is_sdm = true
  AND anchor_item_id IS NOT NULL;

-- Verify: Check how many SDM items are now active
SELECT
  COUNT(*) as total_sdm,
  COUNT(*) FILTER (WHERE is_active = true) as active_sdm,
  COUNT(*) FILTER (WHERE anchor_item_id IS NOT NULL) as linked_to_anchor
FROM items
WHERE is_sdm = true;

-- Show a summary by trigger condition
SELECT
  trigger_condition,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE is_active = true) as active_count
FROM items
WHERE is_sdm = true
GROUP BY trigger_condition
ORDER BY count DESC;
