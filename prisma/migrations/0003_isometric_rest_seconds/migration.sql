-- Migration 0003: add rest_seconds to isometric blocks (idempotent)

-- SessionIsometricBlock: nullable (existing sessions keep NULL = no rest)
ALTER TABLE "session_isometric_block"
  ADD COLUMN IF NOT EXISTS "rest_seconds" INTEGER;

-- PlanIsometricBlock: NOT NULL with default 0 (new blocks default to no rest)
ALTER TABLE "plan_isometric_block"
  ADD COLUMN IF NOT EXISTS "rest_seconds" INTEGER NOT NULL DEFAULT 0;
