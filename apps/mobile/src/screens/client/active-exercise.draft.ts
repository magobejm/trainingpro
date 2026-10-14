import { useEffect, useState } from 'react';
import type { SessionItem } from '../../data/hooks/useTodaySession';
import { getSetCount, type SetFieldKey, type SetRowState } from './active-exercise.helpers';
import { loggedDraft } from './active-exercise.save';

export function useActiveSetDraft(item: SessionItem) {
  const setCount = getSetCount(item);
  const [currentSet, setCurrentSet] = useState(1);
  const [drafts, setDrafts] = useState<Record<number, SetRowState>>({});
  const [romSet, setRomSet] = useState<number | null>(null);

  useEffect(() => {
    const next: Record<number, SetRowState> = {};
    for (let setIndex = 1; setIndex <= setCount; setIndex += 1) next[setIndex] = loggedDraft(item, setIndex);
    setDrafts(next);
  }, [item, setCount]);

  useEffect(() => {
    setCurrentSet(1);
    setRomSet(null);
  }, [item.id]);

  const setIndex = Math.min(Math.max(currentSet, 1), Math.max(setCount, 1));

  const updateField = (key: SetFieldKey, value: string) => {
    setDrafts((current) => ({
      ...current,
      [setIndex]: { ...(current[setIndex] ?? loggedDraft(item, setIndex)), [key]: value },
    }));
  };

  const saveRom = (value: string) => {
    if (romSet == null) return;
    setDrafts((current) => ({
      ...current,
      [romSet]: { ...(current[romSet] ?? loggedDraft(item, romSet)), rom: value },
    }));
    setRomSet(null);
  };

  return { drafts, romSet, saveRom, setCount, setCurrentSet, setIndex, setRomSet, updateField };
}
