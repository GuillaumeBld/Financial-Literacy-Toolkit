-- Migration: Backfill Overconfidence Index for existing submissions
-- Date: 2026-02-04
-- Description: Calculate and update OC values for all existing scores that have OC = 0
--
-- Formula: OC = avg(normalized_confidence) - avg(actual_correctness)
-- normalized_confidence: (confidence - 1) / 2 maps 1-3 scale to 0-1
-- actual_correctness: 1 if answer matches key, 0 otherwise
--
-- Positive OC = overconfident (high confidence, low accuracy)
-- Negative OC = underconfident (low confidence, high accuracy)
-- Near zero = well-calibrated

UPDATE scores s
SET overconfidence_index = calc.oc
FROM (
  SELECT
    r.attempt_id,
    AVG((r.confidence - 1)::float / 2) -
    AVG(CASE WHEN TRIM(BOTH '"' FROM r.raw_answer::text) = i.key THEN 1 ELSE 0 END)::float as oc
  FROM responses r
  JOIN items i ON r.item_id = i.item_id
  WHERE i.is_scored = true
    AND r.confidence IS NOT NULL
  GROUP BY r.attempt_id
) calc
WHERE s.attempt_id = calc.attempt_id
  AND s.overconfidence_index = 0;

-- Verify the update
SELECT
  COUNT(*) as total_scores,
  COUNT(CASE WHEN overconfidence_index = 0 THEN 1 END) as still_zero,
  COUNT(CASE WHEN overconfidence_index > 0 THEN 1 END) as overconfident,
  COUNT(CASE WHEN overconfidence_index < 0 THEN 1 END) as underconfident,
  ROUND(AVG(overconfidence_index)::numeric, 3) as avg_oc,
  ROUND(MIN(overconfidence_index)::numeric, 3) as min_oc,
  ROUND(MAX(overconfidence_index)::numeric, 3) as max_oc
FROM scores;
