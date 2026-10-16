import { useEffect, useRef, useState, type SetStateAction } from 'react';
import { useToast } from '@trainerpro/ui';
import { useTranslation } from 'react-i18next';
import { readCoachDraft, saveCoachDraft, removeCoachDraft, draftGeneration } from '../coach-draft-storage';
export { clearCoachDrafts } from '../coach-draft-storage';
import { coachContextKey, draftConflicts } from '../coach-draft-policy';
import { useCoachAuth } from './useCoachData';

type Stored<T> = { version: 1; value: T; baseline?: string };
type DraftState<T> = { key: string; value: T; ready: boolean; baseline?: string };
function restoredState<T>(raw: string | null, key: string, initial: T, baseline?: string): DraftState<T> {
  let saved: Stored<T> | undefined;
  try {
    saved = raw ? (JSON.parse(raw) as Stored<T>) : undefined;
  } catch {
    saved = undefined;
  }
  return {
    key,
    value: saved?.version === 1 ? saved.value : initial,
    baseline: saved?.version === 1 ? saved.baseline : baseline,
    ready: true,
  };
}
export function useCoachDraft<T>(resource: string, initial: T, serverVersion?: string) {
  const { userId, activeRole } = useCoachAuth();
  const toast = useToast();
  const { t } = useTranslation();
  const generation = useRef(draftGeneration());
  const key = coachContextKey(userId, activeRole, resource);
  const [state, setState] = useState<DraftState<T>>({ key, value: initial, ready: false, baseline: serverVersion });
  const live = useRef(state);
  const rawValue = useRef<string | null>(null);
  const mounted = useRef(true);
  const latest = useRef({ key, initial, serverVersion });
  latest.current = { key, initial, serverVersion };
  useEffect(() => {
    let active = true;
    mounted.current = true;
    live.current = { key, value: latest.current.initial, ready: false, baseline: latest.current.serverVersion };
    setState(live.current);
    void readCoachDraft(key)
      .then((raw) => {
        if (!active) return;
        rawValue.current = raw;
        live.current = restoredState(raw, key, latest.current.initial, latest.current.serverVersion);
        setState(live.current);
      })
      .catch(() => {
        if (!active) return;
        toast.error(t('coachWorkspace.draftError'));
        live.current = { key, value: latest.current.initial, baseline: latest.current.serverVersion, ready: true };
        setState(live.current);
      });
    return () => {
      active = false;
      mounted.current = false;
    };
  }, [key]);
  const persistState = async (next: DraftState<T>) => {
    if (!mounted.current || live.current.key !== key || !live.current.ready) throw new Error(t('coachWorkspace.draftError'));
    const expected = rawValue.current;
    const raw = JSON.stringify({ version: 1, value: next.value, baseline: next.baseline });
    rawValue.current = raw;
    live.current = next;
    setState(next);
    await saveCoachDraft(key, raw, generation.current, expected);
  };
  const persistValue = async (next: SetStateAction<T>) => {
    const current = live.current;
    const value = typeof next === 'function' ? (next as (value: T) => T)(current.value) : next;
    await persistState({ ...current, value });
  };
  const setValue = (next: SetStateAction<T>) => {
    void persistValue(next).catch(() => toast.error(t('coachWorkspace.draftError')));
  };
  const clear = async (expectedValue = state.value) => {
    const snapshot = JSON.stringify({ version: 1, value: expectedValue, baseline: state.baseline });
    const removed = await removeCoachDraft(key, snapshot, generation.current);
    if (!removed || (live.current.key === key && JSON.stringify(live.current.value) !== JSON.stringify(expectedValue))) {
      const message = t('coachWorkspace.draftChanged');
      toast.error(message);
      throw new Error(message);
    }
    if (mounted.current && latest.current.key === key) {
      rawValue.current = null;
      live.current = { key, value: latest.current.initial, baseline: latest.current.serverVersion, ready: true };
      setState(live.current);
    }
  };
  const acceptBase = (baseline: string) => {
    void persistState({ ...live.current, baseline }).catch(() => toast.error(t('coachWorkspace.draftError')));
  };
  return {
    acceptBase,
    persistValue,
    value: state.key === key ? state.value : initial,
    setValue,
    clear,
    discard: clear,
    ready: state.key === key && state.ready,
    conflict: state.key === key && draftConflicts(state.baseline, serverVersion),
  };
}
