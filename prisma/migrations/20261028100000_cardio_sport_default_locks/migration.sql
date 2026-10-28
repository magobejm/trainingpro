-- Cardio distance is a series variable, so duration starts locked to keep six active.
UPDATE "plan_cardio_block"
SET "locked_fields_json" = '["durationSeconds"]'::jsonb
WHERE "locked_fields_json" IS NULL
   OR "locked_fields_json" = 'null'::jsonb
   OR "locked_fields_json" = '[]'::jsonb;

-- Sport rest starts active. Only the previous default lock list swaps rest for duration.
UPDATE "plan_sport_block"
SET "locked_fields_json" = '["heartRate","rir","fcReservePct","rom","durationSeconds"]'::jsonb
WHERE "locked_fields_json" IS NOT NULL
  AND (
    SELECT COALESCE(jsonb_agg(elem ORDER BY elem), '[]'::jsonb)
    FROM jsonb_array_elements_text("locked_fields_json") AS elem
  ) = (
    SELECT jsonb_agg(elem ORDER BY elem)
    FROM jsonb_array_elements_text('["heartRate","rir","fcReservePct","rom","restSeconds"]'::jsonb) AS elem
  );
