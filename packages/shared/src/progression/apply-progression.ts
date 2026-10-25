import { z } from 'zod';

export const progressionRuleSchema = z.object({
  autoLoad: z
    .object({
      incrementKg: z.number().positive().max(50),
      rirAtOrAbove: z.number().int().min(0).max(10),
      whenRepsAtTop: z.boolean(),
    })
    .optional(),
  weeks: z
    .array(
      z.object({
        deload: z.boolean().optional(),
        loadDeltaKg: z.number().min(-100).max(100).nullable().optional(),
        loadPct: z.number().min(0).max(2).nullable().optional(),
        rirTarget: z.number().int().min(0).max(10).nullable().optional(),
        setsDelta: z.number().int().min(-10).max(10).optional(),
      }),
    )
    .max(16),
});

export type ProgressionWeek = {
  deload?: boolean;
  loadDeltaKg?: number | null;
  loadPct?: number | null;
  rirTarget?: number | null;
  setsDelta?: number;
};

export type AutoLoadRule = {
  incrementKg: number;
  rirAtOrAbove: number;
  whenRepsAtTop: boolean;
};

export type ProgressionRule = {
  autoLoad?: AutoLoadRule;
  weeks: ProgressionWeek[];
};

export type ProgressionSet = {
  repsMax: number | null;
  repsMin: number | null;
  setIndex: number;
  targetRir: number | null;
  weightKg: number | null;
};

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function progressionWeekIndex(appliedAt: Date, on: Date, blockWeeks: number | null): number {
  const weeks = Math.max(0, Math.floor((on.getTime() - appliedAt.getTime()) / WEEK_MS));
  if (!blockWeeks || blockWeeks < 1) return weeks;
  return weeks % blockWeeks;
}

export function applyProgression(baseSets: ProgressionSet[], rule: ProgressionRule, weekIndex: number): ProgressionSet[] {
  const week = rule.weeks[Math.min(Math.max(weekIndex, 0), Math.max(rule.weeks.length - 1, 0))];
  if (!week) return baseSets.map((set) => ({ ...set }));
  const grown = applySetsDelta(baseSets, week.setsDelta ?? 0);
  return grown.map((set, index) => ({
    ...set,
    setIndex: index,
    targetRir: week.rirTarget ?? set.targetRir,
    weightKg: progressedWeight(set.weightKg, week),
  }));
}

export function suggestNextWeight(input: {
  performedReps: number;
  repsMax: number;
  rir: number | null;
  rule: AutoLoadRule;
  weightKg: number;
}): number | null {
  if (!input.rule.whenRepsAtTop || input.performedReps < input.repsMax) return null;
  if (input.rir != null && input.rir < input.rule.rirAtOrAbove) return null;
  return roundHalf(input.weightKg + input.rule.incrementKg);
}

/** Tres semanas de subida de 2.5 kg y una de descarga al 70 %. */
export function linearDeloadPreset(): ProgressionRule {
  return {
    autoLoad: { incrementKg: 2.5, rirAtOrAbove: 2, whenRepsAtTop: true },
    weeks: [
      { loadDeltaKg: 0, setsDelta: 0 },
      { loadDeltaKg: 2.5, setsDelta: 0 },
      { loadDeltaKg: 5, setsDelta: 0 },
      { deload: true, loadPct: 0.7, setsDelta: -1 },
    ],
  };
}

function applySetsDelta(baseSets: ProgressionSet[], delta: number): ProgressionSet[] {
  if (baseSets.length === 0 || delta === 0) return baseSets.map((set) => ({ ...set }));
  if (delta < 0) return baseSets.slice(0, Math.max(1, baseSets.length + delta)).map((set) => ({ ...set }));
  const sets = baseSets.map((set) => ({ ...set }));
  const last = sets[sets.length - 1];
  if (!last) return sets;
  for (let index = 0; index < delta; index += 1) sets.push({ ...last, setIndex: sets.length });
  return sets;
}

function progressedWeight(weight: number | null, week: ProgressionWeek): number | null {
  if (weight == null) return null;
  if (week.deload && week.loadPct == null && week.loadDeltaKg == null) return roundHalf(weight * 0.6);
  const scaled = week.loadPct == null ? weight : weight * week.loadPct;
  return roundHalf(scaled + (week.loadDeltaKg ?? 0));
}

function roundHalf(value: number): number {
  return Math.round(value * 2) / 2;
}
