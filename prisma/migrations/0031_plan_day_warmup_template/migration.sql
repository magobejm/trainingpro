ALTER TABLE plan_day
  ADD COLUMN warmup_template_id UUID REFERENCES warmup_template(id) ON DELETE SET NULL;

CREATE INDEX idx_plan_day_warmup_template ON plan_day(warmup_template_id);
