import { buildLogPayload, getSetColumns } from '../active-exercise.helpers';
import type { SessionItem } from '../../../data/hooks/useTodaySession';

describe('active-exercise.helpers', () => {
  it('returns four columns for strength items', () => {
    const item = { type: 'strength' } as SessionItem;
    expect(getSetColumns(item).map((column) => column.key)).toEqual(['reps', 'rir', 'rpe', 'weight']);
  });

  it('builds strength log payload from draft values', () => {
    const item = { type: 'strength', id: 'item-1' } as SessionItem;
    const payload = buildLogPayload(item, 1, {
      distance: '',
      duration: '',
      heartRate: '',
      reps: '8',
      rest: '',
      rir: '2',
      rpe: '8',
      rom: '',
      weight: '60',
    });

    expect(payload).toEqual({
      effortRir: 2,
      effortRpe: 8,
      repsDone: 8,
      sessionItemId: 'item-1',
      setIndex: 1,
      weightDoneKg: 60,
    });
  });
});
