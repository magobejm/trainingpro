import { useRef, useState } from 'react';
import { useToast } from '@trainerpro/ui';
import { useTranslation } from 'react-i18next';
import { coachRevisionMatches } from './coach-revision';

export function useCoachSaveGuard() {
  const active = useRef(false);
  const [busy, setBusy] = useState(false);
  const [conflict, setConflict] = useState(false);
  const toast = useToast();
  const { t } = useTranslation();
  const run = async (expected: unknown, load: () => Promise<unknown>, save: () => Promise<void>) => {
    if (active.current || conflict) return;
    active.current = true;
    setBusy(true);
    try {
      if (!coachRevisionMatches(expected, await load())) {
        setConflict(true);
        return;
      }
      await save();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('coachWorkspace.saveError'));
    } finally {
      active.current = false;
      setBusy(false);
    }
  };
  return { run, busy, conflict };
}
