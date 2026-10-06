-- Link the images accepted on the last retry pass. Only fills empty media so coach uploads are kept.

UPDATE "exercise" AS e
SET "media_url" = v.url, "media_type" = 'image'
FROM (VALUES
  ('27510c20-3f9b-4566-a7dd-ff6554126686', '/assets/exercises/27510c20-3f9b-4566-a7dd-ff6554126686.webp'),
  ('a7c83f55-ee03-46ff-ae62-ca50b0d27bc7', '/assets/exercises/a7c83f55-ee03-46ff-ae62-ca50b0d27bc7.webp'),
  ('4d783332-ac9e-4349-97c9-1e8f626be822', '/assets/exercises/4d783332-ac9e-4349-97c9-1e8f626be822.webp'),
  ('e5621648-7a29-4bfe-8edb-e6fa90072472', '/assets/exercises/e5621648-7a29-4bfe-8edb-e6fa90072472.webp'),
  ('1455ede2-2391-458f-be7f-bd45c65a5bed', '/assets/exercises/1455ede2-2391-458f-be7f-bd45c65a5bed.webp'),
  ('2d894e79-8c02-41d9-9d3f-f70b92239dfb', '/assets/exercises/2d894e79-8c02-41d9-9d3f-f70b92239dfb.webp'),
  ('6c24a200-63b9-4fec-83cd-2e5d4d6bca84', '/assets/exercises/6c24a200-63b9-4fec-83cd-2e5d4d6bca84.webp'),
  ('b648aa4c-6ffa-493f-a645-8cd92fc0ed8a', '/assets/exercises/b648aa4c-6ffa-493f-a645-8cd92fc0ed8a.webp')
) AS v(id, url)
WHERE e."id" = v.id::uuid
  AND (e."media_url" IS NULL OR e."media_url" = '');

UPDATE "plio_exercise" AS t
SET "media_url" = v.url, "media_type" = 'image'
FROM (VALUES
  ('Plyo Push-up', '/assets/exercises/a6ef197a-afb3-4f43-90ac-18f99ad1914f.webp')
) AS v(name, url)
WHERE t."name" = v.name
  AND t."scope" = 'GLOBAL'
  AND (t."media_url" IS NULL OR t."media_url" = '');

UPDATE "sport" AS t
SET "media_url" = v.url
FROM (VALUES
  ('Cluster', '/assets/exercises/bbdaecd2-322b-4d4a-8309-9e4aa8df5f56.webp'),
  ('Toes to Bar', '/assets/exercises/992e4c77-de7e-4520-aaef-0560d6a50df7.webp')
) AS v(name, url)
WHERE t."name" = v.name
  AND t."scope" = 'GLOBAL'
  AND (t."media_url" IS NULL OR t."media_url" = '');

UPDATE "mobility_exercise" AS t
SET "media_url" = v.url, "media_type" = 'image'
FROM (VALUES
  ('"No Money" drill', '/assets/exercises/229e1145-32b5-43a7-bda9-1c0dcbaf4b21.webp'),
  ('Cat-Cow (Gato-Camello)', '/assets/exercises/26e09cf5-7d26-41e5-955e-504415585c05.webp'),
  ('Círculos cervicales (CARs)', '/assets/exercises/64ebf3a2-669a-4d13-b992-a9c11cf0043a.webp'),
  ('Scorpion Stretch', '/assets/exercises/934ca3d5-a1ec-424d-b918-1222edc73ea7.webp')
) AS v(name, url)
WHERE t."name" = v.name
  AND t."scope" = 'GLOBAL'
  AND (t."media_url" IS NULL OR t."media_url" = '');
