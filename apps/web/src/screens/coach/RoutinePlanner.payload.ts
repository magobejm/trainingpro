import { resolveLockedFields } from '@trainerpro/shared';
import type { DraftBlock, DraftDay, DraftExerciseGroup, DraftSet, DraftState } from './RoutinePlanner.types';

function isCompleteRepsRange(value: string): boolean {
  return /^\d+(\s*-\s*\d+)?$/.test(value);
}

function fallbackToSingleValue(fallback?: number): { max: null | number; min: null | number } {
  const one = fallback ?? null;
  return { max: one, min: one };
}

function parseRange(value?: string, fallback?: number): { max: null | number; min: null | number } {
  const raw = value?.trim();
  if (raw) {
    if (!isCompleteRepsRange(raw)) {
      return fallbackToSingleValue(fallback);
    }
    const parts = raw.split('-').map((item) => Number(item.trim()));
    const first = parts[0] ?? Number.NaN;
    const second = parts[1] ?? Number.NaN;
    if (Number.isFinite(first) && Number.isFinite(second)) {
      const low = Math.min(first, second);
      const high = Math.max(first, second);
      return { max: high, min: low };
    }
    if (Number.isFinite(first)) {
      return { max: first, min: first };
    }
  }
  return fallbackToSingleValue(fallback);
}

function parseCsvNumbers(value?: string): number[] {
  if (!value?.trim()) {
    return [];
  }
  return value
    .split(',')
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item) && item >= 0);
}

function appendMeta(notes: string | undefined, meta: Record<string, null | number | string | undefined>) {
  const safe = Object.fromEntries(
    Object.entries(meta).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  );
  if (Object.keys(safe).length === 0) {
    return notes ?? '';
  }
  const prefix = notes?.trim() ? `${notes.trim()}\n` : '';
  return `${prefix}[meta] ${JSON.stringify(safe)}`;
}

const mapStrength = (b: DraftBlock, si: number) => ({
  ...parseStrengthValues(b),
  displayName: b.displayName,
  exerciseLibraryId: b.libraryId ?? null,
  fieldModes: [{ fieldKey: 'weight', mode: 'COACH_INPUT' as const }],
  groupId: b.groupId ?? null,
  lockedFields: resolveLockedFields(b.type, b.lockedFields),
  sets: (b.sets ?? []).map(mapStrengthSet),
  sortOrder: si,
  notes: appendMeta(b.notes, {
    ...readWarmupImportMeta(b),
    repsPorSerie: b.repsPerSeries,
  }),
});

function mapStrengthSet(s: DraftSet) {
  return {
    setIndex: s.setIndex,
    reps: s.reps ?? null,
    rpe: s.rpe ?? null,
    weightKg: s.weightKg ?? null,
    rir: s.rir ?? null,
    restSeconds: s.restSeconds ?? null,
    advancedTechnique: s.advancedTechnique ?? null,
    note: s.note ?? null,
  };
}

function exerciseRestSeconds(block: DraftBlock, fallback: number): number {
  const fromSeries = block.sets?.[0]?.restSeconds;
  if (typeof fromSeries === 'number') return fromSeries;
  if (typeof block.restSeconds === 'number') return block.restSeconds;
  return fallback;
}

function parseStrengthValues(b: DraftBlock) {
  const range = parseRange(b.repsRange, b.repsPlanned ?? 10);
  const perSeriesWeights = parseCsvNumbers(b.weightPerSeriesKg);
  const sharedWeight = perSeriesWeights[0] ?? null;
  const rangeList = perSeriesWeights.map((value) => ({ maxKg: value, minKg: value }));
  return {
    perSetWeightRanges: rangeList.length > 1 ? rangeList : [],
    repsMax: range.max,
    repsMin: range.min,
    restSeconds: exerciseRestSeconds(b, 60),
    setsPlanned: b.setsPlanned ?? 3,
    targetRir: b.targetRir ?? null,
    targetRpe: b.targetRpe ?? null,
    weightRangeMaxKg: sharedWeight,
    weightRangeMinKg: sharedWeight,
  };
}

const mapCardio = (b: DraftBlock, si: number) => ({
  ...parseCardioValues(b),
  displayName: b.displayName,
  cardioMethodLibraryId: b.libraryId ?? null,
  fieldModes: [{ fieldKey: 'work', mode: 'COACH_INPUT' as const }],
  groupId: b.groupId ?? null,
  lockedFields: resolveLockedFields(b.type, b.lockedFields),
  methodType: 'interval',
  sets: (b.sets ?? []).map(mapCardioSet),
  sortOrder: si,
  notes: appendMeta(b.notes, {
    ...readWarmupImportMeta(b),
    intensidadFcMax: b.intensityFcMax,
    intensidadFcReserva: b.intensityFcReserve,
    pulsaciones: b.heartRate,
  }),
});

function mapCardioSet(s: DraftSet) {
  return {
    setIndex: s.setIndex,
    distanceMeters: s.distanceMeters ?? null,
    durationSeconds: s.durationSeconds ?? null,
    fcMaxPct: s.fcMaxPct ?? null,
    fcReservePct: s.fcReservePct ?? null,
    heartRate: s.heartRate ?? null,
    restSeconds: s.restSeconds ?? null,
    rpe: s.rpe ?? null,
    advancedTechnique: s.advancedTechnique ?? null,
    note: s.note ?? null,
  };
}

function parseCardioValues(b: DraftBlock) {
  return {
    restSeconds: exerciseRestSeconds(b, 30),
    roundsPlanned: b.roundsPlanned ?? 3,
    targetDistanceMeters: b.targetDistanceMeters ?? null,
    targetRpe: b.targetRpe ?? null,
    workSeconds: b.totalTimeSeconds ?? b.workSeconds ?? 30,
  };
}

const mapPlio = (b: DraftBlock, si: number) => ({
  ...parsePlioValues(b),
  displayName: b.displayName,
  groupId: b.groupId ?? null,
  lockedFields: resolveLockedFields(b.type, b.lockedFields),
  plioExerciseLibraryId: b.libraryId ?? null,
  sets: (b.sets ?? []).map(mapPlioSet),
  sortOrder: si,
  notes: appendMeta(b.notes, {
    ...readWarmupImportMeta(b),
    pesoKg: b.weightKg,
    rangoReps: b.repsRange,
    repeticiones: b.repsPlanned,
  }),
});

function mapPlioSet(s: DraftSet) {
  return {
    setIndex: s.setIndex,
    durationSeconds: s.durationSeconds ?? null,
    reps: s.reps ?? null,
    rpe: s.rpe ?? null,
    weightKg: s.weightKg ?? null,
    restSeconds: s.restSeconds ?? null,
    advancedTechnique: s.advancedTechnique ?? null,
    note: s.note ?? null,
  };
}

function parsePlioValues(b: DraftBlock) {
  return {
    restSeconds: exerciseRestSeconds(b, 30),
    roundsPlanned: b.roundsPlanned ?? 3,
    targetRpe: b.targetRpe ?? null,
    workSeconds: b.workSeconds ?? 30,
  };
}

const mapMobility = (b: DraftBlock, si: number) => ({
  ...parseMobilityValues(b),
  displayName: b.displayName,
  groupId: b.groupId ?? null,
  lockedFields: resolveLockedFields(b.type, b.lockedFields),
  mobilityExerciseLibraryId: b.libraryId ?? null,
  sets: (b.sets ?? []).map(mapMobilitySet),
  sortOrder: si,
  notes: appendMeta(b.notes, {
    ...readWarmupImportMeta(b),
    rangoReps: b.repsRange,
    repeticiones: b.repsPlanned,
  }),
});

/**
 * Payload slice for API `mobilityBlocks[].sets`.
 * Coach UI blockType is `mobility`; day warm-up templates use `warmupTemplateIds`.
 */
function mapMobilitySet(s: DraftSet) {
  return {
    setIndex: s.setIndex,
    reps: s.reps ?? null,
    rpe: s.rpe ?? null,
    rom: s.rom ?? null,
    restSeconds: s.restSeconds ?? null,
    weightKg: s.weightKg ?? null,
    advancedTechnique: s.advancedTechnique ?? null,
    note: s.note ?? null,
  };
}

function parseMobilityValues(b: DraftBlock) {
  return {
    restSeconds: exerciseRestSeconds(b, 30),
    roundsPlanned: b.roundsPlanned ?? 3,
    targetRpe: b.targetRpe ?? null,
    workSeconds: b.workSeconds ?? 30,
  };
}

function mapSport(block: DraftBlock, sortOrder: number) {
  return {
    displayName: block.displayName,
    durationMinutes: block.durationMinutes ?? 30,
    groupId: block.groupId ?? null,
    lockedFields: resolveLockedFields(block.type, block.lockedFields),
    notes: block.notes ?? '',
    sets: (block.sets ?? []).map(mapSportSet),
    sortOrder,
    sportLibraryId: block.libraryId ?? null,
    targetRpe: block.targetRpe ?? null,
  };
}

function mapSportSet(s: DraftSet) {
  return {
    setIndex: s.setIndex,
    distanceMeters: s.distanceMeters ?? null,
    durationSeconds: s.durationSeconds ?? null,
    reps: s.reps ?? null,
    rpe: s.rpe ?? null,
    rir: s.rir ?? null,
    weightKg: s.weightKg ?? null,
    fcMaxPct: s.fcMaxPct ?? null,
    fcReservePct: s.fcReservePct ?? null,
    heartRate: s.heartRate ?? null,
    restSeconds: s.restSeconds ?? null,
    rom: s.rom ?? null,
    advancedTechnique: s.advancedTechnique ?? null,
    note: s.note ?? null,
  };
}

function mapIsometric(block: DraftBlock, sortOrder: number) {
  return {
    displayName: block.displayName,
    groupId: block.groupId ?? null,
    isometricExerciseLibraryId: block.libraryId ?? null,
    lockedFields: resolveLockedFields(block.type, block.lockedFields),
    notes: block.notes ?? '',
    restSeconds: exerciseRestSeconds(block, 0),
    sets: (block.sets ?? []).map(mapIsometricSet),
    setsPlanned: block.setsPlanned ?? null,
    sortOrder,
    targetRpe: block.targetRpe ?? null,
  };
}

function mapIsometricSet(s: DraftSet) {
  return {
    setIndex: s.setIndex,
    rpe: s.rpe ?? null,
    durationSeconds: s.durationSeconds ?? null,
    weightKg: s.weightKg ?? null,
    restSeconds: s.restSeconds ?? null,
    advancedTechnique: s.advancedTechnique ?? null,
    note: s.note ?? null,
  };
}

export function buildRoutinePayload(draft: DraftState) {
  return {
    days: draft.days.map((day, idx) => mapRoutineDay(day, idx)),
    expectedCompletionDays: draft.expectedCompletionDays ?? null,
    name: draft.name,
    neats: (draft.neats ?? []).map((n) => ({ title: n.title, description: n.description ?? '' })),
    objectiveIds: draft.objectiveIds ?? [],
  };
}

function mapRoutineDay(day: DraftDay, index: number) {
  const mapped = {
    cardioBlocks: [] as ReturnType<typeof mapCardio>[],
    exercises: [] as ReturnType<typeof mapStrength>[],
    groups: (day.groups ?? []).map(mapGroup),
    isometricBlocks: [] as ReturnType<typeof mapIsometric>[],
    plioBlocks: [] as ReturnType<typeof mapPlio>[],
    sportBlocks: [] as ReturnType<typeof mapSport>[],
    mobilityBlocks: [] as ReturnType<typeof mapMobility>[],
  };
  day.blocks.forEach((block, sortOrder) => {
    if (block.type === 'strength') mapped.exercises.push(mapStrength(block, sortOrder));
    if (block.type === 'cardio') mapped.cardioBlocks.push(mapCardio(block, sortOrder));
    if (block.type === 'plio') mapped.plioBlocks.push(mapPlio(block, sortOrder));
    if (block.type === 'mobility') mapped.mobilityBlocks.push(mapMobility(block, sortOrder));
    if (block.type === 'sport') mapped.sportBlocks.push(mapSport(block, sortOrder));
    if (block.type === 'isometric') mapped.isometricBlocks.push(mapIsometric(block, sortOrder));
  });
  return {
    ...mapped,
    dayIndex: index + 1,
    notes: day.notes ?? null,
    notesTitle: day.notesTitle ?? null,
    title: day.title,
    warmupTemplateIds: (day.warmupTemplates ?? []).map((t) => t.id),
  };
}

function mapGroup(group: DraftExerciseGroup) {
  return {
    clientId: group.id,
    groupType: group.groupType,
    note: group.note ?? null,
    sortOrder: group.sortOrder,
  };
}

function readWarmupImportMeta(block: DraftBlock): Record<string, number | string | undefined> {
  return {
    deCalentamiento: block.fromWarmupTemplate ? 1 : undefined,
    nombreCalentamiento: block.warmupTemplateName,
  };
}
