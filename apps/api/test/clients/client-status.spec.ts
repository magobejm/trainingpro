import { computeClientStatus, daysSinceActivity } from '../../src/modules/clients/domain/client-status';
import type { ClientStatusInput } from '../../src/modules/clients/domain/client-status';

const healthy: ClientStatusInput = {
  completedSessions: 3,
  daysSinceActivity: 1,
  hasAnySession: true,
  hasPlan: true,
  latestMood: 8,
  openIncidents: 0,
  plannedSessions: 3,
  severeOpenIncidents: 0,
};

describe('computeClientStatus', () => {
  it('returns none when the client has no plan and no sessions', () => {
    expect(
      computeClientStatus({
        ...healthy,
        completedSessions: 0,
        daysSinceActivity: null,
        hasAnySession: false,
        hasPlan: false,
        plannedSessions: 0,
      }),
    ).toEqual({ level: 'none', reasons: [] });
  });

  it('returns green when adherence, mood and activity are fine', () => {
    expect(computeClientStatus(healthy)).toEqual({ level: 'green', reasons: [] });
  });

  it('turns red for a severe incident, low adherence or a long gap', () => {
    expect(computeClientStatus({ ...healthy, openIncidents: 1, severeOpenIncidents: 1 }).level).toBe('red');
    expect(computeClientStatus({ ...healthy, completedSessions: 1, plannedSessions: 4 }).reasons).toContainEqual({
      adherencePercent: 25,
      code: 'adherence_low',
    });
    expect(computeClientStatus({ ...healthy, daysSinceActivity: 20 }).level).toBe('red');
    expect(computeClientStatus({ ...healthy, daysSinceActivity: null }).reasons).toContainEqual({ code: 'inactive' });
  });

  it('turns amber for moderate adherence, low mood, an open incident or a week away', () => {
    expect(computeClientStatus({ ...healthy, completedSessions: 3, plannedSessions: 4 }).level).toBe('amber');
    expect(computeClientStatus({ ...healthy, latestMood: 4 }).reasons).toContainEqual({ code: 'mood_low', mood: 4 });
    expect(computeClientStatus({ ...healthy, openIncidents: 1 }).level).toBe('amber');
    expect(computeClientStatus({ ...healthy, daysSinceActivity: 14 }).level).toBe('amber');
  });

  it('ignores adherence below two planned sessions and keeps the worst level', () => {
    expect(computeClientStatus({ ...healthy, completedSessions: 0, plannedSessions: 1 }).level).toBe('green');
    const status = computeClientStatus({
      ...healthy,
      daysSinceActivity: 10,
      latestMood: 2,
      openIncidents: 1,
      severeOpenIncidents: 1,
    });
    expect(status.level).toBe('red');
    expect(status.reasons.map((reason) => reason.code)).toEqual(['incident_severe', 'mood_low', 'inactive']);
  });
});

describe('daysSinceActivity', () => {
  it('counts whole UTC days and never goes negative', () => {
    expect(daysSinceActivity(new Date('2026-10-01T22:00:00.000Z'), new Date('2026-10-13T01:00:00.000Z'))).toBe(12);
    expect(daysSinceActivity(new Date('2026-10-14T00:00:00.000Z'), new Date('2026-10-13T00:00:00.000Z'))).toBe(0);
    expect(daysSinceActivity(null, new Date('2026-10-13T00:00:00.000Z'))).toBeNull();
  });
});
