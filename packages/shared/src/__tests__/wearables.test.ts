import { heartRateTarget, mapCardioToGarminWorkout } from '../integrations/garmin-workout';
import { activitiesOverlap, assertAiAllowedSource, mergeDailyMetrics } from '../integrations/health-sources';

describe('wearable integrations', () => {
  it('maps a cardio block to Garmin steps using heart-rate reserve', () => {
    const workout = mapCardioToGarminWorkout({
      blocks: [
        {
          displayName: 'Series',
          fcReservePct: 70,
          restSeconds: 60,
          roundsPlanned: 2,
          workSeconds: 180,
        },
      ],
      fcMax: 190,
      fcRest: 60,
      name: 'Rodaje',
    });
    expect(workout.steps).toHaveLength(4);
    expect(workout.steps[0]).toMatchObject({ durationSeconds: 180, targetHeartRate: 151, type: 'interval' });
    expect(workout.steps[1]?.type).toBe('rest');
  });

  it('prefers a direct heart-rate target', () => {
    expect(
      heartRateTarget({ displayName: 'A', heartRate: 150, restSeconds: 0, roundsPlanned: 1, workSeconds: 30 }, 190, 60),
    ).toBe(150);
  });

  it('keeps Garmin ahead of Health Connect and hides Strava from the coach merge', () => {
    const merged = mergeDailyMetrics([
      { sleepMinutes: 300, source: 'HEALTH_CONNECT', steps: 4000 },
      { sleepMinutes: 420, source: 'GARMIN', steps: null },
      { source: 'STRAVA', steps: 99999 },
    ]);
    expect(merged.sleepMinutes).toBe(420);
    expect(merged.steps).toBe(4000);
    expect(merged.sources).not.toContain('STRAVA');
  });

  it('rejects Strava as an AI source and matches activities two minutes apart', () => {
    expect(() => assertAiAllowedSource('STRAVA')).toThrow(/Strava/);
    expect(activitiesOverlap({ startAt: '2026-10-25T10:00:00.000Z' }, { startAt: '2026-10-25T10:01:30.000Z' })).toBe(true);
    expect(activitiesOverlap({ startAt: '2026-10-25T10:00:00.000Z' }, { startAt: '2026-10-25T10:05:00.000Z' })).toBe(false);
  });
});
