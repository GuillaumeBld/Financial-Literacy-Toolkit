-- Migration: Add SDM variant support to items table
-- Adds: is_sdm flag, linkage to anchor item, variant metadata for adaptive SDM-10 routing

ALTER TABLE items
  ADD COLUMN IF NOT EXISTS is_sdm BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS anchor_item_id UUID REFERENCES items(item_id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS variant_type TEXT,
  ADD COLUMN IF NOT EXISTS trigger_condition TEXT,
  ADD COLUMN IF NOT EXISTS external_id TEXT;

CREATE INDEX IF NOT EXISTS idx_items_is_sdm ON items(is_sdm) WHERE is_sdm = true;
CREATE INDEX IF NOT EXISTS idx_items_anchor_item_id ON items(anchor_item_id);
CREATE INDEX IF NOT EXISTS idx_items_external_id ON items(external_id);
