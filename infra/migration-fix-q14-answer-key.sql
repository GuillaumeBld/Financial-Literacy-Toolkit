-- Migration: Fix Q14 answer key trailing period
-- Q14 ("When an investor spreads money among different assets...") has key = 'B.'
-- instead of 'B'. Any student answering correctly gets 0 points.
-- Date: 2026-01-31

BEGIN;

-- Fix the trailing period on Q14's answer key
UPDATE items
   SET key = 'B'
 WHERE item_id = 'Q14'
   AND key = 'B.';

-- Re-score any Q14 responses that answered 'B' but received 0 points
UPDATE responses
   SET score = 100.00
 WHERE item_id = 'Q14'
   AND raw_answer->>'answer' = 'B'
   AND score = 0.00;

COMMIT;
