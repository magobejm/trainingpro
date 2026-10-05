-- Link bundled cardio images. Only fills empty media so coach uploads are kept.
UPDATE "cardio_method" AS t
SET "media_url" = v.url, "media_type" = 'image'
FROM (VALUES
  ('Air Bike (Assault Bike)', '/assets/exercises/87a98f49-6c88-4c59-98fb-07aa8fa224a0.webp'),
  ('Anaeróbico láctico', '/assets/exercises/70ddb095-933c-4b6e-a186-bca18aef5c87.webp'),
  ('Arc Trainer', '/assets/exercises/695315ff-8bd8-48a8-8731-06684872d696.webp'),
  ('Bicicleta de ciclo indoor', '/assets/exercises/827e882f-de5a-45a0-bd6e-70f4c34d459b.webp'),
  ('Bicicleta estática', '/assets/exercises/2f450bdd-6271-464f-8ceb-cb8f0d04fcc6.webp'),
  ('Boxer Shuffle', '/assets/exercises/5bc9fdee-3d8d-4e3b-8a6a-a7831916e2e8.webp'),
  ('Burpees', '/assets/exercises/5702867d-5cc3-4ca8-ab87-a7cb628f74f9.webp'),
  ('Cinta de correr', '/assets/exercises/27204d4f-5264-4b6c-bc2e-b8a790376667.webp'),
  ('Continuo extensivo', '/assets/exercises/eaaf0fc7-9d8f-46d3-a533-ffe3168eda91.webp'),
  ('Continuo intensivo', '/assets/exercises/29d85c1f-edcf-4ac6-9d5b-6e2e4bbc031e.webp'),
  ('Cross Jacks', '/assets/exercises/79387d42-3444-4b8f-80da-b8ca4715525c.webp'),
  ('Cross-Body Mountain Climbers', '/assets/exercises/a50b63b1-2fd1-4a12-8b3e-40b91dbb5ae2.webp'),
  ('Elíptica', '/assets/exercises/099afe7a-2a82-4fea-86ce-9f1efc26ca41.webp'),
  ('Escaladora (Stairmaster)', '/assets/exercises/cd6bea12-a4e4-44e7-b827-bf7a4a1c4673.webp'),
  ('Fartlek', '/assets/exercises/815ca0f3-434b-44d4-9ce7-6cdb2b6ce760.webp'),
  ('Gate Swings', '/assets/exercises/39f2b17d-4a82-4484-9e85-fc9612c95bb8.webp'),
  ('Grapevine', '/assets/exercises/59720076-1eb1-4d1e-96a1-815956b32b3a.webp'),
  ('Heisman Jumps', '/assets/exercises/3d953273-2f73-4198-8a0e-63a209a4de9b.webp'),
  ('HIIT corto', '/assets/exercises/5995f068-37bd-435d-849a-1ecae4bd3b24.webp'),
  ('HIIT largo', '/assets/exercises/ade93589-0689-4c68-9e77-40f37afb3b56.webp'),
  ('Inchworms', '/assets/exercises/acdcd88a-986d-4d35-b1f0-4a278f05dd43.webp'),
  ('Intervalos aeróbicos extensivos', '/assets/exercises/8f6bd57f-6ef6-47bb-b07a-5586158a8a27.webp'),
  ('Intervalos intensivos', '/assets/exercises/41523738-237f-43b1-a0a4-44bc608f8c72.webp'),
  ('Lateral Toe Taps', '/assets/exercises/3df21d65-be36-4264-9c2c-91ec705cc894.webp'),
  ('Máquina de remo', '/assets/exercises/d2ee1a1e-9af2-4341-ab04-090eb75336de.webp'),
  ('Patadas frontales de cardio', '/assets/exercises/bed43a6f-21fa-45a2-b659-70d46ff2e0ad.webp'),
  ('Patadas laterales de cardio', '/assets/exercises/4da7dc8f-eb4e-4e2d-896d-e8e87667c2ae.webp'),
  ('Plank Toads', '/assets/exercises/3d68deb5-770d-4931-97c6-a30520930b7e.webp'),
  ('Power Skips', '/assets/exercises/c1dcc09f-a444-4534-9add-c5ed214fe8c5.webp'),
  ('Rodillas arriba (High Knees)', '/assets/exercises/b832e762-64dd-43af-bacc-11727630d854.webp'),
  ('Salto de comba imaginario', '/assets/exercises/05e18807-3be5-4de0-83a0-b9d8b31a585e.webp'),
  ('Seal Jacks', '/assets/exercises/a176d025-62fa-4510-a119-0dcc32f3e391.webp'),
  ('SkiErg', '/assets/exercises/ee52970d-b867-4846-a602-09c2e6222339.webp'),
  ('Sprints laterales cortos', '/assets/exercises/f4c811da-fb3d-4886-8c22-4f663894e85e.webp'),
  ('Talones al culo (Butt Kicks)', '/assets/exercises/7d0bbbe6-955e-400b-beb9-d049d7bd3e70.webp'),
  ('Tempo / Umbral', '/assets/exercises/47e957d5-fd95-4d0a-8337-6957d522254f.webp'),
  ('Versa Climber', '/assets/exercises/66d89170-3bad-4e0c-b043-ab19a2230159.webp'),
  ('Windmill Skaters', '/assets/exercises/4d12562d-d8c0-4e45-ad1b-8a2094fdc1af.webp')
) AS v(name, url)
WHERE t."name" = v.name
  AND t."scope" = 'GLOBAL'
  AND (t."media_url" IS NULL OR t."media_url" = '');
