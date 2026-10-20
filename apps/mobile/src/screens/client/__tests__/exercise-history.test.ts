import { historyColumns, historyCell, historyDate } from '../exercise-history.utils';

describe('previous workout cards', () => {
  it('includes every recorded variable and zero, but no prescribed or empty columns', () => {
    const columns = historyColumns([
      { itemId: 'a', setIndex: 1, weightDoneKg: 0, repsDone: 12, effortRir: 0, restSecondsDone: 60 },
      {
        itemId: 'a',
        setIndex: 2,
        durationSecondsDone: 45,
        romDone: '3',
        heartRateDone: 140,
        hrMaxPctDone: 80,
        hrReservePctDone: 60,
        distanceDoneMeters: 200,
        effortRpe: 7.5,
      },
    ]);
    expect(columns.map((column) => column.key)).toEqual([
      'repsDone',
      'weightDoneKg',
      'effortRpe',
      'hrMaxPctDone',
      'durationSecondsDone',
      'distanceDoneMeters',
      'heartRateDone',
      'effortRir',
      'hrReservePctDone',
      'romDone',
      'restSecondsDone',
    ]);
    expect(historyColumns([{ itemId: 'a', setIndex: 1, repsDone: null, romDone: '' }])).toEqual([]);
    expect(historyCell(0)).toBe('0');
    expect(historyCell(null)).toBe('—');
    expect(historyCell(7.5)).toBe('7.5');
  });
  it('formats date-only values without a timezone shift', () => {
    expect(historyDate('2026-10-12', 'es')).toBe('12/10/2026');
  });
});

it('formats distances in km and durations in minutes only for cardio and sport', () => {
  expect(historyCell(1250, 'distanceDoneMeters', 'cardio')).toBe('1.25');
  expect(historyCell(150, 'durationSecondsDone', 'sport')).toBe('2.5');
  expect(historyCell(150, 'durationSecondsDone', 'plio')).toBe('150');
});
