import { filterActiveSetColumns, filterRoutineSetColumns, isFieldLocked, isRestFieldLocked } from '../locked-fields.utils';
import type { SetColumn } from '../../screens/client/active-exercise.helpers';

describe('locked-fields.utils', () => {
  it('filters preview columns by web field keys', () => {
    const columns = filterRoutineSetColumns(
      [
        { key: 'reps', labelKey: 'client.label.reps', format: () => '-' },
        { key: 'weightKg', labelKey: 'weight', format: () => '-' },
      ],
      ['weightKg'],
    );

    expect(columns.map((column) => column.key)).toEqual(['reps']);
  });

  it('filters active session columns using web-to-mobile mapping', () => {
    const columns: SetColumn[] = [
      { key: 'reps', labelKey: 'mobile.client.history.reps' },
      { key: 'weight', labelKey: 'mobile.client.history.weight' },
      { key: 'rpe', labelKey: 'mobile.client.history.rpe' },
    ];

    expect(filterActiveSetColumns(columns, ['weightKg']).map((column) => column.key)).toEqual(['reps', 'rpe']);
  });

  it('detects locked rest fields', () => {
    expect(isRestFieldLocked(['restSeconds'])).toBe(true);
    expect(isFieldLocked(['rir'], 'rir')).toBe(true);
    expect(isFieldLocked(['rir'], 'reps')).toBe(false);
  });
});
