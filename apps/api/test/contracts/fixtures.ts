import type { ChatMessageView } from '../../src/modules/chat/domain/chat.repository.port';
import type { Client } from '../../src/modules/clients/domain/client';
import type { PlanTemplate } from '../../src/modules/plans/domain/entities/plan-template.entity';
import type { SessionInstance } from '../../src/modules/sessions/domain/session.entity';
import {
  BIRTH_DATE,
  CLIENT_ID,
  COACH_MEMBERSHIP_ID,
  CREATED_AT,
  DAY_ID,
  EXERCISE_ROW_ID,
  EXPIRES_AT,
  ITEM_ID,
  MESSAGE_ID,
  OBJECTIVE_ID,
  ORGANIZATION_ID,
  SESSION_DATE,
  SESSION_ID,
  STARTED_AT,
  TEMPLATE_ID,
  THREAD_ID,
  UPDATED_AT,
} from '../../contracts/examples';

export function clientFixture(): Client {
  return {
    allergies: null,
    avatarUrl: null,
    birthDate: new Date(`${BIRTH_DATE}T00:00:00.000Z`),
    coachMembershipId: COACH_MEMBERSHIP_ID,
    considerations: null,
    createdAt: new Date(CREATED_AT),
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
    updatedAt: new Date(UPDATED_AT),
    waistCm: null,
    weightKg: 68,
  };
}

export function planTemplateFixture(): PlanTemplate {
  return {
    coachMembershipId: COACH_MEMBERSHIP_ID,
    createdAt: new Date(CREATED_AT),
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
    updatedAt: new Date(UPDATED_AT),
  };
}

export function sessionFixture(): SessionInstance {
  return {
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
    sessionDate: new Date(`${SESSION_DATE}T00:00:00.000Z`),
    sessionRpe: null,
    startMode: null,
    startedAt: new Date(STARTED_AT),
    status: 'IN_PROGRESS',
    templateId: TEMPLATE_ID,
    templateVersion: 1,
  };
}

export function chatMessageFixture(): ChatMessageView {
  return {
    attachments: [],
    callProposal: null,
    createdAt: new Date(CREATED_AT),
    expiresAt: new Date(EXPIRES_AT),
    id: MESSAGE_ID,
    senderRole: 'COACH',
    senderSubject: 'coach-subject',
    text: 'Nos vemos en la sesión',
    threadId: THREAD_ID,
  };
}
