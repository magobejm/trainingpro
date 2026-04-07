-- Create coach notes table
CREATE TABLE coach_note (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_membership_id   UUID NOT NULL REFERENCES organization_member(id) ON DELETE CASCADE,
  type                  VARCHAR(20) NOT NULL,
  client_id             UUID NULL REFERENCES client(id) ON DELETE CASCADE,
  content               TEXT NOT NULL,
  created_at            TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  archived_at           TIMESTAMPTZ(6) NULL
);

CREATE INDEX idx_coach_note_coach_archived ON coach_note(coach_membership_id, archived_at);
CREATE INDEX idx_coach_note_client ON coach_note(client_id);
