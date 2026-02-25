import { useCallback } from 'react';
import type { BlockType, DraftBlock, DraftState } from '../../RoutinePlanner.types';
import { createBlock } from '../../RoutinePlanner.helpers';

export function useBlockManagement(
  setDraft: React.Dispatch<React.SetStateAction<DraftState>>,
  t: (k: string) => string,
) {
  const onAddBlock = useAddBlock(setDraft, t);
  const onUpdateBlockField = useUpdateBlock(setDraft);
  const onRemoveBlock = useRemoveBlock(setDraft);

  return { onAddBlock, onUpdateBlockField, onRemoveBlock };
}

function useAddBlock(
  setDraft: React.Dispatch<React.SetStateAction<DraftState>>,
  t: (k: string) => string,
) {
  return useCallback(
    (dayIdx: number, type: BlockType) => {
      const label = t(`coach.routine.blockType.${type}`);
      setDraft((d) => ({
        ...d,
        days: d.days.map((day, i) =>
          i === dayIdx ? { ...day, blocks: [...day.blocks, createBlock(type, label)] } : day,
        ),
      }));
    },
    [t, setDraft],
  );
}

function useUpdateBlock(setDraft: React.Dispatch<React.SetStateAction<DraftState>>) {
  return useCallback(
    (dayIdx: number, blockId: string, field: keyof DraftBlock, value: unknown) => {
      setDraft((d) => ({
        ...d,
        days: d.days.map((day, i) =>
          i === dayIdx
            ? {
                ...day,
                blocks: day.blocks.map((b) => (b.id === blockId ? { ...b, [field]: value } : b)),
              }
            : day,
        ),
      }));
    },
    [setDraft],
  );
}

function useRemoveBlock(setDraft: React.Dispatch<React.SetStateAction<DraftState>>) {
  return useCallback(
    (dayIdx: number, blockId: string) => {
      setDraft((d) => ({
        ...d,
        days: d.days.map((dy, i) =>
          i === dayIdx ? { ...dy, blocks: dy.blocks.filter((b) => b.id !== blockId) } : dy,
        ),
      }));
    },
    [setDraft],
  );
}
