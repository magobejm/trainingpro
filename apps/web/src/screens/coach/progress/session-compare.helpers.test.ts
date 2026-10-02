import { describe, expect, it } from 'vitest';
import { comparePlannedAndLogged } from './session-compare.helpers';

describe('comparePlannedAndLogged', () => {
  it('joins planned and logged strength values and flags deviations', () => {
    const rows = comparePlannedAndLogged({
      displayName: 'Press',
      id: 's1',
      logs: [{ effortRpe: 9, repsDone: 8, setIndex: 1, weightDoneKg: 62.5 }],
      plannedSets: [{ reps: 8, rpe: 8, setIndex: 1, weightKg: 60 }],
      type: 'strength',
    });
    expect(rows).toHaveLength(1);
    const byKey = Object.fromEntries(rows[0]!.cells.map((cell) => [cell.key, cell]));
    expect(byKey.reps).toEqual({ differs: false, done: '8', key: 'reps', planned: '8' });
    expect(byKey.weightKg).toEqual({ differs: true, done: '62.5', key: 'weightKg', planned: '60' });
    expect(byKey.rpe).toEqual({ differs: true, done: '9', key: 'rpe', planned: '8' });
  });

  it('joins sport planned sets with per-set logs', () => {
    const rows = comparePlannedAndLogged({
      displayName: 'Fútbol',
      id: 'sp1',
      plannedSets: [{ durationSeconds: 90, reps: 10, setIndex: 0 }],
      setLogs: [{ durationSecondsDone: 80, repsDone: 10, setIndex: 0 }],
      type: 'sport',
    });
    expect(rows).toHaveLength(1);
    const byKey = Object.fromEntries(rows[0]!.cells.map((cell) => [cell.key, cell]));
    expect(byKey.reps).toEqual({ differs: false, done: '10', key: 'reps', planned: '10' });
    expect(byKey.durationSeconds).toEqual({ differs: true, done: '80', key: 'durationSeconds', planned: '90' });
  });
});
