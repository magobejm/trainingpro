import { describe, expect, it } from 'vitest';
import { fieldLabel, valueLabel, visibleComparisonField } from './routine-comparison-display';
import es from '../../i18n/locales/es/common.json';

const t = (key: string, options?: Record<string, unknown>) =>
  (es as Record<string, string>)[key] ?? String(options?.defaultValue ?? key);

describe('routine comparison presentation', () => {
  it('shows objective names without catalog metadata', () => {
    expect(
      valueLabel([{ label: 'Fuerza máxima', code: 'fuerza_maxima', isDefault: false, sortOrder: 10 }], t, 'objectives'),
    ).toBe('Fuerza máxima');
  });
  it('keeps nested warmup prescriptions and hides technical identifiers', () => {
    const text = valueLabel(
      {
        items: [
          {
            displayName: 'Cat-Cow',
            mobilityExerciseLibraryId: '1aac01bb-e54f-4f94-8ce3-d8284445d41a',
            blockType: 'mobility',
            reps: 8,
          },
        ],
      },
      t,
    );
    expect(text).toContain('Cat-Cow');
    expect(text).toContain('Movilidad');
    expect(text).toContain('Repeticiones: 8');
    expect(text).not.toMatch(/LibraryId|1aac01bb/);
  });
  it('numbers sets from one and translates modes', () => {
    expect(fieldLabel('sets.0.reps', t)).toBe('Series · 1 · Repeticiones');
    expect(valueLabel(0, t, 'setIndex')).toBe('1');
    expect(valueLabel('COACH_INPUT', t)).toBe('Indicado por el entrenador');
    expect(valueLabel(false, t)).toBe('No');
    expect(valueLabel(0, t, 'reps')).toBe('0');
    expect(visibleComparisonField('items.0.mobilityExerciseLibraryId')).toBe(false);
  });
});
