import { useEffect, useRef, useState } from 'react';
import type { SessionItem } from '../../data/hooks/useTodaySession';
import { getSetCount, type SetFieldKey, type SetRowState } from './active-exercise.helpers';
import { loggedDraft } from './active-exercise.save';

export function useActiveSetDraft(item: SessionItem) {
  const setCount = getSetCount(item);
  const previousItem = useRef(item);
  const [drafts, setDrafts] = useState(() => reconcileSetDrafts(item, item, {}));
  const [romSet, setRomSet] = useState<number | null>(null);

  useEffect(() => {
    const previous = previousItem.current;
    setDrafts((current) => reconcileSetDrafts(previous, item, current));
    previousItem.current = item;
  }, [item, setCount]);

  useEffect(() => {
    setRomSet(null);
  }, [item.id]);

  const updateField = (setIndex: number, key: SetFieldKey, value: string) => {
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

  return { drafts, romSet, saveRom, setCount, setRomSet, updateField };
}

export function reconcileSetDrafts(
  previous: SessionItem,
  item: SessionItem,
  drafts: Record<number, SetRowState>,
): Record<number, SetRowState> {
  const next: Record<number, SetRowState> = {};
  for (let index = 1; index <= getSetCount(item); index += 1) {
    const draft = drafts[index];
    const before = loggedDraft(previous, index);
    const dirty = draft && Object.keys(before).some((key) => draft[key as SetFieldKey] !== before[key as SetFieldKey]);
    next[index] = previous.id === item.id && dirty ? draft : loggedDraft(item, index);
  }
  return next;
}
