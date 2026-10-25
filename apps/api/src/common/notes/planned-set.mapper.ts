import type { PlanSetRow } from '../plan/client-routine-set.mapper';
import type { ClientRoutineSet } from '../../modules/clients/domain/client-routine';

export type PlannedSetSnapshot = {
  advancedTechnique: null | string;
  distanceMeters?: null | number;
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
  suggestedWeightKg?: null | number;
  weightKg?: null | number;
};

export function mapPlanSetsToPlannedSnapshots(sets: PlanSetRow[] | undefined): PlannedSetSnapshot[] {
  return (sets ?? [])
    .slice()
    .sort((a, b) => a.setIndex - b.setIndex)
    .map((set) => ({
      ...Object.fromEntries(
        [
          'distanceMeters',
          'durationSeconds',
          'fcMaxPct',
          'fcReservePct',
          'heartRate',
          'reps',
          'restSeconds',
          'rir',
          'rom',
          'rpe',
          'weightKg',
        ].flatMap((key) => {
          const value = set[key as keyof PlanSetRow];
          return value === undefined
            ? []
            : [[key, value != null && (key === 'rpe' || key === 'weightKg') ? Number(value) : value]];
        }),
      ),
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
      distanceMeters: set.distanceMeters ?? null,
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
