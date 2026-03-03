import type { BlockType, DraftBlock } from './RoutinePlanner.types';

type MetaMap = Record<string, unknown>;
type TemplateBlockData = {
  displayName: string;
  sortOrder: number;
  [key: string]: unknown;
};

const META_MARKER = '[meta]';

export function mapTemplateBlock(
  type: BlockType,
  item: TemplateBlockData,
  createBlock: (blockType: BlockType, displayName: string) => DraftBlock,
): DraftBlock {
  const metaParsed = parseMetaNotes(item.notes);
  const base = {
    ...createBlock(type, item.displayName),
    displayName: item.displayName,
    libraryId: extractLibraryId(type, item),
    notes: metaParsed.baseNotes,
    sortOrder: toNumber(item.sortOrder),
    targetRpe: toNumber(item.targetRpe),
    type,
  } as DraftBlock;
  if (type === 'strength') return mapStrengthBlock(base, item, metaParsed.meta);
  if (type === 'cardio') return mapCardioBlock(base, item, metaParsed.meta);
  if (type === 'plio') return mapPlioBlock(base, item, metaParsed.meta);
  if (type === 'warmup') return mapWarmupBlock(base, item, metaParsed.meta);
  return { ...base, durationMinutes: toNumber(item.durationMinutes) };
}

export function mapWarmupTemplateItemsToBlocks(
  items: Array<{
    blockType: 'cardio' | 'mobility' | 'plio' | 'strength';
    [key: string]: unknown;
  }>,
  createBlock: (blockType: BlockType, displayName: string) => DraftBlock,
  nextBlockId: () => string,
): DraftBlock[] {
  return items
    .map((item) => normalizeWarmupTemplateItem(item))
    .map((item) => {
      const mappedType = item.blockType === 'mobility' ? 'warmup' : item.blockType;
      return mapTemplateBlock(mappedType, item, createBlock);
    })
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((block) => ({ ...block, id: nextBlockId() }));
}

function normalizeWarmupTemplateItem(item: {
  blockType: 'cardio' | 'mobility' | 'plio' | 'strength';
  [key: string]: unknown;
}): TemplateBlockData & { blockType: 'cardio' | 'mobility' | 'plio' | 'strength' } {
  return {
    ...item,
    displayName: toStringValue(item.displayName) ?? '',
    sortOrder: toNumber(item.sortOrder) ?? 0,
  };
}

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

function mapStrengthBlock(base: DraftBlock, item: TemplateBlockData, meta: MetaMap): DraftBlock {
  const ranges = item.perSetWeightRangesJson as Array<{ maxKg?: number }> | undefined;
  const csvWeights = Array.isArray(ranges)
    ? ranges
        .map((entry) => toNumber(entry.maxKg))
        .filter((entry): entry is number => entry !== undefined)
    : [];
  return {
    ...base,
    ...readWarmupImportFlags(meta),
    repsPlanned: toNumber(item.repsMax),
    repsRange: parseRangeText(toNumber(item.repsMin), toNumber(item.repsMax)),
    restSeconds: toNumber(item.restSeconds),
    setsPlanned: toNumber(item.setsPlanned),
    targetRir: toNumber(item.targetRir),
    weightPerSeriesKg: csvWeights.length > 1 ? csvWeights.join(',') : undefined,
    weightKg: toNumber(item.weightRangeMaxKg),
    ...(toStringValue(meta.repsPorSerie)
      ? { repsPerSeries: toStringValue(meta.repsPorSerie) }
      : {}),
  };
}

function mapCardioBlock(base: DraftBlock, item: TemplateBlockData, meta: MetaMap): DraftBlock {
  return {
    ...base,
    ...readWarmupImportFlags(meta),
    cardioWorkText: toStringValue(meta.trabajo),
    heartRate: toNumber(meta.pulsaciones),
    intensityFcMax: toNumber(meta.intensidadFcMax),
    intensityFcReserve: toNumber(meta.intensidadFcReserva),
    restSeconds: toNumber(item.restSeconds),
    roundsPlanned: toNumber(item.roundsPlanned),
    totalTimeSeconds: toNumber(item.workSeconds),
    workSeconds: toNumber(item.workSeconds),
  };
}

function mapPlioBlock(base: DraftBlock, item: TemplateBlockData, meta: MetaMap): DraftBlock {
  return {
    ...base,
    ...readWarmupImportFlags(meta),
    repsPlanned: toNumber(meta.repeticiones),
    repsRange: toStringValue(meta.rangoReps),
    restSeconds: toNumber(item.restSeconds),
    roundsPlanned: toNumber(item.roundsPlanned),
    weightKg: toNumber(meta.pesoKg),
    workSeconds: toNumber(item.workSeconds),
  };
}

function mapWarmupBlock(base: DraftBlock, item: TemplateBlockData, meta: MetaMap): DraftBlock {
  return {
    ...base,
    ...readWarmupImportFlags(meta),
    repsPlanned: toNumber(meta.repeticiones),
    repsRange: toStringValue(meta.rangoReps),
    restSeconds: toNumber(item.restSeconds),
    roundsPlanned: toNumber(item.roundsPlanned),
    warmupTemplateName: toStringValue(meta.nombreCalentamiento),
    workSeconds: toNumber(item.workSeconds),
  };
}

function readWarmupImportFlags(
  meta: MetaMap,
): Pick<DraftBlock, 'fromWarmupTemplate' | 'warmupTemplateName'> {
  const imported = toNumber(meta.deCalentamiento) === 1;
  return {
    fromWarmupTemplate: imported || undefined,
    warmupTemplateName: toStringValue(meta.nombreCalentamiento),
  };
}

function parseRangeText(min: null | number | undefined, max: null | number | undefined) {
  if (typeof min === 'number' && typeof max === 'number') {
    return min === max ? `${min}` : `${min}-${max}`;
  }
  if (typeof max === 'number') return `${max}`;
  if (typeof min === 'number') return `${min}`;
  return undefined;
}

function parseMetaNotes(notes: unknown): { baseNotes: undefined | string; meta: MetaMap } {
  if (typeof notes !== 'string') return { baseNotes: undefined, meta: {} };
  const markerIndex = notes.lastIndexOf(META_MARKER);
  if (markerIndex < 0) {
    const clean = notes.trim();
    return { baseNotes: clean || undefined, meta: {} };
  }
  const baseNotes = notes.slice(0, markerIndex).trim() || undefined;
  const jsonPart = notes.slice(markerIndex + META_MARKER.length).trim();
  try {
    const parsed = JSON.parse(jsonPart) as unknown;
    if (!parsed || typeof parsed !== 'object') {
      return { baseNotes, meta: {} };
    }
    return { baseNotes, meta: parsed as MetaMap };
  } catch {
    return { baseNotes: notes.trim() || undefined, meta: {} };
  }
}

function toNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function toStringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}
