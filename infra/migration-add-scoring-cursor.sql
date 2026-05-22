-- Migration: Add scoring cursor for checkpoint/resume in SDM scoring pipeline
-- Single-row table that tracks progress of the SDM scorer script.
-- Cleared on clean completion; persists across interruptions for resume.

CREATE TABLE IF NOT EXISTS scoring_cursor (
  run_key TEXT PRIMARY KEY,                              -- constant: 'sdm_scorer'
  last_completed_response_id UUID,                       -- response_id of last processed row
  last_completed_created_at TIMESTAMP WITH TIME ZONE,    -- created_at of last processed row (for keyset pagination)
  run_started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  responses_scored INTEGER NOT NULL DEFAULT 0,
  responses_errored INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE scoring_cursor IS 'Single-row checkpoint for SDM scoring pipeline. Cleared on clean completion.';
COMMENT ON COLUMN scoring_cursor.run_key IS 'Constant identifier for the scoring run (e.g. sdm_scorer)';
COMMENT ON COLUMN scoring_cursor.last_completed_response_id IS 'response_id of the last successfully processed row';
COMMENT ON COLUMN scoring_cursor.last_completed_created_at IS 'created_at of the last processed row, used for keyset pagination';
COMMENT ON COLUMN scoring_cursor.run_started_at IS 'Timestamp when the scoring run was first started';
COMMENT ON COLUMN scoring_cursor.responses_scored IS 'Cumulative count of successfully scored responses';
COMMENT ON COLUMN scoring_cursor.responses_errored IS 'Cumulative count of responses that errored during scoring';
COMMENT ON COLUMN scoring_cursor.updated_at IS 'Last time the cursor was updated';
