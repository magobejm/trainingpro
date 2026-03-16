-- Add equipment_id FK to mobility_exercise and sport tables
ALTER TABLE "mobility_exercise"
ADD COLUMN "equipment_id" UUID REFERENCES "exercise_equipment"("id") ON DELETE SET NULL;

ALTER TABLE "sport"
ADD COLUMN "equipment_id" UUID REFERENCES "exercise_equipment"("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_mobility_equipment ON mobility_exercise(equipment_id);
CREATE INDEX IF NOT EXISTS idx_sport_equipment ON sport(equipment_id);

-- Fix default type codes: sin_definir -> undefined
UPDATE "mobility_type" SET "code" = 'undefined' WHERE "code" = 'sin_definir';
UPDATE "sport_type" SET "code" = 'undefined' WHERE "code" = 'sin_definir';

-- Add new equipment items
INSERT INTO exercise_equipment (id, code, label, sort_order, is_default, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'foam_roller', 'Foam Roller',  17, false, now(), now()),
  (gen_random_uuid(), 'stick',       'Palo',          18, false, now(), now()),
  (gen_random_uuid(), 'fins',        'Aletas',        19, false, now(), now()),
  (gen_random_uuid(), 'paddles',     'Palas',         20, false, now(), now()),
  (gen_random_uuid(), 'pull_buoy',   'Pull-buoy',     21, false, now(), now()),
  (gen_random_uuid(), 'kickboard',   'Tabla',         22, false, now(), now()),
  (gen_random_uuid(), 'sled',        'Trineo',        23, false, now(), now())
ON CONFLICT (code) DO NOTHING;

-- Set equipment on mobility exercises
UPDATE mobility_exercise me
SET equipment_id = eq.id
FROM exercise_equipment eq
WHERE me.scope = 'GLOBAL'
  AND me.equipment_id IS NULL
  AND (
    (me.name IN ('TKE (Terminal Knee Extension)', 'Distracción de tobillo con banda',
                 'Flexión plantar/dorsal con banda', 'Inversión/Eversión con banda',
                 'Spanish Squat (Isométrico)', 'Distracción de cadera con banda',
                 'Band Pull-aparts', 'Facepull (Movilidad)', '"No Money" drill') AND eq.code = 'band')
    OR (me.name IN ('Poliquin Step-up', 'Petersen Step-up', 'Estiramiento excéntrico de gemelo') AND eq.code = 'low_step')
    OR (me.name IN ('Extensión torácica (Rodillo)', 'Masaje miofascial (Rodillo)') AND eq.code = 'foam_roller')
    OR (me.name IN ('Jefferson Curl') AND eq.code = 'kettlebell')
    OR (me.name IN ('Dislocaciones de hombro', 'Cossack Squat asistida') AND eq.code = 'stick')
    OR (me.name IN ('Wall Slides', 'Couch Stretch') AND eq.code = 'wall')
  );

-- Set undefined equipment on mobility exercises without equipment
UPDATE mobility_exercise me
SET equipment_id = eq.id
FROM exercise_equipment eq
WHERE me.scope = 'GLOBAL'
  AND me.equipment_id IS NULL
  AND eq.code = 'undefined';

-- Set equipment on sport exercises
UPDATE sport s
SET equipment_id = eq.id
FROM exercise_equipment eq
WHERE s.scope = 'GLOBAL'
  AND s.equipment_id IS NULL
  AND (
    (s.name IN ('Arrancada (Snatch)', 'Dos tiempos (Clean & Jerk)', 'Power Clean', 'Power Snatch',
                'Hang Clean', 'Hang Snatch', 'Overhead Squat', 'Tirón de arrancada / cargada',
                'Muscle Snatch', 'Split Jerk', 'Envión (Jerk)', 'Thrusters', 'Cluster',
                'Shoulder to Overhead', 'Sumo Deadlift High Pull', 'Bear Complex') AND eq.code = 'barbell')
    OR (s.name IN ('American Swing', 'Kettlebell Snatch') AND eq.code = 'kettlebell')
    OR (s.name IN ('Devil Press', 'Dumbbell Snatch', 'Dumbbell Box Step-overs') AND eq.code = 'dumbbell')
    OR (s.name IN ('Wall Ball Shots') AND eq.code = 'medicine_ball')
    OR (s.name IN ('Sled Push (Trineo)') AND eq.code = 'sled')
    OR (s.name IN ('Nado con aletas') AND eq.code = 'fins')
    OR (s.name IN ('Nado con palas') AND eq.code = 'paddles')
    OR (s.name IN ('Nado con pull-buoy') AND eq.code = 'pull_buoy')
    OR (s.name IN ('Patada de crol con tabla') AND eq.code = 'kickboard')
  );

-- Set undefined equipment on sport exercises without equipment
UPDATE sport s
SET equipment_id = eq.id
FROM exercise_equipment eq
WHERE s.scope = 'GLOBAL'
  AND s.equipment_id IS NULL
  AND eq.code = 'undefined';
