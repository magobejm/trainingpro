import { applyProgression, type ProgressionMicrocycle, type ProgressionRule } from '@trainerpro/shared';
import type { DraftBlock } from './RoutinePlanner.types';

export type ProgressionPreset = 'linear' | 'undulating';

const STARTING_RIR = 3;

/** Lowers the RIR each microcycle, adds a set in the one before the end and deloads in the last one. */
export function linearPreset(count: number): ProgressionMicrocycle[] {
  return Array.from({ length: count }, (_, index) => {
    if (count > 1 && index === count - 1) return { deload: true };
    const micro: ProgressionMicrocycle = { rirTarget: Math.max(0, STARTING_RIR - index) };
    if (count > 2 && index === count - 2) micro.setsDelta = 1;
    return micro;
  });
}

/** Alternates a heavier microcycle with a lighter one. */
export function undulatingPreset(count: number): ProgressionMicrocycle[] {
  return Array.from({ length: count }, (_, index) =>
    index % 2 === 0 ? { loadPct: 1, rirTarget: 2 } : { loadPct: 0.9, rirTarget: 3 },
  );
}

export function buildPreset(preset: ProgressionPreset, count: number): ProgressionMicrocycle[] {
  return preset === 'linear' ? linearPreset(count) : undulatingPreset(count);
}

/** Keeps exactly `count` microcycles, padding with empty ones or dropping the extra ones. */
export function fitMicrocycles(microcycles: ProgressionMicrocycle[], count: number): ProgressionMicrocycle[] {
  return Array.from({ length: count }, (_, index) => microcycles[index] ?? {});
}

type BaseSet = { reps?: null | number; rir?: null | number; setIndex: number; weightKg?: null | number };

export function baseSetsOf(block: DraftBlock): BaseSet[] {
  if (block.sets?.length) {
    return block.sets.map((set, index) => ({
      reps: set.reps ?? null,
      rir: set.rir ?? block.targetRir ?? null,
      setIndex: index,
      weightKg: set.weightKg ?? null,
    }));
  }
  return Array.from({ length: block.setsPlanned ?? 0 }, (_, index) => ({
    rir: block.targetRir ?? null,
    setIndex: index,
    weightKg: block.weightKg ?? null,
  }));
}

export type PreviewRow = { rir: null | number; sets: number; weightKg: null | number };

/** What each microcycle of the mesocycle will prescribe, for the planner preview (M1..Mn). */
export function previewRows(block: DraftBlock, rule: ProgressionRule, count: number): PreviewRow[] {
  const base = baseSetsOf(block);
  if (base.length === 0) return [];
  return Array.from({ length: count }, (_, index) => {
    const sets = applyProgression(base, rule, index);
    return { rir: sets[0]?.rir ?? null, sets: sets.length, weightKg: sets[0]?.weightKg ?? null };
  });
}
