import { useEffect, useRef, useState } from 'react';
import type { ClientRoutineNeat } from '@trainerpro/shared';
import type { NeatLog } from '../data/hooks/useClientNeatLogs';
import { readTodaySteps } from './index';
import { stepsTarget } from './health-metrics';

export function useStepGoals(
  neats: readonly ClientRoutineNeat[] | undefined,
  logs: readonly NeatLog[],
  toggle: (neatId: string, done: boolean) => void,
): number | null {
  const [steps, setSteps] = useState<number | null>(null);
  const applied = useRef(new Set<string>());
  useEffect(() => {
    void readTodaySteps().then(setSteps);
  }, []);
  useEffect(() => {
    if (steps == null) return;
    for (const neat of neats ?? []) {
      const target = stepsTarget(neat.title);
      const done = logs.some((log) => log.neatId === neat.id && log.done);
      if (target != null && steps >= target && !done && !applied.current.has(neat.id)) {
        applied.current.add(neat.id);
        toggle(neat.id, true);
      }
    }
  }, [logs, neats, steps, toggle]);
  return steps;
}
