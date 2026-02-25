import { useCallback } from 'react';
import type { BlockType, DraftBlock, DraftState } from '../../RoutinePlanner.types';
import { createBlock } from '../../RoutinePlanner.helpers';

export function useBlockManagement(setDraft: React.Dispatch<React.SetStateAction<DraftState>>) {
  const onAddBlock = useAddBlock(setDraft);
  const onUpdateBlockField = useUpdateBlock(setDraft);
  const onRemoveBlock = useRemoveBlock(setDraft);

  return { onAddBlock, onUpdateBlockField, onRemoveBlock };
}

function useAddBlock(setDraft: React.Dispatch<React.SetStateAction<DraftState>>) {
  return useCallback(
    (dayIdx: number, type: BlockType, libraryId: string, displayName: string) => {
      setDraft((d) => ({
        ...d,
        days: d.days.map((day, i) =>
          i === dayIdx
            ? {
                ...day,
                blocks: [...day.blocks, { ...createBlock(type, displayName), libraryId }],
              }
            : day,
        ),
      }));
    },
    [setDraft],
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
