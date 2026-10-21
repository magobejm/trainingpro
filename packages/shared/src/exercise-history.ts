/** Actual client values only. Missing values must never fall back to the prescription. */
export type ExerciseHistorySet = {
  itemId: string;
  setIndex: number;
  repsDone?: number | null;
  weightDoneKg?: number | null;
  effortRpe?: number | null;
  effortRir?: number | null;
  durationSecondsDone?: number | null;
  distanceDoneMeters?: number | null;
  heartRateDone?: number | null;
  hrMaxPctDone?: number | null;
  hrReservePctDone?: number | null;
  romDone?: string | null;
  restSecondsDone?: number | null;
};

export type ExerciseHistoryEntry = {
  outcome?: import('./session-outcome').SessionOutcome;
  originDate?: string | null;
  sessionId: string;
  sessionDate: string;
  sets: ExerciseHistorySet[];
  /** Legacy summary fields retained for older mobile clients. */
  effortRir: number | null;
  effortRpe: number | null;
  repsDone: number | null;
  weightDoneKg: number | null;
};
