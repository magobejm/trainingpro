import { useEffect } from 'react';
import type { BlockType } from '../../RoutinePlanner.types';
import { useUnifiedExercisesQuery } from '../../../../data/hooks/useUnifiedLibraryQuery';
import { filterByQuery } from './ExercisePickerModal.utils';
import { pickerLibraryFilter, type PickerFilters } from './ExercisePickerModal.filters';

export function useLibraryItems(blockType: BlockType, query: string, filters: PickerFilters) {
  // This endpoint returns the full category when no pagination is requested.
  // Search locally so an exact-phrase server query cannot discard word matches.
  const result = useUnifiedExercisesQuery(pickerLibraryFilter(blockType, filters));
  const source = (result.data ?? []).filter(
    (item) => !filters.equipmentIds.length || filters.equipmentIds.includes(item.equipmentId ?? ''),
  );
  const items = filterByQuery(
    source.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.instructions ?? null,
      notes: item.coachInstructions ?? null,
      imageUrl: item.mediaUrl,
      youtubeUrl: item.youtubeUrl ?? null,
      equipment: item.equipmentRef?.label,
      muscleGroup: blockType === 'strength' ? item.tags.join(' · ') : undefined,
      methodType: blockType !== 'strength' ? item.tags.join(' · ') : undefined,
    })),
    query,
  );
  return { items, source, isLoading: result.isLoading, isError: result.isError, error: result.error, retry: result.refetch };
}

export function useLockBodyScroll(locked: boolean) {
  useEffect(() => {
    if (typeof document === 'undefined' || !locked) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [locked]);
}
