import { useState } from 'react';
import type { DraftState } from './RoutinePlanner.types';
import { createEmptyDraft } from './RoutinePlanner.helpers';
import { useDayManagement } from './components/RoutinePlanner/useDayManagement';
import { useBlockManagement } from './components/RoutinePlanner/useBlockManagement';
import { useBlockMovement } from './components/RoutinePlanner/useBlockMovement';

export function useRoutinePlannerDraft(t: (k: string) => string) {
  const [draft, setDraft] = useState<DraftState>(() => createEmptyDraft(t));
  const [activeDayIdx, setActiveDayIdx] = useState(0);

  const dayMgmt = useDayManagement(setDraft, setActiveDayIdx, t);
  const blockMgmt = useBlockManagement(setDraft, t);
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
