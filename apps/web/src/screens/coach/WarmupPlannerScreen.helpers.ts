import { mapWarmupTemplateItemsToBlocks } from './RoutinePlanner.helpers';
import type { BlockType, DraftBlock, DraftExerciseGroup } from './RoutinePlanner.types';
import { appendMeta, parseRange } from './WarmupPlanner.helpers';
import type {
  UpsertWarmupTemplateInput,
  WarmupTemplateGroupInput,
  WarmupTemplateItemInput,
  WarmupTemplateView,
} from '../../data/hooks/useWarmupTemplates';

export type DraftState = {
  blocks: DraftBlock[];
  groups: DraftExerciseGroup[];
  name: string;
};

export const EMPTY_DRAFT: DraftState = { blocks: [], groups: [], name: '' };

export function fromTemplate(template: WarmupTemplateView): DraftState {
  return {
    blocks: mapWarmupTemplateItemsToBlocks(template.items),
    groups: (template.groups ?? []).map((g) => ({
      groupType: g.groupType as 'CIRCUIT' | 'SUPERSET',
      id: g.id,
      note: g.note ?? undefined,
      sortOrder: g.sortOrder,
    })),
    name: template.name,
  };
}

export function toPayload(draft: DraftState): UpsertWarmupTemplateInput {
  return {
    groups: draft.groups.map(mapGroup),
    items: draft.blocks.map((block, index) => mapItem(block, index)),
    name: draft.name,
  };
}

function mapGroup(group: DraftExerciseGroup): WarmupTemplateGroupInput {
  return {
    groupType: 'CIRCUIT',
    id: group.id,
    note: group.note ?? null,
    sortOrder: group.sortOrder,
  };
}

function mapItem(block: DraftBlock, sortOrder: number): WarmupTemplateItemInput {
  const range = parseRange(block.repsRange, block.repsPlanned);
  const notes = buildNotes(block);
  return {
    blockType: mapTypeToApi(block.type),
    cardioMethodLibraryId: block.type === 'cardio' ? (block.libraryId ?? null) : null,
    displayName: block.displayName,
    exerciseLibraryId: block.type === 'strength' ? (block.libraryId ?? null) : null,
    groupId: block.groupId ?? null,
    isometricExerciseLibraryId: block.type === 'isometric' ? (block.libraryId ?? null) : null,
    metadataJson: block.sets && block.sets.length > 0 ? { sets: block.sets } : null,
    notes,
    plioExerciseLibraryId: block.type === 'plio' ? (block.libraryId ?? null) : null,
    repsMax: range.max,
    repsMin: range.min,
    restSeconds: block.restSeconds ?? null,
    roundsPlanned: block.roundsPlanned ?? null,
    setsPlanned: block.setsPlanned ?? null,
    sortOrder,
    sportLibraryId: block.type === 'sport' ? (block.libraryId ?? null) : null,
    targetRir: block.targetRir ?? null,
    targetRpe: block.targetRpe ?? null,
    mobilityExerciseLibraryId: block.type === 'mobility' ? (block.libraryId ?? null) : null,
    workSeconds: block.workSeconds ?? null,
    durationMinutes: block.durationMinutes ?? null,
  };
}

function buildNotes(block: DraftBlock): null | string {
  return appendMeta(block.notes, {
    intensidadFcMax: block.intensityFcMax,
    intensidadFcReserva: block.intensityFcReserve,
    pesoKg: block.weightKg,
    pulsaciones: block.heartRate,
    rangoReps: block.repsRange,
    repeticiones: block.repsPlanned,
  });
}

export function moveBlocks(blocks: DraftBlock[], index: number, direction: -1 | 1): DraftBlock[] {
  const target = index + direction;
  if (target < 0 || target >= blocks.length) {
    return blocks;
  }
  const clone = [...blocks];
  const source = clone[index];
  const destination = clone[target];
  if (!source || !destination) {
    return blocks;
  }
  clone[index] = destination;
  clone[target] = source;
  return clone.map((item, sortOrder) => ({ ...item, sortOrder }));
}

function mapTypeToApi(type: BlockType): WarmupTemplateItemInput['blockType'] {
  if (type === 'mobility') return 'mobility';
  if (type === 'cardio' || type === 'isometric' || type === 'plio' || type === 'sport' || type === 'strength') {
    return type;
  }
  return 'strength';
}
