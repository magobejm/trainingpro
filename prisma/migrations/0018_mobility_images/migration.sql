-- Link bundled mobility images. Only fills empty media so coach uploads are kept.
UPDATE "mobility_exercise" AS t
SET "media_url" = v.url, "media_type" = 'image'
FROM (VALUES
  ('Band Pull-aparts', '/assets/exercises/9eb20298-3018-47c1-b8eb-6606de4776a3.webp'),
  ('Child''s Pose', '/assets/exercises/a4e97850-d0e3-4967-92bb-c0ad65ff8fdb.webp'),
  ('Círculos de brazos', '/assets/exercises/b2c3d4e5-0002-4000-8000-000000000005.webp'),
  ('Clamshell', '/assets/exercises/b2c3d4e5-0002-4000-8000-000000000013.webp'),
  ('Cobra Stretch', '/assets/exercises/fc0449cb-4bb5-47eb-b64f-77ee81bca61f.webp'),
  ('Cossack Squat asistida', '/assets/exercises/573bf70a-8072-4366-b8d4-f3075714b678.webp'),
  ('Couch Stretch', '/assets/exercises/32add5d4-4f98-4b02-aaa3-26fd740372e2.webp'),
  ('Dislocaciones de hombro', '/assets/exercises/e530c09b-22ef-4064-934e-d91d2f6d5566.webp'),
  ('Distracción de cadera con banda', '/assets/exercises/899dc50a-4102-4162-926b-1922b37d3d28.webp'),
  ('Distracción de tobillo con banda', '/assets/exercises/41b0faea-86b5-4452-84fc-a5e3b64c993f.webp'),
  ('Estiramiento excéntrico de gemelo', '/assets/exercises/f81571b0-19e6-40be-9489-57840fa1ece3.webp'),
  ('Estiramientos de antebrazo', '/assets/exercises/930b0ffe-970d-47e1-b188-183d4c611f71.webp'),
  ('Extensión torácica (Rodillo)', '/assets/exercises/48eb032a-e93b-4e43-9cab-7291d2172ef9.webp'),
  ('Facepull (Movilidad)', '/assets/exercises/83de069d-d971-48f0-bcc6-f2bfb547df7b.webp'),
  ('Flexión plantar/dorsal con banda', '/assets/exercises/63a0ab08-cabe-4e3a-9da5-95e0bc1bcdda.webp'),
  ('Foam roller (columna / cadera)', '/assets/exercises/b2c3d4e5-0002-4000-8000-000000000014.webp'),
  ('Glute bridge', '/assets/exercises/b2c3d4e5-0002-4000-8000-000000000012.webp'),
  ('High knees', '/assets/exercises/b2c3d4e5-0002-4000-8000-000000000006.webp'),
  ('Inchworm', '/assets/exercises/b2c3d4e5-0002-4000-8000-000000000010.webp'),
  ('Inversión/Eversión con banda', '/assets/exercises/34102720-f5b4-4d1b-a99c-59d21e6c2e31.webp'),
  ('Jefferson Curl', '/assets/exercises/8ca2ce13-27ec-4fa5-9352-3d9c5c8ad674.webp'),
  ('Jump rope suave', '/assets/exercises/b2c3d4e5-0002-4000-8000-000000000015.webp'),
  ('Leg swings frontales', '/assets/exercises/b2c3d4e5-0002-4000-8000-000000000007.webp'),
  ('Leg swings laterales', '/assets/exercises/b2c3d4e5-0002-4000-8000-000000000008.webp'),
  ('Masaje miofascial (Rodillo)', '/assets/exercises/d923e622-e153-43e3-8106-c22081fad972.webp'),
  ('Petersen Step-up', '/assets/exercises/3dc61959-65ad-4b3b-b702-fb7d7d86f2d4.webp'),
  ('Pronación/Supinación', '/assets/exercises/d5d15279-e23c-492d-bae8-ffcb73a2fdcc.webp'),
  ('Rotaciones de cadera', '/assets/exercises/b2c3d4e5-0002-4000-8000-000000000004.webp'),
  ('Scapular Push-ups', '/assets/exercises/0c4279b9-a6a0-4598-af72-66aaeabcf415.webp'),
  ('Sentadilla aérea (control)', '/assets/exercises/b2c3d4e5-0002-4000-8000-000000000011.webp'),
  ('Skiping', '/assets/exercises/b2c3d4e5-0002-4000-8000-000000000002.webp'),
  ('Skiping una pierna', '/assets/exercises/b2c3d4e5-0002-4000-8000-000000000003.webp'),
  ('Spanish Squat (Isométrico)', '/assets/exercises/a7691165-9b6d-4adf-a319-ff81f36a3c3d.webp'),
  ('Trote suave', '/assets/exercises/b2c3d4e5-0002-4000-8000-000000000001.webp'),
  ('World''s greatest stretch', '/assets/exercises/b2c3d4e5-0002-4000-8000-000000000009.webp'),
  ('World''s Greatest Stretch', '/assets/exercises/825490bf-9ce3-497f-9ef1-e31692e1b832.webp'),
  ('Wrist Circles', '/assets/exercises/54fc7e52-868b-4ce1-9047-c0ded339e10f.webp')
) AS v(name, url)
WHERE t."name" = v.name
  AND t."scope" = 'GLOBAL'
  AND (t."media_url" IS NULL OR t."media_url" = '');
