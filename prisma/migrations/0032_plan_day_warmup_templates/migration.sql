-- Remove old single-FK column
ALTER TABLE plan_day DROP COLUMN IF EXISTS warmup_template_id;

-- Junction table: 0..N warmup templates per day
CREATE TABLE plan_day_warmup (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_day_id         UUID NOT NULL REFERENCES plan_day(id) ON DELETE CASCADE,
  warmup_template_id  UUID NOT NULL REFERENCES warmup_template(id) ON DELETE CASCADE,
  sort_order          INT  NOT NULL DEFAULT 0
);
CREATE INDEX idx_plan_day_warmup_day ON plan_day_warmup(plan_day_id);
