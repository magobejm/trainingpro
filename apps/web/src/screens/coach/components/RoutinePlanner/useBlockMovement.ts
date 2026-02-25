import { useCallback } from 'react';
import type { DraftState } from '../../RoutinePlanner.types';

export function useBlockMovement(
  setDraft: React.Dispatch<React.SetStateAction<DraftState>>,
  setActiveDayIdx: React.Dispatch<React.SetStateAction<number>>,
) {
  const onMoveBlock = useMoveBlock(setDraft);
  const onMoveBlockToDay = useMoveBlockToDay(setDraft, setActiveDayIdx);
  return { onMoveBlock, onMoveBlockToDay };
}

function useMoveBlock(setDraft: React.Dispatch<React.SetStateAction<DraftState>>) {
  return useCallback(
    (dayIdx: number, blockIdx: number, direction: -1 | 1) => {
      setDraft((d) => ({
        ...d,
        days: d.days.map((day, i) => {
          if (i !== dayIdx) return day;
          const blocks = [...day.blocks];
          const target = blockIdx + direction;
          if (target < 0 || target >= blocks.length) return day;
          [blocks[blockIdx], blocks[target]] = [blocks[target]!, blocks[blockIdx]!];
          return { ...day, blocks };
        }),
      }));
    },
    [setDraft],
  );
}

function useMoveBlockToDay(
  setDraft: React.Dispatch<React.SetStateAction<DraftState>>,
  setActiveDayIdx: React.Dispatch<React.SetStateAction<number>>,
) {
  return useCallback(
    (fromIdx: number, bIdx: number, toIdx: number) => {
      setDraft((d) => {
        const block = d.days[fromIdx]?.blocks[bIdx];
        if (!block) return d;
        return {
          ...d,
          days: d.days.map((day, i) => {
            if (i === fromIdx) {
              return { ...day, blocks: day.blocks.filter((_, idx) => idx !== bIdx) };
            }
            return i === toIdx ? { ...day, blocks: [...day.blocks, block] } : day;
          }),
        };
      });
      setActiveDayIdx(toIdx);
    },
    [setDraft, setActiveDayIdx],
  );
}
