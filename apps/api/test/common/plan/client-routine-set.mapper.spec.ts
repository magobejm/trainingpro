import { resolveClientRoutineSets } from '../../../src/common/plan/client-routine-set.mapper';

describe('resolveClientRoutineSets mapping', () => {
  it('maps strength set metrics and preserves order by setIndex', () => {
    const sets = resolveClientRoutineSets(
      [
        { setIndex: 1, reps: 10, weightKg: 60, rir: 1, rpe: 9, restSeconds: 90, advancedTechnique: 'topSet' },
        { setIndex: 0, reps: 10, weightKg: 60, rir: 2, rpe: 8, restSeconds: 90 },
      ],
      'strength',
    );

    expect(sets).toEqual([
      {
        advancedTechnique: null,
        note: null,
        reps: 10,
        restSeconds: 90,
        rir: 2,
        rpe: 8,
        setIndex: 0,
        weightKg: 60,
      },
      {
        advancedTechnique: 'topSet',
        note: null,
        reps: 10,
        restSeconds: 90,
        rir: 1,
        rpe: 9,
        setIndex: 1,
        weightKg: 60,
      },
    ]);
  });

  it('maps cardio metrics only for cardio blocks', () => {
    const sets = resolveClientRoutineSets(
      [{ setIndex: 0, fcMaxPct: 85, fcReservePct: 70, heartRate: 150, rpe: 7 }],
      'cardio',
    );

    expect(sets[0]).toMatchObject({
      fcMaxPct: 85,
      fcReservePct: 70,
      heartRate: 150,
      rpe: 7,
      setIndex: 0,
    });
    expect(sets[0]).not.toHaveProperty('reps');
  });
});

describe('resolveClientRoutineSets fallbacks', () => {
  it('fills missing per-set strength values from block prescription and meta', () => {
    const sets = resolveClientRoutineSets(
      [
        { setIndex: 0, advancedTechnique: 'topSet' },
        { setIndex: 1, advancedTechnique: 'backOffSet' },
      ],
      'strength',
      {
        notes: 'Nota\n[meta] {"repsPorSerie":"10,10,8"}',
        repsMax: 12,
        repsMin: 6,
        restSeconds: 90,
        setsPlanned: 3,
        targetRir: 2,
        targetRpe: 8,
        weightRangeMaxKg: 60,
      },
    );

    expect(sets).toEqual([
      {
        advancedTechnique: 'topSet',
        note: null,
        reps: 10,
        restSeconds: 90,
        rir: 2,
        rpe: 8,
        setIndex: 0,
        weightKg: 60,
      },
      {
        advancedTechnique: 'backOffSet',
        note: null,
        reps: 10,
        restSeconds: 90,
        rir: 2,
        rpe: 8,
        setIndex: 1,
        weightKg: 60,
      },
    ]);
  });

  it('synthesizes sets from setsPlanned when no set rows exist', () => {
    const sets = resolveClientRoutineSets([], 'strength', {
      notes: '[meta] {"repsPorSerie":"50,50,50"}',
      repsMax: 10,
      repsMin: 10,
      restSeconds: 50,
      setsPlanned: 3,
      targetRir: 1,
      targetRpe: 9,
      weightRangeMaxKg: 20,
    });

    expect(sets).toHaveLength(3);
    expect(sets[0]).toMatchObject({ setIndex: 0, reps: 50, weightKg: 20, rir: 1, rpe: 9, restSeconds: 50 });
    expect(sets[2]).toMatchObject({ setIndex: 2, reps: 50 });
  });
});
