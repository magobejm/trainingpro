import { expect, it } from 'vitest';
import { resolveDisplaySets } from './warmup-exercise-list.helpers';

it('preserves canonical seconds from legacy cardio and sport warmups', () => {
  expect(resolveDisplaySets({ blockType: 'sport', displayName: 'Tenis', sortOrder: 0, durationMinutes: 30 })).toMatchObject([
    { durationSeconds: 1800 },
  ]);
  expect(resolveDisplaySets({ blockType: 'cardio', displayName: 'Bici', sortOrder: 0, workSeconds: 91 })).toMatchObject([
    { durationSeconds: 91 },
  ]);
});
