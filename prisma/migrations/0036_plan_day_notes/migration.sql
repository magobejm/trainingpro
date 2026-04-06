-- Add generic day notes field to plan_day
ALTER TABLE plan_day ADD COLUMN IF NOT EXISTS notes TEXT;
