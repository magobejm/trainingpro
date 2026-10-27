import { describe, expect, it } from 'vitest';
import { buildWeekSlots, dayExerciseNames, planningSummary, readPublishedRoutine } from './client-planning-view';

describe('readPublishedRoutine', () => {
  it('reads the published name, days and daily activity', () => {
    const routine = readPublishedRoutine({
      days: [{ dayIndex: 1, exercises: [{ displayName: 'Press' }], title: 'Fuerza' }],
      expectedCompletionDays: 7,
      name: ' rutina_1 ',
      neats: [{ description: 'Caminar', title: 'Pasos' }, { title: '  ' }],
    });
    expect(routine?.name).toBe('rutina_1');
    expect(routine?.days).toHaveLength(1);
    expect(routine?.neats).toEqual([{ description: 'Caminar', title: 'Pasos' }]);
  });

  it('is empty without a published routine', () => {
    expect(readPublishedRoutine(null)).toBeNull();
    expect(planningSummary(null)).toBeNull();
  });
});

describe('dayExerciseNames', () => {
  it('lists the name of every block and skips blanks', () => {
    expect(
      dayExerciseNames({
        cardioBlocks: [{ displayName: 'Remo' }],
        dayIndex: 2,
        exercises: [{ displayName: 'Press' }, { displayName: '  ' }],
        isometricBlocks: [{ displayName: 'Plancha' }],
      }),
    ).toEqual(['Press', 'Remo', 'Plancha']);
  });
});

describe('buildWeekSlots', () => {
  it('places each day on its index and leaves the rest empty', () => {
    const slots = buildWeekSlots([{ dayIndex: 1, title: 'Fuerza' }], 7);
    expect(slots).toHaveLength(7);
    expect(slots[0]?.day?.title).toBe('Fuerza');
    expect(slots[1]?.day).toBeNull();
  });
});
