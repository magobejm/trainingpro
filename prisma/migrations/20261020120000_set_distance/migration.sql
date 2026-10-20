-- Distances use integer metres; duration storage remains seconds.
ALTER TABLE "plan_cardio_set" ADD COLUMN "distance_meters" INTEGER;
ALTER TABLE "plan_sport_set" ADD COLUMN "distance_meters" INTEGER;
ALTER TABLE "sport_set_log" ADD COLUMN "distance_done_meters" INTEGER;

UPDATE "plan_cardio_block" SET "locked_fields_json" = '[]'::jsonb WHERE "locked_fields_json" = 'null'::jsonb;

-- Preserve old selections before new defaults become active. Empty sport lists
-- previously meant heartRate/rir/fcReservePct/rom were locked.
UPDATE "plan_cardio_block"
SET "locked_fields_json" = COALESCE("locked_fields_json", '[]'::jsonb) || '["distanceMeters"]'::jsonb
WHERE NOT COALESCE("locked_fields_json", '[]'::jsonb) ? 'distanceMeters'
  AND (SELECT count(*) FROM jsonb_array_elements_text('["rpe","fcMaxPct","durationSeconds","distanceMeters","heartRate","fcReservePct","restSeconds"]'::jsonb) AS v(key)
       WHERE NOT COALESCE("locked_fields_json", '[]'::jsonb) ? key) > 6;

UPDATE "plan_sport_block"
SET "locked_fields_json" = '["heartRate","rir","fcReservePct","rom"]'::jsonb
WHERE "locked_fields_json" IS NULL OR "locked_fields_json" IN ('null'::jsonb, '[]'::jsonb);
UPDATE "plan_sport_block"
SET "locked_fields_json" = "locked_fields_json" || '["distanceMeters"]'::jsonb
WHERE NOT "locked_fields_json" ? 'distanceMeters'
  AND (SELECT count(*) FROM jsonb_array_elements_text('["reps","weightKg","rpe","fcMaxPct","durationSeconds","distanceMeters","heartRate","rir","fcReservePct","rom","restSeconds"]'::jsonb) AS v(key)
       WHERE NOT "locked_fields_json" ? key) > 6;
