CREATE TABLE exercise_muscle_group (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(80) NOT NULL UNIQUE,
  label VARCHAR(120) NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
);

CREATE TABLE cardio_method_type (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(80) NOT NULL UNIQUE,
  label VARCHAR(120) NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_exercise_muscle_group_sort ON exercise_muscle_group(sort_order);
CREATE INDEX idx_exercise_muscle_group_default ON exercise_muscle_group(is_default);
CREATE INDEX idx_cardio_method_type_sort ON cardio_method_type(sort_order);
CREATE INDEX idx_cardio_method_type_default ON cardio_method_type(is_default);

INSERT INTO exercise_muscle_group (code, label, sort_order, is_default)
VALUES
  ('sin_definir', 'Sin definir', 0, TRUE),
  ('pecho', 'Pecho', 10, FALSE),
  ('espalda', 'Espalda', 20, FALSE),
  ('pierna', 'Pierna', 30, FALSE),
  ('hombro', 'Hombro', 40, FALSE),
  ('core', 'Core', 50, FALSE),
  ('brazo', 'Brazo', 60, FALSE);

INSERT INTO cardio_method_type (code, label, sort_order, is_default)
VALUES
  ('sin_definir', 'Sin definir', 0, TRUE),
  ('continuo', 'Continuo', 10, FALSE),
  ('intervalos', 'Intervalos', 20, FALSE),
  ('mixto', 'Mixto', 30, FALSE);

INSERT INTO exercise_muscle_group (code, label, sort_order, is_default)
SELECT
  CONCAT('legacy_', substring(md5(lower(btrim(e.muscle_group))) from 1 for 12)) AS code,
  btrim(e.muscle_group) AS label,
  1000 AS sort_order,
  FALSE AS is_default
FROM exercise e
WHERE e.muscle_group IS NOT NULL
  AND btrim(e.muscle_group) <> ''
  AND NOT EXISTS (
    SELECT 1
    FROM exercise_muscle_group emg
    WHERE lower(emg.label) = lower(btrim(e.muscle_group))
  )
GROUP BY btrim(e.muscle_group);

INSERT INTO cardio_method_type (code, label, sort_order, is_default)
SELECT
  CONCAT('legacy_', substring(md5(lower(btrim(c.method_type))) from 1 for 12)) AS code,
  btrim(c.method_type) AS label,
  1000 AS sort_order,
  FALSE AS is_default
FROM cardio_method c
WHERE c.method_type IS NOT NULL
  AND btrim(c.method_type) <> ''
  AND NOT EXISTS (
    SELECT 1
    FROM cardio_method_type cmt
    WHERE lower(cmt.label) = lower(btrim(c.method_type))
  )
GROUP BY btrim(c.method_type);

ALTER TABLE exercise
  ADD COLUMN muscle_group_id UUID;

ALTER TABLE cardio_method
  ADD COLUMN method_type_id UUID;

UPDATE exercise e
SET muscle_group_id = emg.id
FROM exercise_muscle_group emg
WHERE lower(emg.label) = lower(btrim(e.muscle_group));

UPDATE cardio_method c
SET method_type_id = cmt.id
FROM cardio_method_type cmt
WHERE lower(cmt.label) = lower(btrim(c.method_type));

UPDATE exercise e
SET muscle_group_id = (
  SELECT emg.id
  FROM exercise_muscle_group emg
  WHERE emg.is_default = TRUE
  ORDER BY emg.sort_order ASC, emg.label ASC
  LIMIT 1
)
WHERE e.muscle_group_id IS NULL;

UPDATE cardio_method c
SET method_type_id = (
  SELECT cmt.id
  FROM cardio_method_type cmt
  WHERE cmt.is_default = TRUE
  ORDER BY cmt.sort_order ASC, cmt.label ASC
  LIMIT 1
)
WHERE c.method_type_id IS NULL;

ALTER TABLE exercise
  ALTER COLUMN muscle_group_id SET NOT NULL;

ALTER TABLE cardio_method
  ALTER COLUMN method_type_id SET NOT NULL;

ALTER TABLE exercise
  ADD CONSTRAINT fk_exercise_muscle_group
  FOREIGN KEY (muscle_group_id) REFERENCES exercise_muscle_group(id)
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE cardio_method
  ADD CONSTRAINT fk_cardio_method_type
  FOREIGN KEY (method_type_id) REFERENCES cardio_method_type(id)
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX idx_exercise_muscle_group ON exercise(muscle_group_id);
CREATE INDEX idx_cardio_method_type ON cardio_method(method_type_id);

ALTER TABLE exercise
  DROP COLUMN muscle_group;

ALTER TABLE cardio_method
  DROP COLUMN method_type;
