CREATE TABLE client_objective (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(80) NOT NULL UNIQUE,
  label VARCHAR(120) NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_client_objective_sort ON client_objective(sort_order);
CREATE INDEX idx_client_objective_default ON client_objective(is_default);

INSERT INTO client_objective (code, label, sort_order, is_default)
VALUES
  ('sin_objetivo_definido', 'Sin objetivo definido', 0, TRUE),
  ('perdida_de_peso', 'Perdida de peso', 10, FALSE),
  ('ganancia_muscular', 'Ganancia muscular', 20, FALSE),
  ('recomposicion_corporal', 'Recomposicion corporal', 30, FALSE),
  ('mejora_rendimiento', 'Mejora de rendimiento', 40, FALSE),
  ('salud_bienestar', 'Salud y bienestar', 50, FALSE);

INSERT INTO client_objective (code, label, sort_order, is_default)
SELECT
  CONCAT(
    'legacy_',
    substring(md5(lower(btrim(c.objective))) from 1 for 12)
  ) AS code,
  btrim(c.objective) AS label,
  1000 AS sort_order,
  FALSE AS is_default
FROM client c
WHERE c.objective IS NOT NULL
  AND btrim(c.objective) <> ''
  AND NOT EXISTS (
    SELECT 1
    FROM client_objective co
    WHERE lower(co.label) = lower(btrim(c.objective))
  )
GROUP BY btrim(c.objective);

ALTER TABLE client
  ADD COLUMN objective_id UUID;

UPDATE client c
SET objective_id = co.id
FROM client_objective co
WHERE c.objective IS NOT NULL
  AND btrim(c.objective) <> ''
  AND lower(co.label) = lower(btrim(c.objective));

UPDATE client c
SET objective_id = (
  SELECT co.id
  FROM client_objective co
  WHERE co.is_default = TRUE
  ORDER BY co.sort_order ASC, co.label ASC
  LIMIT 1
)
WHERE c.objective_id IS NULL;

ALTER TABLE client
  ALTER COLUMN objective_id SET NOT NULL;

ALTER TABLE client
  ADD CONSTRAINT fk_client_objective
  FOREIGN KEY (objective_id) REFERENCES client_objective(id)
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX idx_client_objective ON client(objective_id);

ALTER TABLE client
  DROP COLUMN objective;
