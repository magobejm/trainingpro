import type { BlockType, DraftBlock, DraftDay, DraftState } from './RoutinePlanner.types';
import {
  mapTemplateBlock,
  mapWarmupTemplateItemsToBlocks as mapWarmupTemplateItemsToBlocksImpl,
} from './RoutinePlanner.template-mapper';

let blockIdCounter = Date.now();
let dayIdCounter = Date.now();

export const nextBlockId = () => `b-${++blockIdCounter}`;
export const nextDayId = () => `d-${++dayIdCounter}`;

export function createEmptyDay(
  index: number,
  t: (k: string) => string,
  prefixKey = 'coach.routine.dayPrefix',
): DraftDay {
  return {
    blocks: [],
    id: nextDayId(),
    title: `${t(prefixKey)} ${index}`,
  };
}

export function createEmptyDraft(
  t: (k: string) => string,
  prefixKey = 'coach.routine.dayPrefix',
): DraftState {
  return {
    days: [createEmptyDay(1, t, prefixKey)],
    name: '',
  };
}

export function createBlock(type: BlockType, displayName: string): DraftBlock {
  const base: DraftBlock = { displayName, id: nextBlockId(), type };
  if (['cardio', 'plio', 'warmup'].includes(type)) {
    base.restSeconds = 30;
    base.roundsPlanned = 3;
    base.workSeconds = 30;
  }
  if (type === 'strength') {
    base.setsPlanned = 3;
    base.repsPlanned = 10;
    base.restSeconds = 60;
  }
  if (type === 'sport') {
    base.durationMinutes = 30;
  }
  return base;
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

function isCompleteRepsRange(value: string): boolean {
  return /^\d+(\s*-\s*\d+)?$/.test(value);
}

function fallbackToSingleValue(fallback?: number): { max: null | number; min: null | number } {
  const one = fallback ?? null;
  return { max: one, min: one };
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

function appendMeta(
  notes: string | undefined,
  meta: Record<string, null | number | string | undefined>,
) {
  const safe = Object.fromEntries(
    Object.entries(meta).filter(
      ([, value]) => value !== undefined && value !== null && value !== '',
    ),
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
  sortOrder: si,
  notes: appendMeta(b.notes, {
    ...readWarmupImportMeta(b),
    repsPorSerie: b.repsPerSeries,
  }),
});

function parseStrengthValues(b: DraftBlock) {
  const range = parseRange(b.repsRange, b.repsPlanned ?? 10);
  const perSeriesWeights = parseCsvNumbers(b.weightPerSeriesKg);
  const sharedWeight = perSeriesWeights[0] ?? null;
  const rangeList = perSeriesWeights.map((value) => ({ maxKg: value, minKg: value }));
  return {
    perSetWeightRanges: rangeList.length > 1 ? rangeList : [],
    repsMax: range.max,
    repsMin: range.min,
    restSeconds: b.restSeconds ?? 60,
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
  methodType: 'interval',
  sortOrder: si,
  notes: appendMeta(b.notes, {
    ...readWarmupImportMeta(b),
    trabajo: b.cardioWorkText,
    intensidadFcMax: b.intensityFcMax,
    intensidadFcReserva: b.intensityFcReserve,
    pulsaciones: b.heartRate,
  }),
});

function parseCardioValues(b: DraftBlock) {
  return {
    restSeconds: b.restSeconds ?? 30,
    roundsPlanned: b.roundsPlanned ?? 3,
    targetDistanceMeters: null,
    targetRpe: b.targetRpe ?? null,
    workSeconds: b.totalTimeSeconds ?? b.workSeconds ?? 30,
  };
}

const mapPlio = (b: DraftBlock, si: number) => ({
  ...parsePlioValues(b),
  displayName: b.displayName,
  plioExerciseLibraryId: b.libraryId ?? null,
  sortOrder: si,
  notes: appendMeta(b.notes, {
    ...readWarmupImportMeta(b),
    pesoKg: b.weightKg,
    rangoReps: b.repsRange,
    repeticiones: b.repsPlanned,
  }),
});

function parsePlioValues(b: DraftBlock) {
  return {
    restSeconds: b.restSeconds ?? 30,
    roundsPlanned: b.roundsPlanned ?? 3,
    targetRpe: b.targetRpe ?? null,
    workSeconds: b.workSeconds ?? 30,
  };
}

const mapWarmup = (b: DraftBlock, si: number) => ({
  ...parseWarmupValues(b),
  displayName: b.displayName,
  warmupExerciseLibraryId: b.libraryId ?? null,
  sortOrder: si,
  notes: appendMeta(b.notes, {
    ...readWarmupImportMeta(b),
    rangoReps: b.repsRange,
    repeticiones: b.repsPlanned,
  }),
});
function parseWarmupValues(b: DraftBlock) {
  return {
    restSeconds: b.restSeconds ?? 30,
    roundsPlanned: b.roundsPlanned ?? 3,
    targetRpe: b.targetRpe ?? null,
    workSeconds: b.workSeconds ?? 30,
  };
}

export function buildRoutinePayload(draft: DraftState) {
  return {
    days: draft.days.map((day, idx) => mapRoutineDay(day, idx)),
    name: draft.name,
  };
}

function mapRoutineDay(day: DraftDay, index: number) {
  const mapped = {
    cardioBlocks: [] as ReturnType<typeof mapCardio>[],
    exercises: [] as ReturnType<typeof mapStrength>[],
    plioBlocks: [] as ReturnType<typeof mapPlio>[],
    sportBlocks: [] as Array<{
      displayName: string;
      durationMinutes: number;
      notes: string;
      sortOrder: number;
      sportLibraryId: null | string;
      targetRpe: null | number;
    }>,
    warmupBlocks: [] as ReturnType<typeof mapWarmup>[],
  };
  day.blocks.forEach((block, sortOrder) => {
    if (block.type === 'strength') mapped.exercises.push(mapStrength(block, sortOrder));
    if (block.type === 'cardio') mapped.cardioBlocks.push(mapCardio(block, sortOrder));
    if (block.type === 'plio') mapped.plioBlocks.push(mapPlio(block, sortOrder));
    if (block.type === 'warmup') mapped.warmupBlocks.push(mapWarmup(block, sortOrder));
    if (block.type === 'sport') mapped.sportBlocks.push(mapSport(block, sortOrder));
  });
  return {
    ...mapped,
    dayIndex: index + 1,
    title: day.title,
  };
}

function mapSport(block: DraftBlock, sortOrder: number) {
  return {
    displayName: block.displayName,
    durationMinutes: block.durationMinutes ?? 30,
    notes: block.notes ?? '',
    sortOrder,
    sportLibraryId: block.libraryId ?? null,
    targetRpe: block.targetRpe ?? null,
  };
}

function readWarmupImportMeta(block: DraftBlock): Record<string, number | string | undefined> {
  return {
    deCalentamiento: block.fromWarmupTemplate ? 1 : undefined,
    nombreCalentamiento: block.warmupTemplateName,
  };
}

interface TemplateBlockData {
  displayName: string;
  sortOrder: number;
  [key: string]: unknown;
}

interface TemplateDayData {
  title: string;
  exercises?: TemplateBlockData[];
  cardioBlocks?: TemplateBlockData[];
  plioBlocks?: TemplateBlockData[];
  warmupBlocks?: TemplateBlockData[];
  sportBlocks?: TemplateBlockData[];
}

interface TemplateData {
  name: string;
  scope: string;
  days: TemplateDayData[];
}

function mapBlocksFromTemplate(d: TemplateDayData): DraftBlock[] {
  const types: BlockType[] = ['strength', 'cardio', 'plio', 'warmup', 'sport'];
  const keys: (keyof TemplateDayData)[] = [
    'exercises',
    'cardioBlocks',
    'plioBlocks',
    'warmupBlocks',
    'sportBlocks',
  ];
  const blocks: DraftBlock[] = [];

  keys.forEach((key, idx) => {
    const type = types[idx] as BlockType;
    const items = d[key] as TemplateBlockData[] | undefined;
    (items ?? []).forEach((item) => {
      blocks.push(mapTemplateBlock(type, item, createBlock));
    });
  });

  return blocks.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

export function mapWarmupTemplateItemsToBlocks(
  items: Array<{ blockType: 'cardio' | 'mobility' | 'plio' | 'strength'; [key: string]: unknown }>,
): DraftBlock[] {
  return mapWarmupTemplateItemsToBlocksImpl(items, createBlock, nextBlockId);
}

export function mapTemplateToDraft(tpl: TemplateData): DraftState {
  return {
    days: tpl.days.map((d) => ({
      blocks: mapBlocksFromTemplate(d),
      id: nextDayId(),
      title: d.title,
    })),
    name: tpl.name,
    scope: tpl.scope as 'COACH' | 'GLOBAL',
  };
}
