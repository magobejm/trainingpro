import type { BlockType, DraftBlock, DraftDay, DraftState } from './RoutinePlanner.types';

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
  notes: appendMeta(b.notes, { repsPorSerie: b.repsPerSeries }),
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
  notes: appendMeta(b.notes, { pesoKg: b.weightKg }),
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
  notes: b.notes ?? '',
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
    days: draft.days.map((day, idx) => ({
      dayIndex: idx + 1,
      exercises: day.blocks.filter((b) => b.type === 'strength').map(mapStrength),
      cardioBlocks: day.blocks.filter((b) => b.type === 'cardio').map(mapCardio),
      plioBlocks: day.blocks.filter((b) => b.type === 'plio').map(mapPlio),
      warmupBlocks: day.blocks.filter((b) => b.type === 'warmup').map(mapWarmup),
      sportBlocks: day.blocks
        .filter((b) => b.type === 'sport')
        .map((b, si) => ({
          displayName: b.displayName,
          sportLibraryId: b.libraryId ?? null,
          durationMinutes: b.durationMinutes ?? 30,
          sortOrder: si,
          targetRpe: b.targetRpe ?? null,
          notes: b.notes ?? '',
        })),
      title: day.title,
    })),
    name: draft.name,
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

/** Maps the per-type FK field name to the generic `libraryId` on DraftBlock. */
function extractLibraryId(type: BlockType, item: TemplateBlockData): string | undefined {
  const fieldMap: Record<BlockType, string> = {
    strength: 'exerciseLibraryId',
    cardio: 'cardioMethodLibraryId',
    plio: 'plioExerciseLibraryId',
    warmup: 'warmupExerciseLibraryId',
    sport: 'sportLibraryId',
  };
  const val = item[fieldMap[type]];
  return typeof val === 'string' ? val : undefined;
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
      const libraryId = extractLibraryId(type, item);
      blocks.push({
        ...createBlock(type, item.displayName),
        ...item,
        type,
        ...(libraryId ? { libraryId } : {}),
      } as DraftBlock);
    });
  });

  return blocks.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
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
