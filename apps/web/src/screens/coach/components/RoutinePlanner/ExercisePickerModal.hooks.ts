import { useEffect } from 'react';
import type { BlockType } from '../../RoutinePlanner.types';
import {
  useLibraryExercisesQuery,
  useLibraryCardioMethodsQuery,
  useLibraryPlioExercisesQuery,
  useLibraryMobilityExercisesQuery,
  useLibrarySportsQuery,
} from '../../../../data/hooks/useLibraryQuery';
import type { LibraryItem } from './ExercisePickerModal.types';
import {
  filterByQuery,
  mapCardio,
  mapExercises,
  mapPlio,
  mapSports,
  mapWarmup,
} from './ExercisePickerModal.utils';

export function useLibraryItems(
  blockType: BlockType | null,
  query: string,
): { items: LibraryItem[]; isLoading: boolean } {
  const str = useLibraryExercisesQuery({ query: blockType === 'strength' ? query : undefined });
  const car = useLibraryCardioMethodsQuery({ query: blockType === 'cardio' ? query : undefined });
  const plio = useLibraryPlioExercisesQuery({ query: blockType === 'plio' ? query : undefined });
  const warm = useLibraryMobilityExercisesQuery({
    query: blockType === 'warmup' ? query : undefined,
  });
  const sport = useLibrarySportsQuery();

  if (blockType === 'strength') {
    return { items: filterByQuery(mapExercises(str.data ?? []), query), isLoading: str.isLoading };
  }
  if (blockType === 'cardio') {
    return { items: filterByQuery(mapCardio(car.data ?? []), query), isLoading: car.isLoading };
  }
  if (blockType === 'plio') {
    return { items: filterByQuery(mapPlio(plio.data ?? []), query), isLoading: plio.isLoading };
  }
  if (blockType === 'warmup') {
    return { items: filterByQuery(mapWarmup(warm.data ?? []), query), isLoading: warm.isLoading };
  }
  if (blockType === 'sport') {
    return { items: filterByQuery(mapSports(sport.data ?? []), query), isLoading: sport.isLoading };
  }
  return { items: [], isLoading: false };
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
