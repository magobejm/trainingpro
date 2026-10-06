-- Link bundled iso images. Only fills empty media so coach uploads are kept.
UPDATE "isometric_exercise" AS t
SET "media_url" = v.url, "media_type" = 'image'
FROM (VALUES
  ('Glute Bridge Isometric Hold', '/assets/exercises/bb7d2913-b1ee-4dc2-9a9a-6a85e62fba67.webp'),
  ('Hold de Sentadilla profunda', '/assets/exercises/c8d2af3a-09bf-434a-a2a9-2a09193aed44.webp'),
  ('ISO Press contra pines (Vertical)', '/assets/exercises/4e54b506-fce6-4eee-9cee-b2db34a7d5ca.webp'),
  ('Isometric Mid-Thigh Pull (IMTP)', '/assets/exercises/3a1977ad-76f2-4796-98af-8267c1e566f1.webp'),
  ('Lateral Raise ISO Hold', '/assets/exercises/91ddad70-7b61-4442-8b73-68c1a9f11a9f.webp'),
  ('Overcoming ISO Bench Press', '/assets/exercises/6093c664-464b-4fa9-b986-bfbda43883be.webp'),
  ('Wall Sit (Sentadilla en pared)', '/assets/exercises/3aa2ff19-1816-47a6-8398-a8714532835e.webp')
) AS v(name, url)
WHERE t."name" = v.name
  AND t."scope" = 'GLOBAL'
  AND (t."media_url" IS NULL OR t."media_url" = '');
