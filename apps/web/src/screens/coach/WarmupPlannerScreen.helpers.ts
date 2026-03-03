import { mapWarmupTemplateItemsToBlocks } from './RoutinePlanner.helpers';
import type { BlockType, DraftBlock } from './RoutinePlanner.types';
import { appendMeta, parseRange } from './WarmupPlanner.helpers';
import type {
  UpsertWarmupTemplateInput,
  WarmupTemplateItemInput,
  WarmupTemplateView,
} from '../../data/hooks/useWarmupTemplates';

export type DraftState = {
  blocks: DraftBlock[];
  name: string;
};

export const EMPTY_DRAFT: DraftState = { blocks: [], name: '' };

export function fromTemplate(template: WarmupTemplateView): DraftState {
  return {
    blocks: mapWarmupTemplateItemsToBlocks(template.items),
    name: template.name,
  };
}

export function toPayload(draft: DraftState): UpsertWarmupTemplateInput {
  return {
    items: draft.blocks.map((block, index) => mapItem(block, index)),
    name: draft.name,
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
    metadataJson: null,
    notes,
    plioExerciseLibraryId: block.type === 'plio' ? (block.libraryId ?? null) : null,
    repsMax: range.max,
    repsMin: range.min,
    restSeconds: block.restSeconds ?? null,
    roundsPlanned: block.roundsPlanned ?? null,
    setsPlanned: block.setsPlanned ?? null,
    sortOrder,
    targetRir: block.targetRir ?? null,
    targetRpe: block.targetRpe ?? null,
    warmupExerciseLibraryId: block.type === 'warmup' ? (block.libraryId ?? null) : null,
    workSeconds: block.workSeconds ?? null,
  };
}

function buildNotes(block: DraftBlock): null | string {
  return appendMeta(block.notes, {
    trabajo: block.cardioWorkText,
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

function mapTypeToApi(type: BlockType): 'cardio' | 'mobility' | 'plio' | 'strength' {
  if (type === 'warmup') return 'mobility';
  return type === 'cardio' || type === 'plio' || type === 'strength' ? type : 'strength';
}
