import React from 'react';
import type { DraftBlock } from '../../RoutinePlanner.types';
import { useUnifiedExercisesQuery, type UnifiedExerciseItem } from '../../../../data/hooks/useUnifiedLibraryQuery';
import { UnifiedExerciseDetailModal } from '../../UnifiedExerciseDetailModal';

type Props = { block: DraftBlock; visible: boolean; onClose: () => void };

const BASE_CATEGORY_MAP: Record<string, string> = {
  strength: 'muscleGroups',
  cardio: 'cardioMethodTypes',
  isometric: 'isometricTypes',
  plio: 'plioTypes',
  mobility: 'mobilityTypes',
  sport: 'sportTypes',
};

function toBaseCategory(type: DraftBlock['type']): string {
  return BASE_CATEGORY_MAP[type] ?? 'muscleGroups';
}

function useUnifiedBlockDetail(block: DraftBlock): UnifiedExerciseItem | null {
  const { data } = useUnifiedExercisesQuery({
    baseCategory: toBaseCategory(block.type),
    search: block.displayName,
  });
  return (data ?? []).find((i) => i.id === block.libraryId || i.name === block.displayName) ?? null;
}

export function BlockDetailModal({ block, visible, onClose }: Props) {
  const item = useUnifiedBlockDetail(block);
  if (!visible) return null;
  return <UnifiedExerciseDetailModal item={item} onClose={onClose} visible={visible} />;
}
