/**
 * Exercise-level metric calculations based on coach documentation.
 *
 * Key formulas:
 *   REF (Reps to Estimated Failure) = reps + RIR  where RIR = 10 - RPE
 *   e1RM (Brzycki)  = weight / (1.0278 - 0.0278 * REF)
 *   INOL per set    = reps / (100 - intensity%)   where intensity% = (weight / e1RM) * 100
 *   Tonnage per set = weight * reps
 */

/** Estimate 1 Rep Max using the Brzycki formula.
 *  Returns null when inputs are not usable (zero reps, zero weight, etc.). */
export function estimateE1rm(weightKg: number, repsDone: number, effortRpe: number | null): number | null {
  if (weightKg <= 0 || repsDone <= 0) return null;
  const rir = effortRpe !== null ? Math.max(0, 10 - effortRpe) : 0;
  const ref = repsDone + rir;
  const denominator = 1.0278 - 0.0278 * ref;
  if (denominator <= 0) return null;
  return Math.round((weightKg / denominator) * 100) / 100;
}

/** Calculate INOL for a single set.
 *  Requires a known e1RM to compute intensity %.
 *  Returns null when any input is missing or would produce division by zero. */
export function calculateSetInol(weightKg: number, repsDone: number, e1rm: number): number | null {
  if (e1rm <= 0 || repsDone <= 0) return null;
  const intensityPercent = (weightKg / e1rm) * 100;
  const denominator = 100 - intensityPercent;
  if (denominator <= 0) return null;
  return Math.round((repsDone / denominator) * 10000) / 10000;
}

/** Tonnage for a single set = weight × reps */
export function calculateSetTonnage(weightKg: number, repsDone: number): number {
  return weightKg * repsDone;
}

export type SetMetrics = {
  setIndex: number;
  reps: number | null;
  weightKg: number | null;
  rpe: number | null;
  e1rm: number | null;
  inol: number | null;
  tonnage: number;
};

export type ExerciseSessionMetrics = {
  sessionDate: string;
  sessionId: string;
  sets: number;
  totalReps: number;
  tonnage: number;
  avgRpe: number | null;
  e1rm: number | null;
  inol: number | null;
  totalDurationSeconds: number | null;
  durationMinutes: number | null;
  avgHeartRate: number | null;
  avgPaceMinKm: number | null;
  fcReservePercent: number | null;
  plioEffort: number | null;
  setDetails: SetMetrics[];
};

type RawSetLog = {
  setIndex: number;
  repsDone: number | null;
  weightDoneKg: number | null;
  effortRpe: number | null;
};

/** Aggregate a list of set logs for a single exercise into session-level metrics. */
export function aggregateExerciseSets(sessionId: string, sessionDate: Date, setLogs: RawSetLog[]): ExerciseSessionMetrics {
  let totalReps = 0;
  let totalTonnage = 0;
  let totalInol = 0;
  let inolCount = 0;
  let totalRpe = 0;
  let rpeCount = 0;
  let maxE1rm: number | null = null;

  const setDetails: SetMetrics[] = setLogs.map((log) => {
    const reps = log.repsDone;
    const weight = log.weightDoneKg;
    const rpe = log.effortRpe;

    const e1rm = reps !== null && weight !== null ? estimateE1rm(weight, reps, rpe) : null;
    const inol = reps !== null && weight !== null && e1rm !== null ? calculateSetInol(weight, reps, e1rm) : null;
    const tonnage = reps !== null && weight !== null ? calculateSetTonnage(weight, reps) : 0;

    if (reps !== null) totalReps += reps;
    totalTonnage += tonnage;

    if (inol !== null) {
      totalInol += inol;
      inolCount++;
    }
    if (rpe !== null) {
      totalRpe += rpe;
      rpeCount++;
    }
    if (e1rm !== null && (maxE1rm === null || e1rm > maxE1rm)) {
      maxE1rm = e1rm;
    }

    return { setIndex: log.setIndex, reps, weightKg: weight, rpe, e1rm, inol, tonnage };
  });

  return {
    sessionDate: sessionDate.toISOString().slice(0, 10),
    sessionId,
    sets: setLogs.length,
    totalReps,
    tonnage: Math.round(totalTonnage * 100) / 100,
    avgRpe: rpeCount > 0 ? Math.round((totalRpe / rpeCount) * 100) / 100 : null,
    e1rm: maxE1rm,
    inol: inolCount > 0 ? Math.round(totalInol * 10000) / 10000 : null,
    totalDurationSeconds: null,
    durationMinutes: null,
    avgHeartRate: null,
    avgPaceMinKm: null,
    fcReservePercent: null,
    plioEffort: null,
    setDetails,
  };
}
