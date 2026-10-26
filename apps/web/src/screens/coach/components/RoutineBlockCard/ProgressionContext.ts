import { createContext } from 'react';

export type ProgressionContextValue = {
  /** Microcycles in the routine's mesocycle, or null when the routine does not define one. */
  mesocycleMicrocycles: null | number;
  /** Days each microcycle lasts (routine "microcycle duration"). */
  microcycleDays: null | number;
};

/** Provided by the routine planner only; outside of it blocks do not offer a progression editor. */
export const ProgressionContext = createContext<ProgressionContextValue | null>(null);
