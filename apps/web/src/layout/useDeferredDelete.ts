import { useCallback, useEffect, useRef, useState } from 'react';
import { useToast } from '@trainerpro/ui';
import { useTranslation } from 'react-i18next';
import { beginDelete, DEFERRED_DELETE_MS, restoreAfterFailure, undoDelete } from './deferred-delete';

type Job = {
  formatError: (error: unknown) => string;
  onUndo?: () => void;
  run: () => Promise<unknown>;
};

type ScheduleInput = Job & { id: string; label: string };

export function useDeferredDelete() {
  const toast = useToast();
  const { t } = useTranslation();
  const [pending, setPending] = useState<Set<string>>(() => new Set());
  const jobs = useRef(new Map<string, Job>());
  const flush = useCallback(
    async (id: string) => {
      const job = jobs.current.get(id);
      jobs.current.delete(id);
      if (!job) return;
      try {
        await job.run();
      } catch (error) {
        setPending((current) => restoreAfterFailure(current, id));
        job.onUndo?.();
        toast.error(job.formatError(error));
      }
    },
    [toast],
  );
  const schedule = useCallback(
    (input: ScheduleInput) => {
      jobs.current.set(input.id, { formatError: input.formatError, onUndo: input.onUndo, run: input.run });
      setPending((current) => beginDelete(current, input.id));
      toast.show(input.label, 'info', {
        action: {
          label: t('common.undo'),
          onPress: () => {
            jobs.current.delete(input.id);
            setPending((current) => undoDelete(current, input.id));
            input.onUndo?.();
          },
        },
        durationMs: DEFERRED_DELETE_MS,
        onExpire: () => void flush(input.id),
      });
    },
    [flush, t, toast],
  );
  useEffect(() => {
    const flushAll = () => {
      for (const id of [...jobs.current.keys()]) void flush(id);
    };
    window.addEventListener('pagehide', flushAll);
    return () => {
      window.removeEventListener('pagehide', flushAll);
      flushAll();
    };
  }, [flush]);
  return { pending, schedule };
}
