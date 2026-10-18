ALTER TABLE routine_assignment ADD COLUMN initial BOOLEAN NOT NULL DEFAULT false;
UPDATE routine_assignment a SET initial = r.initial FROM routine_revision r WHERE a.revision_id = r.id;
