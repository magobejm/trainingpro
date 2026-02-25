import { useCallback } from 'react';
import type { DraftDay, DraftState } from '../../RoutinePlanner.types';
import { createEmptyDay } from '../../RoutinePlanner.helpers';

export function useDayManagement(
  setDraft: React.Dispatch<React.SetStateAction<DraftState>>,
  setActiveDayIdx: React.Dispatch<React.SetStateAction<number>>,
  t: (k: string) => string,
) {
  const addDay = useCallback(
    () => setDraft((d) => ({ ...d, days: [...d.days, createEmptyDay(d.days.length + 1, t)] })),
    [t, setDraft],
  );

  const removeDay = useCallback(
    (dayIdx: number) => {
      setDraft((d) => {
        const days = d.days.filter((_, i) => i !== dayIdx);
        const nextDays: DraftDay[] = days.length === 0 ? [createEmptyDay(1, t)] : days;
        return { ...d, days: nextDays };
      });
      setActiveDayIdx((cur) => Math.max(0, cur - 1));
    },
    [t, setDraft, setActiveDayIdx],
  );

  const renameDay = useCallback(
    (dayIdx: number, title: string) =>
      setDraft((d) => ({
        ...d,
        days: d.days.map((dy, i) => (i === dayIdx ? { ...dy, title } : dy)),
      })),
    [setDraft],
  );

  return { addDay, removeDay, renameDay };
}
