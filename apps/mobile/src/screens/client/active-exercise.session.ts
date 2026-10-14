import { useCallback, useRef, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { EnqueueResult } from '../../data/hooks/useSessionDraft';
import type { SessionItem } from '../../data/hooks/useTodaySession';
import { showError, showToast } from '../../shell/client/feedback';
import type { LogPayload, SetRowState } from './active-exercise.helpers';
import { dirtySetIndexes, persistOneSet, saveNoticeKey, type SaveOutcome } from './active-exercise.save';

type SendSet = (body: LogPayload) => Promise<EnqueueResult | 'missing' | void> | void;

export function useActiveSetSave(item: SessionItem, drafts: Record<number, SetRowState>, setCount: number, send: SendSet) {
  const { t } = useTranslation();
  const inFlight = useRef(new Set<number>());
  const draftsRef = useRef(drafts);
  const restRef = useRef<Record<number, number>>({});
  const sendRef = useRef(send);
  const finishingRef = useRef(false);
  const [busy, setBusy] = useState(false);
  const [finishing, setFinishing] = useState(false);
  draftsRef.current = drafts;
  sendRef.current = send;

  const run = useCallback(
    async (indexes: number[]) => {
      setBusy(true);
      const outcomes: SaveOutcome[] = [];
      try {
        for (const setIndex of indexes) {
          const outcome = await persistOneSet(
            inFlight.current,
            item,
            setIndex,
            draftsRef.current[setIndex],
            restRef.current[setIndex],
            (body) => sendRef.current(body),
          );
          outcomes.push(outcome);
          if (outcome === 'failed') {
            showError(t('mobile.client.session.saveSetError'));
            break;
          }
        }
      } finally {
        setBusy(false);
      }
      announceSave(outcomes, t);
      return outcomes;
    },
    [item, t],
  );

  const finishExercise = useCallback(
    async (onDone: () => void) => {
      if (finishingRef.current) return;
      finishingRef.current = true;
      setFinishing(true);
      try {
        const indexes = dirtySetIndexes(item, draftsRef.current, setCount, restRef.current);
        const outcomes = await run(indexes);
        if (!outcomes.includes('failed')) onDone();
      } finally {
        finishingRef.current = false;
        setFinishing(false);
      }
    },
    [item, run, setCount],
  );

  const rememberRest = (setIndex: number, seconds: number) => {
    restRef.current = { ...restRef.current, [setIndex]: seconds };
  };

  return { busy, finishExercise, finishing, rememberRest, restSeconds: restRef, run };
}

function announceSave(outcomes: SaveOutcome[], t: (key: string) => string): void {
  const key = saveNoticeKey(outcomes);
  if (!key) return;
  const message = t(key);
  showToast(message);
  AccessibilityInfo.announceForAccessibility?.(message);
}
