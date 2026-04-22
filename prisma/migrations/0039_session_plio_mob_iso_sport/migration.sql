-- Create session_plio_block table
CREATE TABLE session_plio_block (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id               UUID NOT NULL REFERENCES session_instance(id) ON DELETE CASCADE,
  source_plio_exercise_id  UUID NULL,
  display_name             VARCHAR(120) NOT NULL,
  sort_order               INT NOT NULL DEFAULT 0,
  rounds_planned           INT NOT NULL DEFAULT 1,
  work_seconds             INT NOT NULL,
  rest_seconds             INT NOT NULL DEFAULT 0,
  target_rpe               INT NULL,
  archived_at              TIMESTAMPTZ(6) NULL,
  created_at               TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at               TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_session_plio_session_archived ON session_plio_block(session_id, archived_at);

-- Create plio_set_log table
CREATE TABLE plio_set_log (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id              UUID NOT NULL REFERENCES session_instance(id) ON DELETE CASCADE,
  session_plio_block_id   UUID NOT NULL REFERENCES session_plio_block(id) ON DELETE CASCADE,
  set_index               INT NOT NULL,
  reps_done               INT NULL,
  weight_done_kg          DECIMAL(6, 2) NULL,
  effort_rpe              INT NULL,
  created_at              TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_plio_log_block_set UNIQUE (session_plio_block_id, set_index)
);

CREATE INDEX idx_plio_log_session ON plio_set_log(session_id);

-- Create session_mobility_block table
CREATE TABLE session_mobility_block (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id                  UUID NOT NULL REFERENCES session_instance(id) ON DELETE CASCADE,
  source_mobility_exercise_id UUID NULL,
  display_name                VARCHAR(120) NOT NULL,
  sort_order                  INT NOT NULL DEFAULT 0,
  rounds_planned              INT NOT NULL DEFAULT 1,
  work_seconds                INT NOT NULL,
  rest_seconds                INT NOT NULL DEFAULT 0,
  target_rpe                  INT NULL,
  archived_at                 TIMESTAMPTZ(6) NULL,
  created_at                  TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at                  TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_session_mobility_session_archived ON session_mobility_block(session_id, archived_at);

-- Create mobility_set_log table
CREATE TABLE mobility_set_log (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id                UUID NOT NULL REFERENCES session_instance(id) ON DELETE CASCADE,
  session_mobility_block_id UUID NOT NULL REFERENCES session_mobility_block(id) ON DELETE CASCADE,
  set_index                 INT NOT NULL,
  reps_done                 INT NULL,
  rom_done                  VARCHAR(30) NULL,
  effort_rpe                INT NULL,
  created_at                TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at                TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_mobility_log_block_set UNIQUE (session_mobility_block_id, set_index)
);

CREATE INDEX idx_mobility_log_session ON mobility_set_log(session_id);

-- Create session_isometric_block table
CREATE TABLE session_isometric_block (
  id                           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id                   UUID NOT NULL REFERENCES session_instance(id) ON DELETE CASCADE,
  source_isometric_exercise_id UUID NULL,
  display_name                 VARCHAR(120) NOT NULL,
  sort_order                   INT NOT NULL DEFAULT 0,
  sets_planned                 INT NULL,
  target_rpe                   INT NULL,
  archived_at                  TIMESTAMPTZ(6) NULL,
  created_at                   TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at                   TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_session_isometric_session_archived ON session_isometric_block(session_id, archived_at);

-- Create isometric_set_log table
CREATE TABLE isometric_set_log (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id                 UUID NOT NULL REFERENCES session_instance(id) ON DELETE CASCADE,
  session_isometric_block_id UUID NOT NULL REFERENCES session_isometric_block(id) ON DELETE CASCADE,
  set_index                  INT NOT NULL,
  duration_seconds_done      INT NULL,
  weight_done_kg             DECIMAL(6, 2) NULL,
  effort_rpe                 INT NULL,
  created_at                 TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at                 TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_isometric_log_block_set UNIQUE (session_isometric_block_id, set_index)
);

CREATE INDEX idx_isometric_log_session ON isometric_set_log(session_id);

-- Create session_sport_block table
CREATE TABLE session_sport_block (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id       UUID NOT NULL REFERENCES session_instance(id) ON DELETE CASCADE,
  source_sport_id  UUID NULL,
  display_name     VARCHAR(120) NOT NULL,
  sort_order       INT NOT NULL DEFAULT 0,
  duration_minutes INT NOT NULL,
  target_rpe       INT NULL,
  archived_at      TIMESTAMPTZ(6) NULL,
  created_at       TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_session_sport_session_archived ON session_sport_block(session_id, archived_at);

-- Create sport_session_log table
CREATE TABLE sport_session_log (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id            UUID NOT NULL REFERENCES session_instance(id) ON DELETE CASCADE,
  session_sport_block_id UUID NOT NULL REFERENCES session_sport_block(id) ON DELETE CASCADE,
  duration_minutes_done INT NULL,
  effort_rpe            INT NULL,
  avg_heart_rate        INT NULL,
  created_at            TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_sport_log_block UNIQUE (session_sport_block_id)
);

CREATE INDEX idx_sport_log_session ON sport_session_log(session_id);
