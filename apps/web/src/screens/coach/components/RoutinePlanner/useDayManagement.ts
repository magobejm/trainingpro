import { useCallback } from 'react';
import type { DraftDay, DraftState } from '../../RoutinePlanner.types';
import { createEmptyDay } from '../../RoutinePlanner.helpers';

export function useDayManagement(
  setDraft: React.Dispatch<React.SetStateAction<DraftState>>,
  setActiveDayIdx: React.Dispatch<React.SetStateAction<number>>,
  t: (k: string) => string,
  prefixKey = 'coach.routine.dayPrefix',
) {
  const addDay = useAddDay(setDraft, t, prefixKey);
  const removeDay = useRemoveDay(setDraft, setActiveDayIdx, t, prefixKey);
  const renameDay = useRenameDay(setDraft);
  const moveDay = useMoveDay(setDraft);
  const updateDay = useUpdateDay(setDraft);
  return { addDay, removeDay, renameDay, moveDay, updateDay };
}

function useUpdateDay(setDraft: React.Dispatch<React.SetStateAction<DraftState>>) {
  return useCallback(
    (dayIdx: number, updated: DraftDay) =>
      setDraft((d) => ({
        ...d,
        days: d.days.map((dy, i) => (i === dayIdx ? updated : dy)),
      })),
    [setDraft],
  );
}

function useAddDay(setDraft: React.Dispatch<React.SetStateAction<DraftState>>, t: (k: string) => string, prefixKey: string) {
  return useCallback(
    () =>
      setDraft((d) => ({
        ...d,
        days: [...d.days, createEmptyDay(d.days.length + 1, t, prefixKey)],
      })),
    [prefixKey, t, setDraft],
  );
}

function useRemoveDay(
  setDraft: React.Dispatch<React.SetStateAction<DraftState>>,
  setActiveDayIdx: React.Dispatch<React.SetStateAction<number>>,
  t: (k: string) => string,
  prefixKey: string,
) {
  return useCallback(
    (dayIdx: number) => {
      setDraft((d) => removeDayByIndex(d, dayIdx, t, prefixKey));
      setActiveDayIdx((cur) => Math.max(0, cur - 1));
    },
    [prefixKey, t, setDraft, setActiveDayIdx],
  );
}

function removeDayByIndex(draft: DraftState, dayIdx: number, t: (k: string) => string, prefixKey: string): DraftState {
  const days = draft.days.filter((_, i) => i !== dayIdx);
  const nextDays: DraftDay[] = days.length === 0 ? [createEmptyDay(1, t, prefixKey)] : days;
  return { ...draft, days: nextDays };
}

function useRenameDay(setDraft: React.Dispatch<React.SetStateAction<DraftState>>) {
  return useCallback(
    (dayIdx: number, title: string) =>
      setDraft((d) => ({
        ...d,
        days: d.days.map((dy, i) => (i === dayIdx ? { ...dy, title } : dy)),
      })),
    [setDraft],
  );
}

function useMoveDay(setDraft: React.Dispatch<React.SetStateAction<DraftState>>) {
  return useCallback(
    (fromIdx: number, dir: -1 | 1) =>
      setDraft((d) => {
        const days = [...d.days];
        const toIdx = fromIdx + dir;
        if (toIdx < 0 || toIdx >= days.length) return d;
        [days[fromIdx], days[toIdx]] = [days[toIdx]!, days[fromIdx]!];
        return { ...d, days };
      }),
    [setDraft],
  );
}
