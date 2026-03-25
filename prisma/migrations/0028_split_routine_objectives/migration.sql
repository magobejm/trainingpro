-- ============================================================
-- Migration: 0028_split_routine_objectives
-- Separates client and routine objective catalogs.
-- ============================================================

-- Step 1: Update existing client_objective codes and labels
-- to match the new client catalog (UUIDs stay the same, so
-- existing Client.objective_id FKs remain valid).
UPDATE "client_objective"
SET code = 'ganancia_masa_muscular', label = 'Ganancia de masa muscular'
WHERE code = 'ganancia_muscular';

UPDATE "client_objective"
SET code = 'perdida_de_grasa', label = 'Pérdida de grasa'
WHERE code = 'perdida_de_peso';

UPDATE "client_objective"
SET label = 'Recomposición corporal'
WHERE code = 'recomposicion_corporal';

UPDATE "client_objective"
SET code = 'rendimiento_deportivo', label = 'Rendimiento deportivo'
WHERE code = 'mejora_rendimiento';

UPDATE "client_objective"
SET code = 'mejora_salud', label = 'Mejora de la salud'
WHERE code = 'salud_bienestar';

-- Step 2: Create the new routine_objective catalog table.
CREATE TABLE "routine_objective" (
  "id"         UUID         NOT NULL DEFAULT gen_random_uuid(),
  "code"       VARCHAR(80)  NOT NULL,
  "label"      VARCHAR(120) NOT NULL,
  "sort_order" INTEGER      NOT NULL DEFAULT 0,
  "is_default" BOOLEAN      NOT NULL DEFAULT FALSE,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  CONSTRAINT "routine_objective_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "routine_objective_code_key" UNIQUE ("code"),
  CONSTRAINT "routine_objective_label_key" UNIQUE ("label")
);

CREATE INDEX "idx_routine_objective_sort"    ON "routine_objective"("sort_order");
CREATE INDEX "idx_routine_objective_default" ON "routine_objective"("is_default");

-- Step 3: Seed the 10 routine objectives.
INSERT INTO "routine_objective" (id, code, label, sort_order, is_default) VALUES
  (gen_random_uuid(), 'fuerza_maxima',              'Fuerza máxima',              10,  FALSE),
  (gen_random_uuid(), 'hipertrofia',                'Hipertrofia',                20,  FALSE),
  (gen_random_uuid(), 'potencia',                   'Potencia',                   30,  FALSE),
  (gen_random_uuid(), 'resistencia_muscular',       'Resistencia muscular',       40,  FALSE),
  (gen_random_uuid(), 'readaptacion_lesion',        'Readaptación a una lesión',  50,  FALSE),
  (gen_random_uuid(), 'prevencion_lesiones',        'Prevención de lesiones',     60,  FALSE),
  (gen_random_uuid(), 'movilidad',                  'Movilidad',                  70,  FALSE),
  (gen_random_uuid(), 'salud_cardiovascular',       'Salud cardiovascular',       80,  FALSE),
  (gen_random_uuid(), 'preparacion_especifica',     'Preparación específica',     90,  FALSE),
  (gen_random_uuid(), 'entrenamiento_cardiovascular','Entrenamiento cardiovascular',100, FALSE);

-- Step 4: Backfill plan_template_objective rows.
-- Store the desired (template_id, new routine_objective_id) pairs using
-- "closest match" between old client_objective codes and new routine codes.
-- Mapping:
--   ganancia_muscular    → hipertrofia
--   perdida_de_peso      → entrenamiento_cardiovascular
--   recomposicion_corporal → hipertrofia
--   mejora_rendimiento   → potencia
--   salud_bienestar      → salud_cardiovascular
--   sin_objetivo_definido → (no match — rows are removed)
CREATE TEMP TABLE _pto_backfill AS
SELECT DISTINCT
  pto.template_id,
  ro.id AS new_objective_id
FROM plan_template_objective pto
JOIN client_objective co ON co.id = pto.objective_id
JOIN routine_objective ro ON ro.code = CASE co.code
  WHEN 'ganancia_muscular'     THEN 'hipertrofia'
  WHEN 'perdida_de_peso'       THEN 'entrenamiento_cardiovascular'
  WHEN 'recomposicion_corporal'THEN 'hipertrofia'
  WHEN 'mejora_rendimiento'    THEN 'potencia'
  WHEN 'salud_bienestar'       THEN 'salud_cardiovascular'
  ELSE NULL
END
WHERE co.code NOT IN ('sin_objetivo_definido');

-- Clear all existing rows (FK to client_objective is still active here).
DELETE FROM plan_template_objective;

-- Drop the old FK that referenced client_objective.
ALTER TABLE "plan_template_objective"
DROP CONSTRAINT "plan_template_objective_objective_id_fkey";

-- Reinsert backfilled rows (now pointing to routine_objective).
INSERT INTO plan_template_objective (id, template_id, objective_id, created_at)
SELECT gen_random_uuid(), template_id, new_objective_id, NOW()
FROM _pto_backfill;

DROP TABLE _pto_backfill;

-- Step 5: Add the new FK from plan_template_objective → routine_objective.
ALTER TABLE "plan_template_objective"
ADD CONSTRAINT "plan_template_objective_objective_id_fkey"
  FOREIGN KEY ("objective_id") REFERENCES "routine_objective"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
