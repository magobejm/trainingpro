import { useEffect, useState } from 'react';
import type { useActiveSetDraft } from '../screens/client/active-exercise.draft';
import { readHeartRateSample } from './index';

export function useHeartRateProposal(
  itemType: string,
  setIndex: number,
  draft: ReturnType<typeof useActiveSetDraft>,
): { average: number; max: number } | null {
  const [sample, setSample] = useState<{ average: number; max: number } | null>(null);
  useEffect(() => {
    if (itemType !== 'cardio' && itemType !== 'sport') return undefined;
    let active = true;
    void readHeartRateSample().then((next) => {
      if (!active || !next) return;
      setSample(next);
      if (!draft.drafts[setIndex]?.heartRate) draft.updateField(setIndex, 'heartRate', String(next.average));
    });
    return () => {
      active = false;
    };
  }, [draft, itemType, setIndex]);
  return sample;
}
