import { decidePhysicalTestSchedule } from '../../src/modules/physical-tests/domain/schedule-physical-test';

describe('decidePhysicalTestSchedule', () => {
  it('creates a schedule when the day is free', () => {
    expect(decidePhysicalTestSchedule(null, false)).toEqual({ kind: 'create' });
  });

  it('asks to replace a pending test and replaces it when confirmed', () => {
    expect(decidePhysicalTestSchedule({ resultId: null }, false)).toEqual({
      code: 'PHYSICAL_TEST_DAY_PENDING',
      kind: 'reject',
    });
    expect(decidePhysicalTestSchedule({ resultId: null }, true)).toEqual({ kind: 'replace' });
  });

  it('blocks a day that already has a completed test', () => {
    expect(decidePhysicalTestSchedule({ resultId: 'result-1' }, false)).toEqual({
      code: 'PHYSICAL_TEST_DAY_DONE',
      kind: 'reject',
    });
    expect(decidePhysicalTestSchedule({ resultId: 'result-1' }, true).kind).toBe('reject');
  });
});
