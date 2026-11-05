import { setVariablesForType, type ExerciseBlockType, type SetVariableKey } from '../exercise-set-variables';
import { glossary, glossaryCoversSetVariables, glossaryEntry } from '../glossary';

const LOCALES = ['es', 'en'] as const;
const TYPES: ExerciseBlockType[] = ['strength', 'cardio', 'isometric', 'plio', 'mobility', 'sport'];
const KEYS: SetVariableKey[] = [
  'distanceMeters',
  'durationSeconds',
  'fcMaxPct',
  'fcReservePct',
  'heartRate',
  'reps',
  'restSeconds',
  'rir',
  'rom',
  'rpe',
  'weightKg',
];
const PROGRESS = ['tonnage', 'totalReps', 'e1rm', 'inol', 'trainingLoad', 'adherence', 'microcycle', 'sessionRpe'];

describe('glossary set variables', () => {
  it.each(LOCALES)('covers every set variable in %s and only the ones each exercise type uses', (locale) => {
    const covered = glossary(locale)
      .groups.find((group) => group.id === 'sets')
      ?.entries.filter((entry) => entry.types)
      .map((entry) => entry.id)
      .sort();
    expect(covered).toEqual([...KEYS].sort());
    for (const type of TYPES) {
      expect(glossaryCoversSetVariables(locale, type).sort()).toEqual([...setVariablesForType(type)].sort());
    }
  });

  it('explains a set as its own entry', () => {
    expect(glossaryEntry('es', 'set')?.term).toBe('Serie');
    expect(glossaryEntry('en', 'set')?.term).toBe('Set');
  });
});

describe('glossary progress metrics', () => {
  it.each(LOCALES)('explains the visible progress metrics in %s', (locale) => {
    const page = glossary(locale);
    const progress = page.groups.find((group) => group.id === 'progress');
    expect(progress?.entries.map((entry) => entry.id)).toEqual(PROGRESS);
    expect(page.intro.trim().length).toBeGreaterThan(0);
    for (const entry of page.groups.flatMap((group) => group.entries)) {
      expect(entry.term.trim()).not.toBe('');
      expect(entry.short.trim()).not.toBe('');
      expect(entry.body.trim()).not.toBe('');
    }
  });
});
