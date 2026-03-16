-- Rename warmup_exercise table to mobility_exercise
ALTER TABLE warmup_exercise RENAME TO mobility_exercise;

-- Rename indexes
ALTER INDEX idx_warmup_scope_archived RENAME TO idx_mobility_scope_archived;
ALTER INDEX idx_warmup_coach_archived RENAME TO idx_mobility_coach_archived;
ALTER INDEX idx_warmup_mobility_type RENAME TO idx_mobility_type;

-- Add new biomechanics indexes (created by db push earlier but now under new names)
-- These may already exist from db push; use IF NOT EXISTS to be safe
CREATE INDEX IF NOT EXISTS idx_mobility_movement_pattern ON mobility_exercise(movement_pattern_id);
CREATE INDEX IF NOT EXISTS idx_mobility_anatomical_plane ON mobility_exercise(anatomical_plane_id);
