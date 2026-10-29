import { coachDocumentSetLines } from '../coach-plan-model';
import { coachMonthDays, localCoachDate, shiftCoachDate, shiftCoachMonth, isCoachDate } from '../coach-calendar';
import {
  changeRoutineBlock,
  freshRoutineDay,
  reorderRoutineBlock,
  routineEntries,
  moveRoutineBlockToDay,
} from '../coach-plan-model';
import { createCoachBlock } from '@trainerpro/shared';
import { finishCoachEditor } from '../coach-editor-state';
describe('coach workspace date and plan editing', () => {
  it('moves a grouped exercise to another day without losing sets or colliding with that day groups', () => {
    const source = {
      ...freshRoutineDay('A'),
      groups: [{ clientId: 'g1', groupType: 'CIRCUIT' }],
      exercises: [
        {
          ...createCoachBlock('strength', 'Sentadilla', 0),
          id: 'old-block',
          groupId: 'g1',
          sets: [{ setIndex: 0, reps: 8 }],
        },
      ],
    };
    const target = { ...freshRoutineDay('B'), groups: [{ clientId: 'g1', groupType: 'SUPERSET' }] };
    const result = moveRoutineBlockToDay([source, target], 0, 1, routineEntries(source)[0]!);
    expect(routineEntries(result[0]!)).toHaveLength(0);
    expect(routineEntries(result[1]!)[0]!.value).toMatchObject({ sets: [{ setIndex: 0, reps: 8 }] });
    expect(routineEntries(result[1]!)[0]!.value.id).toBeUndefined();
    expect(routineEntries(result[1]!)[0]!.value.groupId).not.toBe('g1');
    expect(result[1]!.groups).toHaveLength(2);
    expect(routineEntries(source)).toHaveLength(1);
  });
  it('does not let a saved old editor close a newly opened editor for the same resource', () => {
    const newer = { token: 2, value: 'new' };
    expect(finishCoachEditor(newer, 1)).toBe(newer);
    expect(finishCoachEditor(newer, 2)).toBeNull();
  });
  it('uses civil dates across month/year and leap-day boundaries', () => {
    expect(shiftCoachDate('2024-02-28', 1)).toBe('2024-02-29');
    expect(shiftCoachDate('2026-12-31', 1)).toBe('2027-01-01');
    expect(coachMonthDays('2026-10-15')).toHaveLength(42);
    expect(new Date(coachMonthDays('2026-10-15')[0] + 'T12:00:00').getDay()).toBe(1);
    expect(localCoachDate(new Date(2026, 9, 15, 23, 59))).toBe('2026-10-15');
    expect(shiftCoachMonth('2026-01-01', 1)).toBe('2026-02-01');
    expect(shiftCoachMonth('2026-01-31', 1)).toBe('2026-02-28');
    expect(shiftCoachMonth('2026-12-31', 1)).toBe('2027-01-31');
    expect(isCoachDate('2026-02-30')).toBe(false);
    expect(isCoachDate('2024-02-29')).toBe(true);
  });
  it('reorders different exercise categories without dropping advanced sets or grouping', () => {
    const day = {
      ...freshRoutineDay('Mixta'),
      exercises: [
        {
          ...createCoachBlock('strength', 'Sentadilla', 0),
          groupId: 'group-a',
          sets: [{ setIndex: 0, advancedTechnique: 'dropSet', note: 'Control' }],
        },
      ],
      cardioBlocks: [createCoachBlock('cardio', 'Carrera', 1)],
    };
    const entry = routineEntries(day)[0]!;
    const changed = reorderRoutineBlock(day, entry, 1);
    expect(routineEntries(changed).map((row) => row.value.displayName)).toEqual(['Carrera', 'Sentadilla']);
    expect(routineEntries(changed)[1]?.value.sets).toEqual([{ setIndex: 0, advancedTechnique: 'dropSet', note: 'Control' }]);
    expect(routineEntries(day)[0]?.value.sortOrder).toBe(0);
    expect(changeRoutineBlock(changed, 'cardio', 0, null).cardioBlocks).toEqual([]);
  });
});

it('formats cardio and sport PDF series in order and display units', () => {
  for (const kind of ['cardio', 'sport'] as const) {
    const lines = coachDocumentSetLines(
      kind,
      { sets: [{ setIndex: 0, distanceMeters: 1250, durationSeconds: 150, rpe: 7 }] },
      (key) => key,
    );
    expect(lines[0]).toBe(
      'coachWorkspace.set 1: coachWorkspace.field.rpe 7 · coachWorkspace.field.durationSeconds 150' +
        ' · coachWorkspace.field.distanceMeters 1.25',
    );
  }
  expect(coachDocumentSetLines('sport', { durationMinutes: 30 }, (key) => key)[0]).toContain('durationSeconds 1800');
});
