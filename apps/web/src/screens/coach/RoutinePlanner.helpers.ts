import type { BlockType, DraftBlock, DraftDay, DraftState } from './RoutinePlanner.types';

let blockIdCounter = Date.now();
let dayIdCounter = Date.now();

export const nextBlockId = () => `b-${++blockIdCounter}`;
export const nextDayId = () => `d-${++dayIdCounter}`;

export function createEmptyDay(index: number, t: (k: string) => string): DraftDay {
  return {
    blocks: [],
    id: nextDayId(),
    title: `${t('coach.routine.dayPrefix')} ${index}`,
  };
}

export function createEmptyDraft(t: (k: string) => string): DraftState {
  return {
    days: [createEmptyDay(1, t)],
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

const mapStrength = (b: DraftBlock, si: number) => ({
  displayName: b.displayName,
  exerciseLibraryId: b.libraryId ?? null,
  fieldModes: [{ fieldKey: 'weight', mode: 'COACH_INPUT' as const }],
  sortOrder: si,
  setsPlanned: b.setsPlanned ?? 3,
  repsPlanned: b.repsPlanned ?? 10,
  targetRir: b.targetRir ?? null,
  targetRpe: b.targetRpe ?? null,
  restSeconds: b.restSeconds ?? 60,
  notes: b.notes ?? '',
});

const mapCardio = (b: DraftBlock, si: number) => ({
  displayName: b.displayName,
  cardioMethodLibraryId: b.libraryId ?? null,
  fieldModes: [{ fieldKey: 'work', mode: 'COACH_INPUT' as const }],
  methodType: 'interval',
  restSeconds: b.restSeconds ?? 30,
  roundsPlanned: b.roundsPlanned ?? 3,
  sortOrder: si,
  targetRpe: b.targetRpe ?? null,
  workSeconds: b.workSeconds ?? 30,
  notes: b.notes ?? '',
});

const mapPlio = (b: DraftBlock, si: number) => ({
  displayName: b.displayName,
  plioExerciseLibraryId: b.libraryId ?? null,
  restSeconds: b.restSeconds ?? 30,
  roundsPlanned: b.roundsPlanned ?? 3,
  sortOrder: si,
  targetRpe: b.targetRpe ?? null,
  workSeconds: b.workSeconds ?? 30,
  notes: b.notes ?? '',
});

const mapWarmup = (b: DraftBlock, si: number) => ({
  displayName: b.displayName,
  warmupExerciseLibraryId: b.libraryId ?? null,
  restSeconds: b.restSeconds ?? 30,
  roundsPlanned: b.roundsPlanned ?? 3,
  sortOrder: si,
  targetRpe: b.targetRpe ?? null,
  workSeconds: b.workSeconds ?? 30,
  notes: b.notes ?? '',
});

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
