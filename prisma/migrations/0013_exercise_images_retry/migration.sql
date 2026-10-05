-- Link the strength images accepted on the retry pass. Only fills empty media.
UPDATE "exercise" AS e
SET "media_url" = v.url, "media_type" = 'image'
FROM (VALUES
  ('1bde33fd-fb67-4c8e-b3a8-499de1327269', '/assets/exercises/1bde33fd-fb67-4c8e-b3a8-499de1327269.webp'),
  ('1e75864c-9cd7-444d-9103-dda5cf1b1423', '/assets/exercises/1e75864c-9cd7-444d-9103-dda5cf1b1423.webp'),
  ('2219a019-5ec3-4a50-b523-03770857a450', '/assets/exercises/2219a019-5ec3-4a50-b523-03770857a450.webp'),
  ('2ade7933-fbd4-4549-aab9-a3a29c53d485', '/assets/exercises/2ade7933-fbd4-4549-aab9-a3a29c53d485.webp'),
  ('3b767f46-5d5c-4ba8-9747-962fcae2c4b2', '/assets/exercises/3b767f46-5d5c-4ba8-9747-962fcae2c4b2.webp'),
  ('3baa2ca8-0fbc-4f34-839e-ce54e2570133', '/assets/exercises/3baa2ca8-0fbc-4f34-839e-ce54e2570133.webp'),
  ('45a21b6e-39db-4b95-ad06-16b0377632fd', '/assets/exercises/45a21b6e-39db-4b95-ad06-16b0377632fd.webp'),
  ('4c5bfd2a-f7df-4c09-a74c-264e3fd21397', '/assets/exercises/4c5bfd2a-f7df-4c09-a74c-264e3fd21397.webp'),
  ('57187899-4dc9-4691-9540-f518ab2c2d17', '/assets/exercises/57187899-4dc9-4691-9540-f518ab2c2d17.webp'),
  ('63e0ad9b-5b09-4b74-8480-2dda4f9973c4', '/assets/exercises/63e0ad9b-5b09-4b74-8480-2dda4f9973c4.webp'),
  ('825a995e-8175-452d-bf5d-54ba2bf27f2b', '/assets/exercises/825a995e-8175-452d-bf5d-54ba2bf27f2b.webp'),
  ('8346caea-658b-4129-b14b-8ae74ca3aa54', '/assets/exercises/8346caea-658b-4129-b14b-8ae74ca3aa54.webp'),
  ('a0ad629f-d207-45d2-b33d-cadc1b6c69b7', '/assets/exercises/a0ad629f-d207-45d2-b33d-cadc1b6c69b7.webp'),
  ('a956f352-857d-43c0-8acb-640f3c609f0b', '/assets/exercises/a956f352-857d-43c0-8acb-640f3c609f0b.webp'),
  ('bdace07e-a5bf-4252-aabe-f252502dd721', '/assets/exercises/bdace07e-a5bf-4252-aabe-f252502dd721.webp'),
  ('d17f5386-3253-4cb3-b95a-abfdaf4465b2', '/assets/exercises/d17f5386-3253-4cb3-b95a-abfdaf4465b2.webp')
) AS v(id, url)
WHERE e."id" = v.id::uuid
  AND (e."media_url" IS NULL OR e."media_url" = '');
