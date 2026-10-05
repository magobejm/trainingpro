-- Link bundled plio images. Only fills empty media so coach uploads are kept.
UPDATE "plio_exercise" AS t
SET "media_url" = v.url, "media_type" = 'image'
FROM (VALUES
  ('A-Skips', '/assets/exercises/e83aa77b-0a44-4e3d-9092-349632791b71.webp'),
  ('Approach Box Jump', '/assets/exercises/c30b1f8d-b91d-4fbd-9ba5-e01b104771bc.webp'),
  ('Bounds (Zancadas en vuelo)', '/assets/exercises/c6172249-e1e3-42af-b495-feb077804761.webp'),
  ('Box Drop to Vertical Jump', '/assets/exercises/1a93a390-a127-4187-82be-23d708a9e5bd.webp'),
  ('Broad Jump (Salto de longitud)', '/assets/exercises/d42ca28b-dd3c-445c-b95e-55b00254b451.webp'),
  ('Depth Broad Jump', '/assets/exercises/cdd7c08f-7cc2-46ff-b5a7-87498ab4905e.webp'),
  ('Depth Jump (Salto de caída)', '/assets/exercises/429aa0b4-6fea-4d7f-94f9-09282dbbbe2c.webp'),
  ('Depth Jump a Box Jump', '/assets/exercises/413f32c8-d73c-4ddd-b1fd-b038095e22de.webp'),
  ('Hops sobre micro-vallas', '/assets/exercises/7883c1a8-4fdb-42bb-b389-c7f3d228171c.webp'),
  ('Hurdle Hops (Vallas altas)', '/assets/exercises/00b8080c-dd7f-4f1b-8faa-d4a4ec58b0e3.webp'),
  ('Jump to Landing', '/assets/exercises/264a8508-25b7-4589-9703-3c03dba81929.webp'),
  ('Kneeling Med Ball Throw', '/assets/exercises/70a06db1-7af0-4069-b12f-62c4f312da39.webp'),
  ('Lateral Box Jump', '/assets/exercises/7d363ff9-f10e-4d80-8ecf-ea435ba8f0e6.webp'),
  ('Lateral Pogo Jumps', '/assets/exercises/31cc2c8f-aa81-41f7-8904-36c0c084c5c1.webp'),
  ('Low Box Taps', '/assets/exercises/ce34a8c4-7523-4335-a06f-37cedcfe0a45.webp'),
  ('Med Ball Chest Pass', '/assets/exercises/06f69d59-ab92-4d20-b5d0-edab1397bd73.webp'),
  ('Overhead Med Ball Throw', '/assets/exercises/c37e8553-9639-4960-aa1f-28703114be01.webp'),
  ('Patinadores rítmicos', '/assets/exercises/f605227e-1d3a-4f60-843a-772774ac1d16.webp'),
  ('Pike Jumps', '/assets/exercises/43fc9bab-c5dd-4aeb-b574-d561954a839f.webp'),
  ('Pogo Jumps (tobillos)', '/assets/exercises/8fc8f40c-278a-426a-aa46-613e972745ea.webp'),
  ('Power Drop', '/assets/exercises/3003a8e3-76ef-45d1-96bd-29925482e867.webp'),
  ('Rotational Med Ball Throw', '/assets/exercises/dfa663a3-1bd1-4dee-a000-c58ebcd7c1b9.webp'),
  ('Saltos de tijera rítmicos', '/assets/exercises/69a38855-503c-4613-81bc-a0906de4c05d.webp'),
  ('Single Leg Broad Jump', '/assets/exercises/eadfc3aa-41bc-4cd0-93cd-b0426c82bc53.webp'),
  ('Single-Leg Hops', '/assets/exercises/77f83ea1-3a95-4170-a3a2-50d8f08815bb.webp'),
  ('Squat Jump with Tuck', '/assets/exercises/f73106b7-7740-479d-8a82-9667c0803ef8.webp'),
  ('Star Jumps', '/assets/exercises/223f2445-3c59-4799-956b-8c06e3975d8c.webp'),
  ('Triple salto (sin material)', '/assets/exercises/52312450-5fa6-468a-8b09-b2b6869ada5f.webp')
) AS v(name, url)
WHERE t."name" = v.name
  AND t."scope" = 'GLOBAL'
  AND (t."media_url" IS NULL OR t."media_url" = '');
