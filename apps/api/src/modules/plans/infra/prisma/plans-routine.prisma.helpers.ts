/* eslint-disable @typescript-eslint/no-explicit-any, max-len */
import { Prisma } from '@prisma/client';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function routineTemplateInclude(): any {
  const where = { archivedAt: null };
  const orderBy = { sortOrder: 'asc' as const };
  return {
    assignedClients: {
      select: { id: true },
      where: { archivedAt: null },
    },
    days: {
      include: {
        cardioBlocks: {
          include: { fieldModes: true, sets: { orderBy: { setIndex: 'asc' as const } } },
          orderBy,
          where,
        },
        exercises: {
          include: { fieldModes: true, sets: { orderBy: { setIndex: 'asc' as const } } },
          orderBy,
          where,
        },
        exerciseGroups: {
          orderBy: { sortOrder: 'asc' as const },
        },
        isometricBlocks: {
          include: { fieldModes: true, sets: { orderBy: { setIndex: 'asc' as const } } },
          orderBy,
          where,
        },
        plioBlocks: {
          include: { fieldModes: true, sets: { orderBy: { setIndex: 'asc' as const } } },
          orderBy,
          where,
        },
        sportBlocks: {
          include: { fieldModes: true, sets: { orderBy: { setIndex: 'asc' as const } } },
          orderBy,
          where,
        },
        warmupBlocks: {
          include: { fieldModes: true, sets: { orderBy: { setIndex: 'asc' as const } } },
          orderBy,
          where,
        },
      },
      orderBy: { dayIndex: 'asc' as const },
      where,
    },
    neats: { orderBy },
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RoutineRow = any;

export type RoutineTemplateMetadata = {
  expectedCompletionDays: null | number;
  objectiveIds: string[];
  objectives: Array<{
    code: string;
    id: string;
    isDefault: boolean;
    label: string;
    sortOrder: number;
  }>;
};

export function mapRoutineTemplate(row: RoutineRow, metadata?: RoutineTemplateMetadata) {
  const r = row as any;
  const safeMetadata = metadata ?? emptyRoutineMetadata();
  return {
    assignedClientsCount: row.assignedClients.length,
    coachMembershipId: row.coachMembershipId,
    createdAt: row.createdAt,
    days: row.days.map(mapRoutineDay),
    expectedCompletionDays: safeMetadata.expectedCompletionDays,
    id: row.id,
    isAssigned: row.assignedClients.length > 0,
    name: row.name,
    neats: ((r.neats ?? []) as any[]).map((n: any) => ({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      id: n.id,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      title: n.title,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      description: n.description ?? '',
    })),
    objectiveIds: safeMetadata.objectiveIds,
    objectives: safeMetadata.objectives,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    scope: r.scope ?? 'COACH',
    templateVersion: row.templateVersion,
    updatedAt: row.updatedAt,
  };
}

export function emptyRoutineMetadata(): RoutineTemplateMetadata {
  return { expectedCompletionDays: null, objectiveIds: [], objectives: [] };
}

function mapRoutineDay(day: any) {
  return {
    cardioBlocks: (day.cardioBlocks ?? []).map(mapCardioOutput),
    dayIndex: day.dayIndex,
    exercises: (day.exercises ?? []).map(mapStrengthOutput),
    groups: (day.exerciseGroups ?? []).map(mapGroupOutput),
    id: day.id,
    isometricBlocks: (day.isometricBlocks ?? []).map(mapIsometricOutput),
    plioBlocks: (day.plioBlocks ?? []).map(mapPlioOutput),
    sportBlocks: (day.sportBlocks ?? []).map(mapSportOutput),
    title: day.title,
    warmupBlocks: (day.warmupBlocks ?? []).map(mapWarmupOutput),
  };
}

function mapGroupOutput(g: any) {
  return {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    groupType: g.groupType,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    id: g.id,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    note: g.note ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    sortOrder: g.sortOrder,
  };
}

function mapStrengthOutput(e: any) {
  return {
    displayName: e.displayName,
    exerciseLibraryId: e.exerciseLibraryId,
    fieldModes: e.fieldModes.map((m: any) => ({ fieldKey: m.fieldKey, mode: m.mode })),
    groupId: e.groupId ?? null,
    id: e.id,
    lockedFields: readLockedFields(e.lockedFieldsJson),
    notes: e.notes,
    perSetWeightRangesJson: e.perSetWeightRangesJson,
    repsMax: e.repsMax,
    repsMin: e.repsMin,
    restSeconds: e.restSeconds,
    sets: e.sets.map(mapStrengthSetOutput),
    setsPlanned: e.setsPlanned,
    sortOrder: e.sortOrder,
    targetRir: e.targetRir,
    targetRpe: e.targetRpe,
    weightRangeMaxKg: e.weightRangeMaxKg ? Number(e.weightRangeMaxKg) : null,
    weightRangeMinKg: e.weightRangeMinKg ? Number(e.weightRangeMinKg) : null,
  };
}

function mapStrengthSetOutput(s: any) {
  return {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    advancedTechnique: s.advancedTechnique ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    note: s.note ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    reps: s.reps ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    restSeconds: s.restSeconds ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    rir: s.rir ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    rpe: s.rpe ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    setIndex: s.setIndex,
    weightKg: s.weightKg ? Number(s.weightKg) : null,
  };
}

function mapCardioOutput(b: any) {
  return {
    cardioMethodLibraryId: b.cardioMethodLibraryId,
    displayName: b.displayName,
    fieldModes: b.fieldModes.map((m: any) => ({ fieldKey: m.fieldKey, mode: m.mode })),
    groupId: b.groupId ?? null,
    id: b.id,
    lockedFields: readLockedFields(b.lockedFieldsJson),
    notes: b.notes,
    restSeconds: b.restSeconds,
    roundsPlanned: b.roundsPlanned,
    sets: b.sets.map(mapCardioSetOutput),
    sortOrder: b.sortOrder,
    targetDistanceMeters: b.targetDistanceMeters,
    targetRpe: b.targetRpe,
    workSeconds: b.workSeconds,
  };
}

function mapCardioSetOutput(s: any) {
  return {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    fcMaxPct: s.fcMaxPct ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    fcReservePct: s.fcReservePct ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    heartRate: s.heartRate ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    note: s.note ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    rpe: s.rpe ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    setIndex: s.setIndex,
  };
}

function mapPlioOutput(b: any) {
  return {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    displayName: b.displayName,
    fieldModes: ((b.fieldModes ?? []) as any[]).map((m: any) => ({ fieldKey: m.fieldKey, mode: m.mode })),
    groupId: b.groupId ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    id: b.id,
    lockedFields: readLockedFields(b.lockedFieldsJson),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    notes: b.notes,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    plioExerciseLibraryId: b.plioExerciseLibraryId,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    restSeconds: b.restSeconds,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    roundsPlanned: b.roundsPlanned,
    sets: ((b.sets ?? []) as any[]).map(mapPlioSetOutput),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    sortOrder: b.sortOrder,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    targetRpe: b.targetRpe,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    workSeconds: b.workSeconds,
  };
}

function mapPlioSetOutput(s: any) {
  return {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    note: s.note ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    reps: s.reps ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    restSeconds: s.restSeconds ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    rpe: s.rpe ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    setIndex: s.setIndex,
    weightKg: s.weightKg ? Number(s.weightKg) : null,
  };
}

function mapWarmupOutput(b: any) {
  return {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    displayName: b.displayName,
    fieldModes: ((b.fieldModes ?? []) as any[]).map((m: any) => ({ fieldKey: m.fieldKey, mode: m.mode })),
    groupId: b.groupId ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    id: b.id,
    lockedFields: readLockedFields(b.lockedFieldsJson),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    notes: b.notes,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    restSeconds: b.restSeconds,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    roundsPlanned: b.roundsPlanned,
    sets: ((b.sets ?? []) as any[]).map(mapWarmupSetOutput),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    sortOrder: b.sortOrder,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    targetRpe: b.targetRpe,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    warmupExerciseLibraryId: b.warmupExerciseLibraryId,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    workSeconds: b.workSeconds,
  };
}

function mapWarmupSetOutput(s: any) {
  return {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    note: s.note ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    reps: s.reps ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    restSeconds: s.restSeconds ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    rom: s.rom ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    rpe: s.rpe ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    setIndex: s.setIndex,
  };
}

function mapSportOutput(b: any) {
  return {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    displayName: b.displayName,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    durationMinutes: b.durationMinutes,
    fieldModes: ((b.fieldModes ?? []) as any[]).map((m: any) => ({ fieldKey: m.fieldKey, mode: m.mode })),
    groupId: b.groupId ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    id: b.id,
    lockedFields: readLockedFields(b.lockedFieldsJson),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    notes: b.notes,
    sets: ((b.sets ?? []) as any[]).map(mapSportSetOutput),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    sortOrder: b.sortOrder,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    sportLibraryId: b.sportLibraryId,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    targetRpe: b.targetRpe,
  };
}

function mapSportSetOutput(s: any) {
  return {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    fcMaxPct: s.fcMaxPct ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    fcReservePct: s.fcReservePct ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    heartRate: s.heartRate ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    note: s.note ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    reps: s.reps ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    restSeconds: s.restSeconds ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    rir: s.rir ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    rpe: s.rpe ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    setIndex: s.setIndex,
    weightKg: s.weightKg ? Number(s.weightKg) : null,
  };
}

function mapIsometricOutput(b: any) {
  return {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    displayName: b.displayName,
    fieldModes: ((b.fieldModes ?? []) as any[]).map((m: any) => ({ fieldKey: m.fieldKey, mode: m.mode })),
    groupId: b.groupId ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    id: b.id,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    isometricExerciseLibraryId: b.isometricExerciseLibraryId,
    lockedFields: readLockedFields(b.lockedFieldsJson),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    notes: b.notes,
    sets: ((b.sets ?? []) as any[]).map(mapIsometricSetOutput),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    setsPlanned: b.setsPlanned ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    sortOrder: b.sortOrder,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    targetRpe: b.targetRpe,
  };
}

function mapIsometricSetOutput(s: any) {
  return {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    durationSeconds: s.durationSeconds ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    note: s.note ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    restSeconds: s.restSeconds ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    rpe: s.rpe ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    setIndex: s.setIndex,
    weightKg: s.weightKg ? Number(s.weightKg) : null,
  };
}

/* ── Utilities ── */

export function connectOptional(id: null | string | undefined) {
  return id ? { connect: { id } } : undefined;
}

export function normalizeText(v: null | string | undefined): null | string {
  const t = v?.trim();
  return t || null;
}

export function normalizePerSetRanges(
  ranges?: { maxKg?: null | number; minKg?: null | number }[],
): Prisma.InputJsonValue | undefined {
  if (!ranges || ranges.length === 0) return undefined;
  return ranges.map((r) => ({
    maxKg: r.maxKg ?? null,
    minKg: r.minKg ?? null,
  })) as Prisma.InputJsonValue;
}

export function toDecimal(v: null | number | undefined) {
  return typeof v === 'number' ? new Prisma.Decimal(v) : null;
}

function readLockedFields(json: unknown): string[] {
  if (!Array.isArray(json)) return [];
  return json.filter((item): item is string => typeof item === 'string');
}

export function normalizeLockedFields(fields?: string[]): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (!fields || fields.length === 0) return Prisma.JsonNull;
  return fields as unknown as Prisma.InputJsonValue;
}
