import { useState } from 'react';
import type { DraftState } from './RoutinePlanner.types';
import { createEmptyDraft } from './RoutinePlanner.helpers';
import { useDayManagement } from './components/RoutinePlanner/useDayManagement';
import { useBlockManagement } from './components/RoutinePlanner/useBlockManagement';
import { useBlockMovement } from './components/RoutinePlanner/useBlockMovement';

type Options = {
  dayPrefixKey?: string;
};

export function useRoutinePlannerDraft(t: (k: string) => string, options?: Options) {
  const dayPrefixKey = options?.dayPrefixKey ?? 'coach.routine.dayPrefix';
  const [draft, setDraft] = useState<DraftState>(() => createEmptyDraft(t, dayPrefixKey));
  const [activeDayIdx, setActiveDayIdx] = useState(0);

  const dayMgmt = useDayManagement(setDraft, setActiveDayIdx, t, dayPrefixKey);
  const blockMgmt = useBlockManagement(setDraft);
  const blockMove = useBlockMovement(setDraft, setActiveDayIdx);

  return {
    draft,
    setDraft,
    activeDayIdx,
    setActiveDayIdx,
    ...dayMgmt,
    ...blockMgmt,
    ...blockMove,
  };
}
