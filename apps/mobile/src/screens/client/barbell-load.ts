export const PLATE_KG = [25, 20, 15, 10, 5, 2.5, 1.25] as const;
export const RPE_STEPS = [6, 7, 8, 9, 10] as const;

export type PlateLoad = {
  barExceeds: boolean;
  loadedKg: number;
  plates: number[];
  remainderKg: number;
};

type PerformedSet = {
  effortRir?: number | null;
  effortRpe?: number | null;
  repsDone?: number | null;
  weightDoneKg?: number | null;
};

export function platesPerSide(weightKg: number, barKg: number): PlateLoad {
  const target = toCents(weightKg);
  const bar = toCents(barKg);
  if (target <= bar) return { barExceeds: target < bar, loadedKg: barKg, plates: [], remainderKg: 0 };
  const plates = fillSide(Math.floor((target - bar) / 2));
  const loaded = bar + plates.reduce((sum, plate) => sum + toCents(plate), 0) * 2;
  return { barExceeds: false, loadedKg: loaded / 100, plates, remainderKg: Math.max(0, (target - loaded) / 100) };
}

export function groupPlates(plates: number[]): { count: number; kg: number }[] {
  const groups: { count: number; kg: number }[] = [];
  for (const kg of plates) {
    const last = groups.at(-1);
    if (last && last.kg === kg) last.count += 1;
    else groups.push({ count: 1, kg });
  }
  return groups;
}

export function estimateE1rm(weightKg: number, reps: number, rpe: number | null, rir?: number | null): number | null {
  if (weightKg <= 0 || reps <= 0 || (rpe == null && rir == null)) return null;
  const reserve = rir != null && rir >= 0 ? rir : Math.max(0, 10 - (rpe ?? 10));
  const denominator = 1.0278 - 0.0278 * (reps + reserve);
  if (denominator <= 0) return null;
  return Math.round((weightKg / denominator) * 100) / 100;
}

export function weightForRpe(e1rm: number, reps: number, rpe: number): number | null {
  if (e1rm <= 0 || reps <= 0) return null;
  const factor = 1.0278 - 0.0278 * (reps + Math.max(0, 10 - rpe));
  if (factor <= 0) return null;
  return Math.round(e1rm * factor * 10) / 10;
}

export function bestE1rm(sets: PerformedSet[]): number | null {
  let best: number | null = null;
  for (const set of sets) {
    if (set.weightDoneKg == null || set.repsDone == null) continue;
    const value = estimateE1rm(set.weightDoneKg, set.repsDone, set.effortRpe ?? null, set.effortRir);
    if (value != null && (best == null || value > best)) best = value;
  }
  return best;
}

export function percentOfE1rm(weightKg: number, e1rm: number): number | null {
  if (e1rm <= 0 || weightKg <= 0) return null;
  return Math.round((weightKg / e1rm) * 100);
}

export function formatLoadKg(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function fillSide(sideCents: number): number[] {
  const plates: number[] = [];
  let remaining = sideCents;
  for (const plate of PLATE_KG) {
    const size = toCents(plate);
    while (remaining >= size) {
      plates.push(plate);
      remaining -= size;
    }
  }
  return plates;
}

function toCents(kg: number): number {
  return Math.round(kg * 100);
}
