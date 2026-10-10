export const CREATED_AT = '2026-01-02T03:04:05.000Z';
export const UPDATED_AT = '2026-02-03T04:05:06.000Z';
export const EXPIRES_AT = '2026-01-03T03:04:05.000Z';
export const STARTED_AT = '2026-10-09T08:00:00.000Z';
export const SESSION_DATE = '2026-10-09';
export const BIRTH_DATE = '1990-01-02';

export const CLIENT_ID = '11111111-1111-4111-8111-111111111111';
export const ORGANIZATION_ID = '22222222-2222-4222-8222-222222222222';
export const COACH_MEMBERSHIP_ID = '33333333-3333-4333-8333-333333333333';
export const OBJECTIVE_ID = '44444444-4444-4444-8444-444444444444';
export const TEMPLATE_ID = '55555555-5555-4555-8555-555555555555';
export const DAY_ID = '66666666-6666-4666-8666-666666666666';
export const EXERCISE_ROW_ID = '77777777-7777-4777-8777-777777777777';
export const SESSION_ID = '88888888-8888-4888-8888-888888888888';
export const THREAD_ID = '99999999-9999-4999-8999-999999999999';
export const MESSAGE_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
export const ITEM_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

export const AVATAR_URL = 'http://localhost:8080/assets/avatars/pixar-robot-neutral.svg';

export const clientListExample = {
  items: [
    {
      allergies: null,
      avatarUrl: AVATAR_URL,
      birthDate: BIRTH_DATE,
      coachMembershipId: COACH_MEMBERSHIP_ID,
      considerations: null,
      createdAt: CREATED_AT,
      email: 'cliente@example.com',
      fcMax: null,
      fcRest: null,
      firstName: 'Ana',
      fitnessLevel: null,
      heightCm: 170,
      hipCm: null,
      id: CLIENT_ID,
      injuries: null,
      lastName: 'García',
      notes: null,
      objective: 'Fuerza',
      objectiveId: OBJECTIVE_ID,
      organizationId: ORGANIZATION_ID,
      phone: null,
      progressPhotos: [],
      secondaryObjectives: [],
      sex: null,
      trainingPlanId: null,
      updatedAt: UPDATED_AT,
      waistCm: null,
      weightKg: 68,
    },
  ],
};

export const strengthPlanListExample = {
  items: [
    {
      coachMembershipId: COACH_MEMBERSHIP_ID,
      createdAt: CREATED_AT,
      days: [
        {
          dayIndex: 1,
          exercises: [
            {
              displayName: 'Sentadilla',
              exerciseLibraryId: null,
              fieldModes: [{ fieldKey: 'repsMin', mode: 'COACH_INPUT' }],
              id: EXERCISE_ROW_ID,
              notes: null,
              prescription: {
                defaultWeightRange: { maxKg: null, minKg: null },
                perSetWeightRanges: [],
                repsMax: 8,
                repsMin: 6,
                restSeconds: 90,
                setsPlanned: 3,
                targetRir: 2,
                targetRpe: null,
              },
              sortOrder: 0,
            },
          ],
          id: DAY_ID,
          title: 'Día 1',
        },
      ],
      id: TEMPLATE_ID,
      name: 'Fuerza base',
      scope: 'COACH',
      templateVersion: 1,
      updatedAt: UPDATED_AT,
    },
  ],
};

export const strengthPlanSummaryExample = {
  createdAt: CREATED_AT,
  days: [],
  id: TEMPLATE_ID,
  kind: 'STRENGTH',
  name: 'Fuerza base',
  scope: 'COACH',
  templateVersion: 1,
  updatedAt: UPDATED_AT,
};

export const sessionExample = {
  clientId: CLIENT_ID,
  finishComment: null,
  finishedAt: null,
  id: SESSION_ID,
  isCompleted: false,
  isIncomplete: false,
  items: [
    {
      coachInstructions: null,
      displayName: 'Sentadilla',
      groupId: null,
      groupType: null,
      id: ITEM_ID,
      lockedFields: [],
      logs: [],
      notes: null,
      plannedSets: [{ advancedTechnique: null, note: null, setIndex: 1 }],
      repsMax: 8,
      repsMin: 6,
      restSeconds: 90,
      setsPlanned: 3,
      sortOrder: 0,
      sourceExerciseId: null,
      targetRir: 2,
      targetRpe: null,
      type: 'strength',
      weightRangeMaxKg: null,
      weightRangeMinKg: null,
      youtubeUrl: null,
    },
  ],
  postFatigue: null,
  postMood: null,
  postPain: null,
  preFatigue: null,
  preMotivation: null,
  preRecovery: null,
  sessionDate: SESSION_DATE,
  sessionRpe: null,
  startMode: null,
  startedAt: STARTED_AT,
  status: 'IN_PROGRESS',
  templateId: TEMPLATE_ID,
  templateVersion: 1,
};

export const chatMessagesExample = [
  {
    attachments: [],
    callProposal: null,
    createdAt: CREATED_AT,
    expiresAt: EXPIRES_AT,
    id: MESSAGE_ID,
    senderRole: 'COACH',
    senderSubject: 'coach-subject',
    text: 'Nos vemos en la sesión',
    threadId: THREAD_ID,
  },
];
