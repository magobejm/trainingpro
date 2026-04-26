-- Sessions still missing plan day snapshot (e.g. created before calendar/materialize flow).
-- Assign first non-archived plan day of source_template_id (same heuristic as legacy ensureSession).
UPDATE "session_instance" si
SET
  "plan_day_id" = fp."id",
  "plan_day_index" = fp."day_index",
  "plan_day_title" = LEFT(fp."title", 120)
FROM (
  SELECT DISTINCT ON (pd."template_id") pd."id", pd."template_id", pd."day_index", pd."title"
  FROM "plan_day" pd
  WHERE pd."archived_at" IS NULL
  ORDER BY pd."template_id", pd."day_index" ASC
) fp
WHERE si."source_template_id" = fp."template_id"
  AND si."archived_at" IS NULL
  AND si."plan_day_index" IS NULL;
