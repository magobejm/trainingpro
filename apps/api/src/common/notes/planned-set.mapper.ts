import type { ClientRoutineSet } from '../../modules/clients/domain/client-routine';

export type PlannedSetSnapshot = {
  advancedTechnique: null | string;
  durationSeconds?: null | number;
  fcMaxPct?: null | number;
  fcReservePct?: null | number;
  heartRate?: null | number;
  note: null | string;
  reps?: null | number;
  restSeconds?: null | number;
  rir?: null | number;
  rom?: null | string;
  rpe?: null | number;
  setIndex: number;
  weightKg?: null | number;
};

export function mapPlanSetsToPlannedSnapshots(
  sets: Array<{ setIndex: number; note?: null | string; advancedTechnique?: null | string }> | undefined,
): PlannedSetSnapshot[] {
  return (sets ?? [])
    .slice()
    .sort((a, b) => a.setIndex - b.setIndex)
    .map((set) => ({
      advancedTechnique: set.advancedTechnique ?? null,
      note: set.note ?? null,
      setIndex: set.setIndex,
    }));
}

export function mapClientRoutineSetsToPlannedSnapshots(sets: ClientRoutineSet[]): PlannedSetSnapshot[] {
  return sets
    .slice()
    .sort((a, b) => a.setIndex - b.setIndex)
    .map((set) => ({
      advancedTechnique: set.advancedTechnique,
      durationSeconds: set.durationSeconds ?? null,
      fcMaxPct: set.fcMaxPct ?? null,
      fcReservePct: set.fcReservePct ?? null,
      heartRate: set.heartRate ?? null,
      note: set.note,
      reps: set.reps ?? null,
      restSeconds: set.restSeconds ?? null,
      rir: set.rir ?? null,
      rom: set.rom ?? null,
      rpe: set.rpe ?? null,
      setIndex: set.setIndex,
      weightKg: set.weightKg ?? null,
    }));
}
