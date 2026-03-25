-- ============================================================
-- Migration: 0028_split_routine_objectives
-- Separates client and routine objective catalogs.
-- Cleans up legacy_* entries left by migration 0016.
-- ============================================================

-- ── Step 1: Rename existing v1 client_objective codes / labels ─────────────
-- UUIDs stay the same so Client.objective_id FKs remain valid.

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

-- ── Step 2: Create the routine_objective catalog table ─────────────────────

CREATE TABLE "routine_objective" (
  "id"         UUID         NOT NULL DEFAULT gen_random_uuid(),
  "code"       VARCHAR(80)  NOT NULL,
  "label"      VARCHAR(120) NOT NULL,
  "sort_order" INTEGER      NOT NULL DEFAULT 0,
  "is_default" BOOLEAN      NOT NULL DEFAULT FALSE,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  CONSTRAINT "routine_objective_pkey"      PRIMARY KEY ("id"),
  CONSTRAINT "routine_objective_code_key"  UNIQUE ("code"),
  CONSTRAINT "routine_objective_label_key" UNIQUE ("label")
);

CREATE INDEX "idx_routine_objective_sort"    ON "routine_objective"("sort_order");
CREATE INDEX "idx_routine_objective_default" ON "routine_objective"("is_default");

-- ── Step 3: Seed the 10 routine objectives ─────────────────────────────────

INSERT INTO "routine_objective" (id, code, label, sort_order, is_default) VALUES
  (gen_random_uuid(), 'fuerza_maxima',               'Fuerza máxima',               10,  FALSE),
  (gen_random_uuid(), 'hipertrofia',                 'Hipertrofia',                 20,  FALSE),
  (gen_random_uuid(), 'potencia',                    'Potencia',                    30,  FALSE),
  (gen_random_uuid(), 'resistencia_muscular',        'Resistencia muscular',        40,  FALSE),
  (gen_random_uuid(), 'readaptacion_lesion',         'Readaptación a una lesión',   50,  FALSE),
  (gen_random_uuid(), 'prevencion_lesiones',         'Prevención de lesiones',      60,  FALSE),
  (gen_random_uuid(), 'movilidad',                   'Movilidad',                   70,  FALSE),
  (gen_random_uuid(), 'salud_cardiovascular',        'Salud cardiovascular',        80,  FALSE),
  (gen_random_uuid(), 'preparacion_especifica',      'Preparación específica',      90,  FALSE),
  (gen_random_uuid(), 'entrenamiento_cardiovascular','Entrenamiento cardiovascular', 100, FALSE);

-- ── Step 4: Backfill plan_template_objective ───────────────────────────────
-- Maps old client_objective references (v1 codes + legacy_* labels) to the
-- closest routine_objective. Handles duplicates via DISTINCT.

CREATE TEMP TABLE _pto_backfill AS
SELECT DISTINCT
  pto.template_id,
  ro.id AS new_objective_id
FROM plan_template_objective pto
JOIN client_objective co ON co.id = pto.objective_id
JOIN routine_objective ro ON ro.code = CASE
  -- ── Known v1 codes ──────────────────────────────────────────────────────
  WHEN co.code = 'ganancia_muscular'     THEN 'hipertrofia'
  WHEN co.code = 'recomposicion_corporal'THEN 'hipertrofia'
  WHEN co.code = 'perdida_de_peso'       THEN 'entrenamiento_cardiovascular'
  WHEN co.code = 'mejora_rendimiento'    THEN 'potencia'
  WHEN co.code = 'salud_bienestar'       THEN 'salud_cardiovascular'
  -- ── Label-based match for legacy_* entries ──────────────────────────────
  WHEN lower(co.label) LIKE '%fuerza%'                                   THEN 'fuerza_maxima'
  WHEN lower(co.label) LIKE '%hipertro%'                                 THEN 'hipertrofia'
  WHEN lower(co.label) LIKE '%potencia%'                                 THEN 'potencia'
  WHEN lower(co.label) LIKE '%resistencia%'                              THEN 'resistencia_muscular'
  WHEN lower(co.label) LIKE '%movilidad%'                                THEN 'movilidad'
  WHEN lower(co.label) LIKE '%cardiovasc%'                               THEN 'salud_cardiovascular'
  WHEN lower(co.label) LIKE '%lesion%' OR lower(co.label) LIKE '%lesi_n%'THEN 'readaptacion_lesion'
  WHEN lower(co.label) LIKE '%prevenci%'                                 THEN 'prevencion_lesiones'
  WHEN lower(co.label) LIKE '%perder%'                                   THEN 'entrenamiento_cardiovascular'
  WHEN lower(co.label) LIKE '%salud%'                                    THEN 'salud_cardiovascular'
  ELSE NULL
END
WHERE co.code <> 'sin_objetivo_definido';

-- Clear all rows (still under old FK to client_objective).
DELETE FROM plan_template_objective;

-- Drop old FK.
ALTER TABLE "plan_template_objective"
DROP CONSTRAINT "plan_template_objective_objective_id_fkey";

-- Reinsert backfilled rows (now pointing to routine_objective).
INSERT INTO plan_template_objective (id, template_id, objective_id, created_at)
SELECT gen_random_uuid(), template_id, new_objective_id, NOW()
FROM _pto_backfill;

DROP TABLE _pto_backfill;

-- Add new FK: plan_template_objective → routine_objective.
ALTER TABLE "plan_template_objective"
ADD CONSTRAINT "plan_template_objective_objective_id_fkey"
  FOREIGN KEY ("objective_id") REFERENCES "routine_objective"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- ── Step 5: Clean up obsolete / legacy_* client objectives ────────────────
-- First reassign any client whose objectiveId points to a non-catalog entry.

UPDATE "client" c
SET objective_id = (
  SELECT co2.id FROM client_objective co2
  WHERE co2.code = CASE
    WHEN lower(co.label) LIKE '%muscul%'
      OR lower(co.label) LIKE '%hipertro%'
      OR lower(co.label) LIKE '%fuerza%'  THEN 'ganancia_masa_muscular'
    WHEN lower(co.label) LIKE '%perder%'
      OR lower(co.label) LIKE '%grasa%'
      OR lower(co.label) LIKE '%peso%'    THEN 'perdida_de_grasa'
    WHEN lower(co.label) LIKE '%recomp%'  THEN 'recomposicion_corporal'
    WHEN lower(co.label) LIKE '%salud%'
      OR lower(co.label) LIKE '%cardiov%'
      OR lower(co.label) LIKE '%general%' THEN 'mejora_salud'
    WHEN lower(co.label) LIKE '%rendimiento%'
      OR lower(co.label) LIKE '%resistencia%'
      OR lower(co.label) LIKE '%potencia%'THEN 'rendimiento_deportivo'
    ELSE 'sin_objetivo_definido'
  END
  LIMIT 1
)
FROM client_objective co
WHERE c.objective_id = co.id
  AND co.code NOT IN (
    'sin_objetivo_definido', 'ganancia_masa_muscular', 'perdida_de_grasa',
    'recomposicion_corporal', 'mejora_salud', 'rendimiento_deportivo'
  );

-- Delete all obsolete / legacy_* entries from client_objective.
DELETE FROM "client_objective"
WHERE code NOT IN (
  'sin_objetivo_definido', 'ganancia_masa_muscular', 'perdida_de_grasa',
  'recomposicion_corporal', 'mejora_salud', 'rendimiento_deportivo'
);
