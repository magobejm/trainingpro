import { z } from 'zod';

const nullableNumber = z.number().nullable();
const nullableString = z.string().nullable();
const groupType = z.enum(['CIRCUIT', 'SUPERSET']).nullable();

export const plannedSetSchema = z
  .object({
    advancedTechnique: nullableString,
    durationSeconds: nullableNumber.optional(),
    fcMaxPct: nullableNumber.optional(),
    fcReservePct: nullableNumber.optional(),
    heartRate: nullableNumber.optional(),
    note: nullableString,
    reps: nullableNumber.optional(),
    restSeconds: nullableNumber.optional(),
    rir: nullableNumber.optional(),
    rom: nullableString.optional(),
    rpe: nullableNumber.optional(),
    setIndex: z.number(),
    weightKg: nullableNumber.optional(),
  })
  .strict();

const setLogSchema = z
  .object({
    effortRir: nullableNumber,
    effortRpe: nullableNumber,
    repsDone: nullableNumber,
    restSecondsDone: nullableNumber,
    sessionItemId: z.string(),
    setIndex: z.number(),
    weightDoneKg: nullableNumber,
  })
  .strict();

const strengthItemSchema = z
  .object({
    coachInstructions: nullableString,
    displayName: z.string(),
    groupId: nullableString,
    groupType,
    id: z.string(),
    lockedFields: z.array(z.string()),
    logs: z.array(setLogSchema),
    notes: nullableString,
    plannedSets: z.array(plannedSetSchema),
    repsMax: nullableNumber,
    repsMin: nullableNumber,
    restSeconds: nullableNumber,
    setsPlanned: nullableNumber,
    sortOrder: z.number(),
    sourceExerciseId: nullableString,
    targetRir: nullableNumber,
    targetRpe: nullableNumber,
    type: z.literal('strength'),
    weightRangeMaxKg: nullableNumber,
    weightRangeMinKg: nullableNumber,
    youtubeUrl: nullableString,
  })
  .strict();

const plioLogSchema = z
  .object({
    durationSecondsDone: nullableNumber,
    effortRpe: nullableNumber,
    repsDone: nullableNumber,
    restSecondsDone: nullableNumber,
    sessionPlioBlockId: z.string(),
    setIndex: z.number(),
    weightDoneKg: nullableNumber,
  })
  .strict();

const plioItemSchema = z
  .object({
    coachInstructions: nullableString,
    displayName: z.string(),
    groupId: nullableString,
    groupType,
    id: z.string(),
    lockedFields: z.array(z.string()),
    logs: z.array(plioLogSchema),
    notes: nullableString,
    plannedSets: z.array(plannedSetSchema),
    restSeconds: z.number(),
    roundsPlanned: z.number(),
    sortOrder: z.number(),
    targetRpe: nullableNumber,
    type: z.literal('plio'),
    workSeconds: z.number(),
    youtubeUrl: nullableString,
  })
  .strict();

const mobilityLogSchema = z
  .object({
    effortRpe: nullableNumber,
    repsDone: nullableNumber,
    restSecondsDone: nullableNumber,
    romDone: nullableString,
    sessionMobilityBlockId: z.string(),
    setIndex: z.number(),
    weightDoneKg: nullableNumber,
  })
  .strict();

const mobilityItemSchema = z
  .object({
    coachInstructions: nullableString,
    displayName: z.string(),
    groupId: nullableString,
    groupType,
    id: z.string(),
    lockedFields: z.array(z.string()),
    logs: z.array(mobilityLogSchema),
    notes: nullableString,
    plannedSets: z.array(plannedSetSchema),
    restSeconds: z.number(),
    roundsPlanned: z.number(),
    sortOrder: z.number(),
    targetRpe: nullableNumber,
    type: z.literal('mobility'),
    workSeconds: z.number(),
    youtubeUrl: nullableString,
  })
  .strict();

const isometricLogSchema = z
  .object({
    durationSecondsDone: nullableNumber,
    effortRpe: nullableNumber,
    restSecondsDone: nullableNumber,
    sessionIsometricBlockId: z.string(),
    setIndex: z.number(),
    weightDoneKg: nullableNumber,
  })
  .strict();

const isometricItemSchema = z
  .object({
    coachInstructions: nullableString,
    displayName: z.string(),
    groupId: nullableString,
    groupType,
    id: z.string(),
    lockedFields: z.array(z.string()),
    logs: z.array(isometricLogSchema),
    notes: nullableString,
    plannedSets: z.array(plannedSetSchema),
    restSeconds: nullableNumber,
    setsPlanned: nullableNumber,
    sortOrder: z.number(),
    targetRpe: nullableNumber,
    type: z.literal('isometric'),
    youtubeUrl: nullableString,
  })
  .strict();

const sportLogSchema = z
  .object({
    avgHeartRate: nullableNumber,
    durationMinutesDone: nullableNumber,
    effortRpe: nullableNumber,
    sessionSportBlockId: z.string(),
  })
  .strict();

const sportSetLogSchema = z
  .object({
    durationSecondsDone: nullableNumber,
    effortRir: nullableNumber,
    effortRpe: nullableNumber,
    heartRateDone: nullableNumber,
    hrMaxPctDone: nullableNumber,
    hrReservePctDone: nullableNumber,
    repsDone: nullableNumber,
    restSecondsDone: nullableNumber,
    romDone: nullableString,
    sessionSportBlockId: z.string(),
    setIndex: z.number(),
    weightDoneKg: nullableNumber,
  })
  .strict();

const sportItemSchema = z
  .object({
    coachInstructions: nullableString,
    displayName: z.string(),
    durationMinutes: z.number(),
    groupId: nullableString,
    groupType,
    id: z.string(),
    lockedFields: z.array(z.string()),
    log: sportLogSchema.nullable(),
    notes: nullableString,
    plannedSets: z.array(plannedSetSchema),
    setLogs: z.array(sportSetLogSchema),
    sortOrder: z.number(),
    targetRpe: nullableNumber,
    type: z.literal('sport'),
    youtubeUrl: nullableString,
  })
  .strict();

const intervalLogSchema = z
  .object({
    avgHeartRate: nullableNumber,
    distanceDoneMeters: nullableNumber,
    durationSecondsDone: nullableNumber,
    effortRpe: nullableNumber,
    intervalIndex: z.number(),
    restSecondsDone: nullableNumber,
    sessionCardioBlockId: z.string(),
  })
  .strict();

const cardioItemSchema = z
  .object({
    coachInstructions: nullableString,
    displayName: z.string(),
    groupId: nullableString,
    groupType,
    id: z.string(),
    intervalLogs: z.array(intervalLogSchema),
    lockedFields: z.array(z.string()),
    notes: nullableString,
    plannedSets: z.array(plannedSetSchema),
    restSeconds: z.number(),
    roundsPlanned: z.number(),
    sortOrder: z.number(),
    targetDistanceMeters: nullableNumber,
    targetRpe: nullableNumber,
    type: z.literal('cardio'),
    workSeconds: z.number(),
    youtubeUrl: nullableString,
  })
  .strict();

export const sessionItemSchema = z.discriminatedUnion('type', [
  cardioItemSchema,
  isometricItemSchema,
  mobilityItemSchema,
  plioItemSchema,
  sportItemSchema,
  strengthItemSchema,
]);

export const sessionViewSchema = z
  .object({
    clientId: z.string(),
    finishComment: nullableString,
    finishedAt: nullableString,
    id: z.string(),
    isCompleted: z.boolean(),
    isIncomplete: z.boolean(),
    items: z.array(sessionItemSchema),
    postFatigue: nullableNumber,
    postMood: nullableNumber,
    postPain: nullableNumber,
    preFatigue: nullableNumber,
    preMotivation: nullableNumber,
    preRecovery: nullableNumber,
    sessionDate: z.string(),
    sessionRpe: nullableNumber,
    startMode: z.enum(['INTERACTIVE', 'TIMER']).nullable(),
    startedAt: nullableString,
    status: z.enum(['COMPLETED', 'IN_PROGRESS', 'PENDING']),
    templateId: z.string(),
    templateVersion: z.number(),
  })
  .strict();

export type PlannedSet = z.infer<typeof plannedSetSchema>;
export type SetLog = z.infer<typeof setLogSchema>;
export type StrengthSessionItem = z.infer<typeof strengthItemSchema>;
export type PlioSetLog = z.infer<typeof plioLogSchema>;
export type PlioSessionItem = z.infer<typeof plioItemSchema>;
export type MobilitySetLog = z.infer<typeof mobilityLogSchema>;
export type MobilitySessionItem = z.infer<typeof mobilityItemSchema>;
export type IsometricSetLog = z.infer<typeof isometricLogSchema>;
export type IsometricSessionItem = z.infer<typeof isometricItemSchema>;
export type SportLog = z.infer<typeof sportLogSchema>;
export type SportSetLog = z.infer<typeof sportSetLogSchema>;
export type SportSessionItem = z.infer<typeof sportItemSchema>;
export type IntervalLog = z.infer<typeof intervalLogSchema>;
export type CardioSessionItem = z.infer<typeof cardioItemSchema>;
export type SessionItem = z.infer<typeof sessionItemSchema>;
export type SessionView = z.infer<typeof sessionViewSchema>;
