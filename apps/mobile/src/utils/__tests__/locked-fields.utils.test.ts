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
      { key: 'reps', label: 'Reps' },
      { key: 'weight', label: 'Peso' },
      { key: 'rpe', label: 'RPE' },
    ];

    expect(filterActiveSetColumns(columns, ['weightKg']).map((column) => column.key)).toEqual(['reps', 'rpe']);
  });

  it('detects locked rest fields', () => {
    expect(isRestFieldLocked(['restSeconds'])).toBe(true);
    expect(isFieldLocked(['rir'], 'rir')).toBe(true);
    expect(isFieldLocked(['rir'], 'reps')).toBe(false);
  });
});
