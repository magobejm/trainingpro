import type { PlannedSet } from '../../data/hooks/useTodaySession';

export function resolvePlannedSet(plannedSets: PlannedSet[] | undefined, currentIndexOneBased: number): PlannedSet | null {
  if (!plannedSets?.length) return null;
  const zeroBased = currentIndexOneBased - 1;
  return (
    plannedSets.find((set) => set.setIndex === zeroBased) ??
    plannedSets.find((set) => set.setIndex === currentIndexOneBased) ??
    null
  );
}
