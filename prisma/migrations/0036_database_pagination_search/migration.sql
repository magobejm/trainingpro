CREATE OR REPLACE FUNCTION normalize_search(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
STRICT
PARALLEL SAFE
AS $$
  SELECT regexp_replace(
    lower(regexp_replace(normalize(input, NFD), U&'[\0300-\036F]', '', 'g')),
    '[^[:alnum:]]',
    '',
    'g'
  )
$$;

CREATE INDEX IF NOT EXISTS idx_food_name_search_page
  ON food ((normalize_search(name) COLLATE "C"), (id::text COLLATE "C"));
CREATE INDEX IF NOT EXISTS idx_coach_note_page
  ON coach_note (coach_membership_id, (date_trunc('milliseconds', created_at AT TIME ZONE 'UTC')) DESC, (id::text COLLATE "C") DESC)
  WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_session_client_activity_page
  ON session_instance (client_id, finished_at DESC, session_date DESC)
  WHERE archived_at IS NULL AND is_completed = true;
CREATE INDEX IF NOT EXISTS idx_plan_template_name_search_page
  ON plan_template ((normalize_search(name) COLLATE "C"), (id::text COLLATE "C"))
  WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_warmup_template_name_search_page
  ON warmup_template ((normalize_search(name) COLLATE "C"), (id::text COLLATE "C"))
  WHERE archived_at IS NULL AND is_revision = false;
CREATE INDEX IF NOT EXISTS idx_client_name_search_page
  ON client ((normalize_search(first_name || ' ' || last_name) COLLATE "C"), (id::text COLLATE "C"))
  WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_exercise_name_search_page
  ON exercise ((normalize_search(name) COLLATE "C"), (id::text COLLATE "C")) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_cardio_method_name_search_page
  ON cardio_method ((normalize_search(name) COLLATE "C"), (id::text COLLATE "C")) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_plio_exercise_name_search_page
  ON plio_exercise ((normalize_search(name) COLLATE "C"), (id::text COLLATE "C")) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_mobility_exercise_name_search_page
  ON mobility_exercise ((normalize_search(name) COLLATE "C"), (id::text COLLATE "C")) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_isometric_exercise_name_search_page
  ON isometric_exercise ((normalize_search(name) COLLATE "C"), (id::text COLLATE "C")) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sport_name_search_page
  ON sport ((normalize_search(name) COLLATE "C"), (id::text COLLATE "C")) WHERE archived_at IS NULL;
