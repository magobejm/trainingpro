import { TemplateKind } from '@prisma/client';

export const ROUTINE_TEMPLATES_V1 = [
  {
    id: '00000072-0001-0000-0000-000000000001',
    name: 'Sample Routine: Full Body',
    kind: TemplateKind.ROUTINE,
    days: [
      {
        title: 'Day 1: Upper Focus',
        dayIndex: 1,
        exercises: [
          {
            displayName: 'Push Ups',
            sortOrder: 0,
            fieldModes: [{ fieldKey: 'reps', mode: 'COACH_INPUT' }],
          },
        ],
        cardioBlocks: [
          {
            displayName: 'Treadmill Run',
            sortOrder: 1,
            methodType: 'constant',
            roundsPlanned: 1,
            workSeconds: 600,
            restSeconds: 0,
          },
        ],
        plioBlocks: [
          {
            displayName: 'Box Jumps',
            sortOrder: 2,
            roundsPlanned: 3,
            workSeconds: 30,
            restSeconds: 60,
          },
        ],
        warmupBlocks: [
          {
            displayName: 'Dynamic Stretching',
            sortOrder: 0,
            roundsPlanned: 1,
            workSeconds: 300,
            restSeconds: 0,
          },
        ],
        sportBlocks: [{ displayName: 'Basketball', sortOrder: 3, durationMinutes: 20 }],
      },
    ],
  },
  {
    id: '00000072-0002-0000-0000-000000000002',
    name: 'Sample Routine: Active Recovery',
    kind: TemplateKind.ROUTINE,
    days: [
      {
        title: 'Recovery Day',
        dayIndex: 1,
        exercises: [],
        cardioBlocks: [],
        plioBlocks: [],
        warmupBlocks: [
          {
            displayName: 'Yoga Flow',
            sortOrder: 0,
            roundsPlanned: 1,
            workSeconds: 1200,
            restSeconds: 0,
          },
        ],
        sportBlocks: [{ displayName: 'Swimming', sortOrder: 1, durationMinutes: 30 }],
      },
    ],
  },
];
