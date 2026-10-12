import type { SessionView, StrengthSessionItem } from '@trainerpro/shared';

export function sampleSession(id = 'session-1'): SessionView {
  return {
    clientId: 'client-1',
    finishComment: null,
    finishedAt: null,
    id,
    isCompleted: false,
    isIncomplete: false,
    items: [sampleStrength()],
    postFatigue: null,
    postMood: null,
    postPain: null,
    preFatigue: null,
    preMotivation: null,
    preRecovery: null,
    sessionDate: '2026-10-12',
    sessionRpe: null,
    startMode: 'INTERACTIVE',
    startedAt: '2026-10-12T08:00:00.000Z',
    status: 'IN_PROGRESS',
    templateId: 'template-1',
    templateVersion: 3,
  };
}

function sampleStrength(): StrengthSessionItem {
  return {
    coachInstructions: null,
    displayName: 'Press',
    groupId: null,
    groupType: null,
    id: 'item-1',
    lockedFields: [],
    logs: [],
    notes: null,
    plannedSets: [],
    repsMax: 8,
    repsMin: 8,
    restSeconds: 90,
    setsPlanned: 3,
    sortOrder: 1,
    sourceExerciseId: null,
    targetRir: 2,
    targetRpe: 8,
    type: 'strength',
    weightRangeMaxKg: 60,
    weightRangeMinKg: 40,
    youtubeUrl: null,
  };
}
