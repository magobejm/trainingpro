import {
  initialWorkoutGuide,
  mergeWorkoutGuide,
  workoutGuidePatchSchema,
  workoutGuideResponse,
} from '../first-workout-guide';

describe('first workout guide', () => {
  it('offers only new clients and resumes an already started guide', () => {
    expect(workoutGuideResponse(null, false).eligibleForAutoStart).toBe(true);
    expect(workoutGuideResponse(null, true).eligibleForAutoStart).toBe(false);
    expect(workoutGuideResponse({ ...initialWorkoutGuide, status: 'in_progress' }, true).eligibleForAutoStart).toBe(true);
  });
  it('keeps the highest step across stale devices', () => {
    expect(
      mergeWorkoutGuide(
        { ...initialWorkoutGuide, status: 'in_progress', step: 'sync' },
        {
          version: 1,
          status: 'in_progress',
          step: 'record',
        },
      ).step,
    ).toBe('sync');
  });
  it.each(['completed', 'dismissed'] as const)('does not undo %s with pending offline progress', (status) => {
    const saved = { ...initialWorkoutGuide, status, step: 'help' as const };
    expect(mergeWorkoutGuide(saved, { version: 1, status: 'in_progress', step: 'record' })).toEqual(saved);
    expect(workoutGuideResponse(saved, false).eligibleForAutoStart).toBe(false);
  });
  it('rejects version changes, server fields and premature completion', () => {
    for (const input of [
      { version: 2, status: 'in_progress', step: 'record' },
      { version: 1, status: 'in_progress', step: 'record', eligibleForAutoStart: true },
      { version: 1, status: 'completed', step: 'save' },
    ])
      expect(workoutGuidePatchSchema.safeParse(input).success).toBe(false);
    expect(workoutGuidePatchSchema.safeParse({ version: 1, status: 'completed', step: 'help' }).success).toBe(true);
  });
});
