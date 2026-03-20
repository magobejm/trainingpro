export type WarmupTemplateItemSeed = {
  warmupExerciseLibraryId: string;
  displayName: string;
  sortOrder: number;
  roundsPlanned: number;
  setsPlanned?: number;
  repsMin?: number;
  repsMax?: number;
  workSeconds?: number;
  restSeconds?: number;
};

export type WarmupTemplateSeed = {
  id: string;
  name: string;
  items: WarmupTemplateItemSeed[];
};

export const WARMUP_TEMPLATES_V1: WarmupTemplateSeed[] = [
  {
    id: '00000079-0001-0000-0000-000000000001',
    name: 'Movilidad Tren Superior',
    items: [
      {
        warmupExerciseLibraryId: '26e09cf5-7d26-41e5-955e-504415585c05', // Cat-Cow
        displayName: 'Cat-Cow (Gato-Camello)',
        sortOrder: 0,
        roundsPlanned: 2,
        repsMin: 10,
        repsMax: 10,
        restSeconds: 15,
      },
      {
        warmupExerciseLibraryId: 'bd1b47f3-d874-4388-8757-b35381ffcfb9', // Thread the Needle
        displayName: 'Thread the Needle',
        sortOrder: 1,
        roundsPlanned: 2,
        repsMin: 8,
        repsMax: 10,
        restSeconds: 15,
      },
      {
        warmupExerciseLibraryId: '48eb032a-e93b-4e43-9cab-7291d2172ef9', // Extensión torácica (Rodillo)
        displayName: 'Extensión torácica (Rodillo)',
        sortOrder: 2,
        roundsPlanned: 1,
        workSeconds: 60,
        restSeconds: 15,
      },
      {
        warmupExerciseLibraryId: '0c4279b9-a6a0-4598-af72-66aaeabcf415', // Scapular Push-ups
        displayName: 'Scapular Push-ups',
        sortOrder: 3,
        roundsPlanned: 3,
        repsMin: 10,
        repsMax: 12,
        restSeconds: 20,
      },
      {
        warmupExerciseLibraryId: 'e530c09b-22ef-4064-934e-d91d2f6d5566', // Dislocaciones de hombro
        displayName: 'Dislocaciones de hombro',
        sortOrder: 4,
        roundsPlanned: 2,
        repsMin: 10,
        repsMax: 10,
        restSeconds: 15,
      },
      {
        warmupExerciseLibraryId: '933022bb-905f-4096-a2a8-6b303e4fa7eb', // Wall Slides
        displayName: 'Wall Slides',
        sortOrder: 5,
        roundsPlanned: 3,
        repsMin: 10,
        repsMax: 12,
        restSeconds: 20,
      },
      {
        warmupExerciseLibraryId: '930b0ffe-970d-47e1-b188-183d4c611f71', // Estiramientos de antebrazo
        displayName: 'Estiramientos de antebrazo',
        sortOrder: 6,
        roundsPlanned: 1,
        workSeconds: 45,
        restSeconds: 10,
      },
    ],
  },
  {
    id: '00000079-0002-0000-0000-000000000002',
    name: 'Movilidad Tren Inferior',
    items: [
      {
        warmupExerciseLibraryId: '26e09cf5-7d26-41e5-955e-504415585c05', // Cat-Cow
        displayName: 'Cat-Cow (Gato-Camello)',
        sortOrder: 0,
        roundsPlanned: 2,
        repsMin: 10,
        repsMax: 10,
        restSeconds: 15,
      },
      {
        warmupExerciseLibraryId: '825490bf-9ce3-497f-9ef1-e31692e1b832', // World's Greatest Stretch
        displayName: "World's Greatest Stretch",
        sortOrder: 1,
        roundsPlanned: 2,
        repsMin: 5,
        repsMax: 8,
        restSeconds: 15,
      },
      {
        warmupExerciseLibraryId: '1ddc2e4e-45d5-452a-a1a5-bc85607591a3', // 90/90 Hip Switch
        displayName: '90/90 Hip Switch',
        sortOrder: 2,
        roundsPlanned: 2,
        repsMin: 8,
        repsMax: 10,
        restSeconds: 20,
      },
      {
        warmupExerciseLibraryId: '2766580c-e4dc-4344-99de-05b3e5d80fe0', // Frog Stretch
        displayName: 'Frog Stretch',
        sortOrder: 3,
        roundsPlanned: 1,
        workSeconds: 60,
        restSeconds: 15,
      },
      {
        warmupExerciseLibraryId: '32add5d4-4f98-4b02-aaa3-26fd740372e2', // Couch Stretch
        displayName: 'Couch Stretch',
        sortOrder: 4,
        roundsPlanned: 1,
        workSeconds: 60,
        restSeconds: 15,
      },
      {
        warmupExerciseLibraryId: 'c471ee17-4d98-42ec-a623-4b755ca77409', // Pigeon Pose
        displayName: 'Pigeon Pose',
        sortOrder: 5,
        roundsPlanned: 1,
        workSeconds: 60,
        restSeconds: 15,
      },
      {
        warmupExerciseLibraryId: '573bf70a-8072-4366-b8d4-f3075714b678', // Cossack Squat asistida
        displayName: 'Cossack Squat asistida',
        sortOrder: 6,
        roundsPlanned: 3,
        repsMin: 8,
        repsMax: 10,
        restSeconds: 20,
      },
      {
        warmupExerciseLibraryId: '41b0faea-86b5-4452-84fc-a5e3b64c993f', // Distracción de tobillo con banda
        displayName: 'Distracción de tobillo con banda',
        sortOrder: 7,
        roundsPlanned: 2,
        repsMin: 10,
        repsMax: 15,
        restSeconds: 15,
      },
    ],
  },
];
