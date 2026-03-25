-- Migration: 0029_routine_planner_v2
-- Adds per-series tables, exercise grouping, isometric block, and field mode tables for plio/warmup/sport/isometric

-- New enum
CREATE TYPE "ExerciseGroupType" AS ENUM ('CIRCUIT', 'SUPERSET');

-- plan_exercise_group
CREATE TABLE "plan_exercise_group" (
    "id"         UUID        NOT NULL DEFAULT gen_random_uuid(),
    "day_id"     UUID        NOT NULL,
    "client_id"  VARCHAR(40),
    "group_type" "ExerciseGroupType" NOT NULL,
    "sort_order" INTEGER     NOT NULL DEFAULT 0,
    "note"       TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),

    CONSTRAINT "plan_exercise_group_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "idx_plan_exercise_group_day" ON "plan_exercise_group"("day_id");
ALTER TABLE "plan_exercise_group"
    ADD CONSTRAINT "plan_exercise_group_day_id_fkey"
    FOREIGN KEY ("day_id") REFERENCES "plan_day"("id") ON DELETE CASCADE;

-- Add group_id to existing block tables
ALTER TABLE "plan_strength_exercise" ADD COLUMN "group_id" UUID;
CREATE INDEX "idx_plan_strength_group" ON "plan_strength_exercise"("group_id");
ALTER TABLE "plan_strength_exercise"
    ADD CONSTRAINT "plan_strength_exercise_group_id_fkey"
    FOREIGN KEY ("group_id") REFERENCES "plan_exercise_group"("id") ON DELETE SET NULL;

ALTER TABLE "plan_cardio_block" ADD COLUMN "group_id" UUID;
CREATE INDEX "idx_plan_cardio_group" ON "plan_cardio_block"("group_id");
ALTER TABLE "plan_cardio_block"
    ADD CONSTRAINT "plan_cardio_block_group_id_fkey"
    FOREIGN KEY ("group_id") REFERENCES "plan_exercise_group"("id") ON DELETE SET NULL;

ALTER TABLE "plan_plio_block" ADD COLUMN "group_id" UUID;
CREATE INDEX "idx_plan_plio_group" ON "plan_plio_block"("group_id");
ALTER TABLE "plan_plio_block"
    ADD CONSTRAINT "plan_plio_block_group_id_fkey"
    FOREIGN KEY ("group_id") REFERENCES "plan_exercise_group"("id") ON DELETE SET NULL;

ALTER TABLE "plan_warmup_block" ADD COLUMN "group_id" UUID;
CREATE INDEX "idx_plan_warmup_group" ON "plan_warmup_block"("group_id");
ALTER TABLE "plan_warmup_block"
    ADD CONSTRAINT "plan_warmup_block_group_id_fkey"
    FOREIGN KEY ("group_id") REFERENCES "plan_exercise_group"("id") ON DELETE SET NULL;

ALTER TABLE "plan_sport_block" ADD COLUMN "group_id" UUID;
CREATE INDEX "idx_plan_sport_group" ON "plan_sport_block"("group_id");
ALTER TABLE "plan_sport_block"
    ADD CONSTRAINT "plan_sport_block_group_id_fkey"
    FOREIGN KEY ("group_id") REFERENCES "plan_exercise_group"("id") ON DELETE SET NULL;

-- plan_isometric_block
CREATE TABLE "plan_isometric_block" (
    "id"                            UUID           NOT NULL DEFAULT gen_random_uuid(),
    "day_id"                        UUID           NOT NULL,
    "group_id"                      UUID,
    "isometric_exercise_library_id" UUID,
    "sort_order"                    INTEGER        NOT NULL DEFAULT 0,
    "display_name"                  VARCHAR(120)   NOT NULL,
    "sets_planned"                  INTEGER,
    "notes"                         TEXT,
    "archived_at"                   TIMESTAMPTZ(6),
    "created_at"                    TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    "updated_at"                    TIMESTAMPTZ(6) NOT NULL DEFAULT now(),

    CONSTRAINT "plan_isometric_block_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "idx_plan_isometric_day_archived" ON "plan_isometric_block"("day_id", "archived_at");
CREATE INDEX "idx_plan_isometric_group"        ON "plan_isometric_block"("group_id");
ALTER TABLE "plan_isometric_block"
    ADD CONSTRAINT "plan_isometric_block_day_id_fkey"
    FOREIGN KEY ("day_id") REFERENCES "plan_day"("id") ON DELETE CASCADE;
ALTER TABLE "plan_isometric_block"
    ADD CONSTRAINT "plan_isometric_block_group_id_fkey"
    FOREIGN KEY ("group_id") REFERENCES "plan_exercise_group"("id") ON DELETE SET NULL;
ALTER TABLE "plan_isometric_block"
    ADD CONSTRAINT "plan_isometric_block_library_id_fkey"
    FOREIGN KEY ("isometric_exercise_library_id") REFERENCES "isometric_exercise"("id") ON DELETE SET NULL;

-- Field mode tables for plio, warmup, sport, isometric
CREATE TABLE "plio_field_mode" (
    "id"                UUID        NOT NULL DEFAULT gen_random_uuid(),
    "plan_plio_block_id" UUID       NOT NULL,
    "field_key"         VARCHAR(80) NOT NULL,
    "mode"              "FieldMode" NOT NULL DEFAULT 'COACH_INPUT',
    "created_at"        TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    "updated_at"        TIMESTAMPTZ(6) NOT NULL DEFAULT now(),

    CONSTRAINT "plio_field_mode_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "uq_plio_field_mode_item_field" UNIQUE ("plan_plio_block_id", "field_key")
);
CREATE INDEX "idx_plio_field_mode_item" ON "plio_field_mode"("plan_plio_block_id");
ALTER TABLE "plio_field_mode"
    ADD CONSTRAINT "plio_field_mode_plan_plio_block_id_fkey"
    FOREIGN KEY ("plan_plio_block_id") REFERENCES "plan_plio_block"("id") ON DELETE CASCADE;

CREATE TABLE "warmup_field_mode" (
    "id"                  UUID        NOT NULL DEFAULT gen_random_uuid(),
    "plan_warmup_block_id" UUID       NOT NULL,
    "field_key"           VARCHAR(80) NOT NULL,
    "mode"                "FieldMode" NOT NULL DEFAULT 'COACH_INPUT',
    "created_at"          TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    "updated_at"          TIMESTAMPTZ(6) NOT NULL DEFAULT now(),

    CONSTRAINT "warmup_field_mode_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "uq_warmup_field_mode_item_field" UNIQUE ("plan_warmup_block_id", "field_key")
);
CREATE INDEX "idx_warmup_field_mode_item" ON "warmup_field_mode"("plan_warmup_block_id");
ALTER TABLE "warmup_field_mode"
    ADD CONSTRAINT "warmup_field_mode_plan_warmup_block_id_fkey"
    FOREIGN KEY ("plan_warmup_block_id") REFERENCES "plan_warmup_block"("id") ON DELETE CASCADE;

CREATE TABLE "sport_field_mode" (
    "id"                 UUID        NOT NULL DEFAULT gen_random_uuid(),
    "plan_sport_block_id" UUID       NOT NULL,
    "field_key"          VARCHAR(80) NOT NULL,
    "mode"               "FieldMode" NOT NULL DEFAULT 'COACH_INPUT',
    "created_at"         TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    "updated_at"         TIMESTAMPTZ(6) NOT NULL DEFAULT now(),

    CONSTRAINT "sport_field_mode_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "uq_sport_field_mode_item_field" UNIQUE ("plan_sport_block_id", "field_key")
);
CREATE INDEX "idx_sport_field_mode_item" ON "sport_field_mode"("plan_sport_block_id");
ALTER TABLE "sport_field_mode"
    ADD CONSTRAINT "sport_field_mode_plan_sport_block_id_fkey"
    FOREIGN KEY ("plan_sport_block_id") REFERENCES "plan_sport_block"("id") ON DELETE CASCADE;

CREATE TABLE "isometric_field_mode" (
    "id"                     UUID        NOT NULL DEFAULT gen_random_uuid(),
    "plan_isometric_block_id" UUID       NOT NULL,
    "field_key"              VARCHAR(80) NOT NULL,
    "mode"                   "FieldMode" NOT NULL DEFAULT 'COACH_INPUT',
    "created_at"             TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    "updated_at"             TIMESTAMPTZ(6) NOT NULL DEFAULT now(),

    CONSTRAINT "isometric_field_mode_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "uq_isometric_field_mode_item_field" UNIQUE ("plan_isometric_block_id", "field_key")
);
CREATE INDEX "idx_isometric_field_mode_item" ON "isometric_field_mode"("plan_isometric_block_id");
ALTER TABLE "isometric_field_mode"
    ADD CONSTRAINT "isometric_field_mode_plan_isometric_block_id_fkey"
    FOREIGN KEY ("plan_isometric_block_id") REFERENCES "plan_isometric_block"("id") ON DELETE CASCADE;

-- Per-series tables
CREATE TABLE "plan_strength_set" (
    "id"                 UUID           NOT NULL DEFAULT gen_random_uuid(),
    "exercise_id"        UUID           NOT NULL,
    "set_index"          INTEGER        NOT NULL,
    "reps"               INTEGER,
    "rpe"                INTEGER,
    "weight_kg"          DECIMAL(6,2),
    "rir"                INTEGER,
    "rest_seconds"       INTEGER,
    "advanced_technique" VARCHAR(40),
    "note"               TEXT,
    "created_at"         TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    "updated_at"         TIMESTAMPTZ(6) NOT NULL DEFAULT now(),

    CONSTRAINT "plan_strength_set_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "uq_plan_strength_set" UNIQUE ("exercise_id", "set_index")
);
CREATE INDEX "idx_plan_strength_set_exercise" ON "plan_strength_set"("exercise_id");
ALTER TABLE "plan_strength_set"
    ADD CONSTRAINT "plan_strength_set_exercise_id_fkey"
    FOREIGN KEY ("exercise_id") REFERENCES "plan_strength_exercise"("id") ON DELETE CASCADE;

CREATE TABLE "plan_cardio_set" (
    "id"           UUID           NOT NULL DEFAULT gen_random_uuid(),
    "block_id"     UUID           NOT NULL,
    "set_index"    INTEGER        NOT NULL,
    "fc_max_pct"   INTEGER,
    "fc_reserve_pct" INTEGER,
    "heart_rate"   INTEGER,
    "rpe"          INTEGER,
    "note"         TEXT,
    "created_at"   TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    "updated_at"   TIMESTAMPTZ(6) NOT NULL DEFAULT now(),

    CONSTRAINT "plan_cardio_set_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "uq_plan_cardio_set" UNIQUE ("block_id", "set_index")
);
CREATE INDEX "idx_plan_cardio_set_block" ON "plan_cardio_set"("block_id");
ALTER TABLE "plan_cardio_set"
    ADD CONSTRAINT "plan_cardio_set_block_id_fkey"
    FOREIGN KEY ("block_id") REFERENCES "plan_cardio_block"("id") ON DELETE CASCADE;

CREATE TABLE "plan_plio_set" (
    "id"          UUID           NOT NULL DEFAULT gen_random_uuid(),
    "block_id"    UUID           NOT NULL,
    "set_index"   INTEGER        NOT NULL,
    "reps"        INTEGER,
    "rpe"         INTEGER,
    "weight_kg"   DECIMAL(6,2),
    "rest_seconds" INTEGER,
    "note"        TEXT,
    "created_at"  TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    "updated_at"  TIMESTAMPTZ(6) NOT NULL DEFAULT now(),

    CONSTRAINT "plan_plio_set_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "uq_plan_plio_set" UNIQUE ("block_id", "set_index")
);
CREATE INDEX "idx_plan_plio_set_block" ON "plan_plio_set"("block_id");
ALTER TABLE "plan_plio_set"
    ADD CONSTRAINT "plan_plio_set_block_id_fkey"
    FOREIGN KEY ("block_id") REFERENCES "plan_plio_block"("id") ON DELETE CASCADE;

CREATE TABLE "plan_isometric_set" (
    "id"               UUID           NOT NULL DEFAULT gen_random_uuid(),
    "block_id"         UUID           NOT NULL,
    "set_index"        INTEGER        NOT NULL,
    "rpe"              INTEGER,
    "duration_seconds" INTEGER,
    "weight_kg"        DECIMAL(6,2),
    "rest_seconds"     INTEGER,
    "note"             TEXT,
    "created_at"       TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    "updated_at"       TIMESTAMPTZ(6) NOT NULL DEFAULT now(),

    CONSTRAINT "plan_isometric_set_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "uq_plan_isometric_set" UNIQUE ("block_id", "set_index")
);
CREATE INDEX "idx_plan_isometric_set_block" ON "plan_isometric_set"("block_id");
ALTER TABLE "plan_isometric_set"
    ADD CONSTRAINT "plan_isometric_set_block_id_fkey"
    FOREIGN KEY ("block_id") REFERENCES "plan_isometric_block"("id") ON DELETE CASCADE;

CREATE TABLE "plan_warmup_set" (
    "id"          UUID           NOT NULL DEFAULT gen_random_uuid(),
    "block_id"    UUID           NOT NULL,
    "set_index"   INTEGER        NOT NULL,
    "reps"        INTEGER,
    "rpe"         INTEGER,
    "rom"         VARCHAR(30),
    "rest_seconds" INTEGER,
    "note"        TEXT,
    "created_at"  TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    "updated_at"  TIMESTAMPTZ(6) NOT NULL DEFAULT now(),

    CONSTRAINT "plan_warmup_set_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "uq_plan_warmup_set" UNIQUE ("block_id", "set_index")
);
CREATE INDEX "idx_plan_warmup_set_block" ON "plan_warmup_set"("block_id");
ALTER TABLE "plan_warmup_set"
    ADD CONSTRAINT "plan_warmup_set_block_id_fkey"
    FOREIGN KEY ("block_id") REFERENCES "plan_warmup_block"("id") ON DELETE CASCADE;

CREATE TABLE "plan_sport_set" (
    "id"           UUID           NOT NULL DEFAULT gen_random_uuid(),
    "block_id"     UUID           NOT NULL,
    "set_index"    INTEGER        NOT NULL,
    "reps"         INTEGER,
    "rpe"          INTEGER,
    "rir"          INTEGER,
    "weight_kg"    DECIMAL(6,2),
    "fc_max_pct"   INTEGER,
    "fc_reserve_pct" INTEGER,
    "heart_rate"   INTEGER,
    "rest_seconds" INTEGER,
    "note"         TEXT,
    "created_at"   TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    "updated_at"   TIMESTAMPTZ(6) NOT NULL DEFAULT now(),

    CONSTRAINT "plan_sport_set_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "uq_plan_sport_set" UNIQUE ("block_id", "set_index")
);
CREATE INDEX "idx_plan_sport_set_block" ON "plan_sport_set"("block_id");
ALTER TABLE "plan_sport_set"
    ADD CONSTRAINT "plan_sport_set_block_id_fkey"
    FOREIGN KEY ("block_id") REFERENCES "plan_sport_block"("id") ON DELETE CASCADE;
