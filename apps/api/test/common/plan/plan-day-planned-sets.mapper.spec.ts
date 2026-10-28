import { buildPlanDayPlannedSetsLookup } from '../../../src/common/plan/plan-day-planned-sets.mapper';

describe('buildPlanDayPlannedSetsLookup', () => {
  it('maps per-set strength prescription by sort order', () => {
    const lookup = buildPlanDayPlannedSetsLookup({
      cardioBlocks: [],
      exercises: [
        {
          notes: null,
          perSetWeightRangesJson: null,
          repsMax: 12,
          repsMin: 8,
          restSeconds: 90,
          sets: [
            { setIndex: 0, reps: 10, weightKg: 60, rir: 2, rpe: 8 },
            { setIndex: 1, reps: 8, weightKg: 62.5, rir: 1, rpe: 9 },
          ],
          setsPlanned: 2,
          sortOrder: 1,
          targetRir: 3,
          targetRpe: 7,
          weightRangeMaxKg: 50,
          weightRangeMinKg: 40,
        },
      ],
      isometricBlocks: [],
      mobilityBlocks: [],
      plioBlocks: [],
      sportBlocks: [],
    });

    expect(lookup.get(1)).toEqual([
      {
        advancedTechnique: null,
        distanceMeters: null,
        durationSeconds: null,
        fcMaxPct: null,
        fcMaxPctMax: null,
        fcReservePct: null,
        fcReservePctMax: null,
        heartRate: null,
        heartRateMax: null,
        note: null,
        reps: 10,
        restSeconds: 90,
        rir: 2,
        rom: null,
        rpe: 8,
        setIndex: 0,
        weightKg: 60,
      },
      {
        advancedTechnique: null,
        distanceMeters: null,
        durationSeconds: null,
        fcMaxPct: null,
        fcMaxPctMax: null,
        fcReservePct: null,
        fcReservePctMax: null,
        heartRate: null,
        heartRateMax: null,
        note: null,
        reps: 8,
        restSeconds: 90,
        rir: 1,
        rom: null,
        rpe: 9,
        setIndex: 1,
        weightKg: 62.5,
      },
    ]);
  });
});
