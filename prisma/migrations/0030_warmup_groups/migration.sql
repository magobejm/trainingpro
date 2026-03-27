CREATE TABLE warmup_template_group (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES warmup_template(id) ON DELETE CASCADE,
  group_type  VARCHAR(20) NOT NULL,
  note        TEXT,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_warmup_template_group_template ON warmup_template_group(template_id);

ALTER TABLE warmup_template_item
  ADD COLUMN isometric_exercise_library_id UUID,
  ADD COLUMN sport_library_id UUID,
  ADD COLUMN group_id UUID REFERENCES warmup_template_group(id) ON DELETE SET NULL;
