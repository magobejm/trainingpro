-- Add editable title for day notes
ALTER TABLE plan_day ADD COLUMN IF NOT EXISTS notes_title VARCHAR(120);
