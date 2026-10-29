import { useCallback, useEffect, useRef } from 'react';
import type { SessionView } from '@trainerpro/shared';
import type { EnqueueResult } from '../../data/hooks/useSessionDraft';
import type { SessionOpInput } from '../../data/offline/session-draft';
import { isSessionItemComplete } from './session-completion.utils';
import { finishExerciseInput } from './today-session.sync';

type Enqueue = (session: SessionView, input: SessionOpInput) => Promise<EnqueueResult>;

export function useRecordExerciseOrder(
  view: SessionView | null,
  base: SessionView | null,
  finishedIds: ReadonlySet<string>,
  enqueue: Enqueue,
): (itemId: string) => void {
  const requested = useRef(new Set<string>());
  const record = useCallback(
    (itemId: string) => {
      if (!base || view?.status !== 'IN_PROGRESS') return;
      const item = view.items.find((entry) => entry.id === itemId);
      if (!item || typeof item.completionOrder === 'number' || requested.current.has(itemId)) return;
      requested.current.add(itemId);
      void enqueue(base, finishExerciseInput(base.id, itemId));
    },
    [base, enqueue, view],
  );

  useEffect(() => {
    for (const item of view?.items ?? []) {
      if (finishedIds.has(item.id) || isSessionItemComplete(item)) record(item.id);
    }
  }, [finishedIds, record, view]);

  return record;
}
