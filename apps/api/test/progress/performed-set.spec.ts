import {
  averageRecorded,
  cardioIntervalHasData,
  filterPerformedSourceIds,
  isometricSetHasData,
  mobilitySetHasData,
  plioSetHasData,
  sportLoadFromLog,
  sportLogHasData,
  strengthSetHasData,
  summarizeCardioIntervals,
  summarizeIsometricSets,
  summarizeMobilitySets,
  summarizePlioSets,
} from '../../src/common/performed-set';

describe('performed set', () => {
  test('a strength set counts only when it has a recorded value', () => {
    expect(strengthSetHasData({ effortRir: null, effortRpe: null, repsDone: null, weightDoneKg: null })).toBe(false);
    expect(strengthSetHasData({ effortRir: 0, effortRpe: 0, repsDone: 0, weightDoneKg: 0 })).toBe(false);
    expect(strengthSetHasData({ effortRpe: null, repsDone: 8, weightDoneKg: null })).toBe(true);
  });

  test('plio, isometric and mobility ignore a set with no recorded values', () => {
    expect(plioSetHasData({ durationSecondsDone: null, effortRpe: null, repsDone: null, weightDoneKg: null })).toBe(false);
    expect(isometricSetHasData({ durationSecondsDone: null, effortRpe: null, weightDoneKg: null })).toBe(false);
    expect(mobilitySetHasData({ effortRpe: null, repsDone: null, romDone: '  ', weightDoneKg: null })).toBe(false);
    expect(mobilitySetHasData({ effortRpe: null, repsDone: null, romDone: 'completo', weightDoneKg: null })).toBe(true);
    expect(
      cardioIntervalHasData({
        avgHeartRate: null,
        distanceDoneMeters: null,
        durationSecondsDone: null,
        effortRpe: null,
      }),
    ).toBe(false);
  });

  test('two plio sets with data and one empty count as two and skip missing reps', () => {
    const summary = summarizePlioSets([
      { durationSecondsDone: null, effortRpe: 8, repsDone: 6, weightDoneKg: 10 },
      { durationSecondsDone: null, effortRpe: null, repsDone: 6, weightDoneKg: 10 },
      { durationSecondsDone: null, effortRpe: null, repsDone: null, weightDoneKg: null },
    ]);
    expect(summary.sets).toBe(2);
    expect(summary.totalReps).toBe(12);
    expect(summary.tonnage).toBe(120);
    expect(summary.avgRpe).toBe(8);
  });

  test('isometric and mobility totals skip absent duration, reps and rpe', () => {
    const isometric = summarizeIsometricSets([
      { durationSecondsDone: 30, effortRpe: 7, weightDoneKg: 20 },
      { durationSecondsDone: null, effortRpe: null, weightDoneKg: null },
    ]);
    expect(isometric.sets).toBe(1);
    expect(isometric.totalDurationSeconds).toBe(30);
    expect(isometric.avgRpe).toBe(7);

    const mobility = summarizeMobilitySets([
      { effortRpe: 5, repsDone: 10, romDone: null, weightDoneKg: null },
      { effortRpe: null, repsDone: null, romDone: null, weightDoneKg: null },
    ]);
    expect(mobility.sets).toBe(1);
    expect(mobility.totalReps).toBe(10);
    expect(mobility.avgRpe).toBe(5);
  });

  test('an empty cardio interval does not increment series', () => {
    const summary = summarizeCardioIntervals([
      { avgHeartRate: 150, distanceDoneMeters: 400, durationSecondsDone: 90, effortRpe: 8 },
      { avgHeartRate: null, distanceDoneMeters: null, durationSecondsDone: null, effortRpe: null },
    ]);
    expect(summary.sets).toBe(1);
    expect(summary.totalDurationSeconds).toBe(90);
    expect(summary.totalDistanceMeters).toBe(400);
    expect(summary.avgRpe).toBe(8);
  });

  test('sport load does not treat a missing rpe or duration as zero', () => {
    expect(sportLogHasData({ avgHeartRate: null, durationMinutesDone: null, effortRpe: null })).toBe(false);
    expect(sportLoadFromLog(30, null)).toBeNull();
    expect(sportLoadFromLog(null, 8)).toBeNull();
    expect(sportLoadFromLog(30, 8)).toEqual({ inol: 24, tonnage: 240 });
  });

  test('the search keeps an exercise only when one log has data', () => {
    expect(
      filterPerformedSourceIds(
        [
          { logs: [], sourceId: 'untouched' },
          { logs: [{ repsDone: null, weightDoneKg: null }], sourceId: 'empty-log' },
          { logs: [{ repsDone: 8, weightDoneKg: 60 }], sourceId: 'done' },
          { logs: [{ repsDone: 5, weightDoneKg: 40 }], sourceId: null },
        ],
        (log) => strengthSetHasData(log),
      ),
    ).toEqual(['done']);
  });

  test('a null value stays out of the average divisor', () => {
    expect(averageRecorded([8, null, 6])).toBe(7);
    expect(averageRecorded([null, 0])).toBeNull();
  });
});
