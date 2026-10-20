import { compareRoutineContent } from '../routine-comparison';

describe('routine content comparison', () => {
  const routine = (exercises: object[]) => ({ name: 'Plan', days: [{ dayIndex: 1, title: 'Day', exercises }] });
  it('ignores database identities and compares numeric values consistently', () => {
    const before = routine([{ id: 'old', displayName: 'Squat', sets: [{ id: 'a', weightKg: '20.00' }] }]);
    const after = routine([{ id: 'new', displayName: 'Squat', sets: [{ id: 'b', weightKg: 20 }] }]);
    expect(compareRoutineContent(before, after).changes).toEqual([]);
  });
  it('reports additions, removals and prescription changes', () => {
    const before = routine([{ displayName: 'Squat', repsMin: 8 }, { displayName: 'Press' }]);
    const after = routine([{ displayName: 'Squat', repsMin: 10 }, { displayName: 'Row' }]);
    const result = compareRoutineContent(before, after);
    expect(result.changes.map((change) => change.kind).sort()).toEqual(['added', 'modified', 'removed']);
    expect(result.changes.find((change) => change.kind === 'modified')?.fields).toEqual([
      { field: 'repsMin', before: 8, after: 10 },
    ]);
  });
  it('pairs duplicate exercises by occurrence and reports a move', () => {
    const before = routine([
      { displayName: 'Squat', sortOrder: 0 },
      { displayName: 'Press', sortOrder: 1 },
    ]);
    const after = routine([
      { displayName: 'Press', sortOrder: 0 },
      { displayName: 'Squat', sortOrder: 1 },
    ]);
    expect(compareRoutineContent(before, after).changes.every((change) => change.kind === 'moved')).toBe(true);
  });
  it('treats a first assignment as additions', () => {
    expect(compareRoutineContent(null, routine([{ displayName: 'Squat' }])).addedDays).toBe(1);
  });
  it('includes saved routine metadata and day warmups when showing an initial reference', () => {
    const result = compareRoutineContent(null, {
      name: 'Plan',
      neats: [{ title: 'Walk', description: '8000 steps' }],
      days: [{ dayIndex: 1, title: 'Day', notes: 'Keep steady', warmups: [{ name: 'Prepare', items: [{ repsMin: 5 }] }] }],
    });
    expect(result.changes.find((change) => change.scope === 'routine')?.fields).toContainEqual({
      field: 'neats',
      before: null,
      after: [{ title: 'Walk', description: '8000 steps' }],
    });
    expect(result.changes.find((change) => change.scope === 'day')?.fields).toContainEqual({
      field: 'warmups',
      before: null,
      after: [{ name: 'Prepare', items: [{ repsMin: 5 }] }],
    });
  });
  it.each(['exercises', 'cardioBlocks', 'plioBlocks', 'mobilityBlocks', 'isometricBlocks', 'sportBlocks'])(
    'compares advanced prescriptions in %s',
    (type) => {
      const before = {
        days: [
          {
            dayIndex: 1,
            title: 'Day',
            [type]: [
              {
                displayName: 'Exercise',
                sets: [{ setIndex: 0, durationSeconds: 30, advancedTechnique: 'DROP_SET' }],
                group: { groupType: 'CIRCUIT' },
                notes: 'Old',
              },
            ],
          },
        ],
      };
      const after = {
        days: [
          {
            dayIndex: 1,
            title: 'Day',
            [type]: [
              {
                displayName: 'Exercise',
                sets: [{ setIndex: 0, durationSeconds: 45, advancedTechnique: 'REST_PAUSE' }],
                group: { groupType: 'SUPERSET' },
                notes: 'New',
              },
            ],
          },
        ],
      };
      const result = compareRoutineContent(before, after);
      expect(result.modifiedExercises).toBe(1);
      expect(result.changes[0]?.fields.map((field) => field.field)).toEqual([
        'group.groupType',
        'notes',
        'sets.0.advancedTechnique',
        'sets.0.durationSeconds',
      ]);
    },
  );
});

it('ignores the technical variable-defaults marker', () => {
  expect(compareRoutineContent({ name: 'A', days: [] }, { name: 'A', days: [], setVariablesVersion: 2 }).changes).toEqual(
    [],
  );
});
