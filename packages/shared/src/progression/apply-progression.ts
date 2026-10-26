import { z } from 'zod';

export const progressionMicrocycleSchema = z.object({
  deload: z.boolean().optional(),
  loadDeltaKg: z.number().min(-100).max(100).nullable().optional(),
  loadPct: z.number().min(0).max(2).nullable().optional(),
  rirTarget: z.number().int().min(0).max(10).nullable().optional(),
  setsDelta: z.number().int().min(-10).max(10).nullable().optional(),
});

export const progressionRuleSchema = z.object({
  autoLoad: z
    .object({
      incrementKg: z.number().positive().max(50),
      rirAtOrAbove: z.number().int().min(0).max(10),
      whenRepsAtTop: z.boolean(),
    })
    .nullable()
    .optional(),
  microcycles: z.array(progressionMicrocycleSchema).max(16),
});

export type ProgressionMicrocycle = z.output<typeof progressionMicrocycleSchema>;
export type ProgressionRule = z.output<typeof progressionRuleSchema>;
export type AutoLoadRule = NonNullable<ProgressionRule['autoLoad']>;

/** Minimal shape a planned set needs for the progression to be applied; extra fields are preserved. */
export type ProgressionSet = {
  reps?: null | number;
  rir?: null | number;
  setIndex: number;
  weightKg?: null | number;
};

export const DEFAULT_MICROCYCLE_DAYS = 7;
export const DELOAD_LOAD_PCT = 0.6;
export const DELOAD_RIR_BONUS = 2;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Parses a stored rule, returning null when it is missing or invalid. */
export function parseProgressionRule(value: unknown): ProgressionRule | null {
  const parsed = progressionRuleSchema.safeParse(value);
  return parsed.success && parsed.data.microcycles.length > 0 ? parsed.data : null;
}

/**
 * Zero-based microcycle the client is in on `on`, counted from when the routine was applied.
 * The mesocycle repeats after `mesocycleMicrocycles` microcycles.
 */
export function progressionMicrocycleIndex(
  appliedAt: Date,
  on: Date,
  microcycleDays: null | number | undefined,
  mesocycleMicrocycles: null | number | undefined,
): number {
  const length = microcycleDays && microcycleDays >= 1 ? Math.floor(microcycleDays) : DEFAULT_MICROCYCLE_DAYS;
  const days = Math.max(0, Math.floor((on.getTime() - appliedAt.getTime()) / DAY_MS));
  const index = Math.floor(days / length);
  return mesocycleMicrocycles && mesocycleMicrocycles >= 1 ? index % Math.floor(mesocycleMicrocycles) : index;
}

/** The microcycle that applies at `microcycleIndex`, clamped to the rule. */
export function activeProgressionMicrocycle(
  rule: ProgressionRule,
  microcycleIndex: number,
): ProgressionMicrocycle | undefined {
  const last = Math.max(rule.microcycles.length - 1, 0);
  return rule.microcycles[Math.min(Math.max(microcycleIndex, 0), last)];
}

/**
 * Suggested weight to show on the planned sets. A deload microcycle never suggests an increase,
 * even when the last session would otherwise qualify.
 */
export function loadSuggestionKg(microcycle: ProgressionMicrocycle | undefined, suggestedKg: number | null): number | null {
  if (microcycle?.deload || suggestedKg == null) return null;
  return suggestedKg;
}

export function applyProgression<T extends ProgressionSet>(
  baseSets: T[],
  rule: ProgressionRule,
  microcycleIndex: number,
): T[] {
  const micro = activeProgressionMicrocycle(rule, microcycleIndex);
  if (!micro || baseSets.length === 0) return baseSets.map((set) => ({ ...set }));
  const resized = resizeSets(baseSets, micro);
  return resized.map((set, index) => ({
    ...set,
    rir: progressedRir(set.rir, micro),
    setIndex: index,
    weightKg: progressedWeight(set.weightKg, micro),
  }));
}

function resizeSets<T extends ProgressionSet>(sets: T[], micro: ProgressionMicrocycle): T[] {
  const delta = micro.setsDelta ?? (micro.deload ? -Math.floor(sets.length / 2) : 0);
  if (delta < 0) return sets.slice(0, Math.max(1, sets.length + delta)).map((set) => ({ ...set }));
  const extra = Array.from({ length: delta }, () => ({ ...sets[sets.length - 1]! }));
  return [...sets.map((set) => ({ ...set })), ...extra];
}

function progressedRir(rir: null | number | undefined, micro: ProgressionMicrocycle): null | number | undefined {
  if (micro.rirTarget != null) return micro.rirTarget;
  if (micro.deload && rir != null) return Math.min(10, rir + DELOAD_RIR_BONUS);
  return rir;
}

function progressedWeight(weight: null | number | undefined, micro: ProgressionMicrocycle): null | number | undefined {
  if (weight == null) return weight;
  const explicitPct = micro.loadPct != null;
  const pct = explicitPct ? micro.loadPct! : micro.deload && micro.loadDeltaKg == null ? DELOAD_LOAD_PCT : 1;
  const next = weight * pct + (micro.loadDeltaKg ?? 0);
  return Math.max(0, Math.round(next * 4) / 4);
}

export type ProgressionHistorySet = { reps: null | number; rir: null | number; weightKg: null | number };

/**
 * Suggested weight for the next session: when every set of the last session reached the top of the
 * rep range with at least the required RIR, the heaviest weight used plus the increment. Otherwise null.
 */
export function suggestLoadIncrease(
  lastSets: ProgressionHistorySet[],
  target: { repsMax: null | number },
  autoLoad: AutoLoadRule | null | undefined,
): null | number {
  if (!autoLoad || lastSets.length === 0) return null;
  const done = lastSets.filter((set) => set.weightKg != null && set.reps != null);
  if (done.length === 0) return null;
  const topReps = !autoLoad.whenRepsAtTop || (target.repsMax != null && done.every((set) => set.reps! >= target.repsMax!));
  const enoughRir = done.every((set) => set.rir != null && set.rir >= autoLoad.rirAtOrAbove);
  if (!topReps || !enoughRir) return null;
  return Math.max(...done.map((set) => set.weightKg!)) + autoLoad.incrementKg;
}
