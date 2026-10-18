ALTER TABLE plan_day ADD COLUMN revision_version INTEGER NOT NULL DEFAULT 1;
UPDATE plan_day d SET revision_version = p.template_version FROM plan_template p WHERE p.id = d.template_id;
DROP INDEX uq_plan_day_template_index;
CREATE UNIQUE INDEX uq_plan_day_template_revision_index ON plan_day(template_id, revision_version, day_index);

CREATE TABLE routine_revision (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES plan_template(id) ON DELETE RESTRICT,
  version INTEGER NOT NULL,
  name VARCHAR(120) NOT NULL,
  content JSONB NOT NULL,
  initial BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  UNIQUE(template_id, version)
);
CREATE TABLE routine_assignment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES client(id) ON DELETE CASCADE,
  revision_id UUID NOT NULL REFERENCES routine_revision(id) ON DELETE RESTRICT,
  applied_by UUID NOT NULL,
  applied_at TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);
CREATE INDEX routine_assignment_client_id_applied_at_idx ON routine_assignment(client_id, applied_at);
ALTER TABLE client ADD COLUMN active_routine_assignment_id UUID REFERENCES routine_assignment(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX client_active_routine_assignment_id_key ON client(active_routine_assignment_id);
