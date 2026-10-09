import { resolveNotificationTarget } from '../notification-routing';

describe('resolveNotificationTarget', () => {
  const coach = { role: 'coach' as const, userId: 'user-1' };
  const client = { role: 'client' as const, userId: 'user-1' };
  const base = { recipientUserId: 'user-1' };

  it('ignores a notice addressed to another account', () => {
    const data = { ...base, recipientUserId: 'other', sessionId: 's1', topic: 'SESSION_COMPLETED' };
    expect(resolveNotificationTarget(data, coach)).toBeNull();
  });

  it('opens the coach session, incident, or client chat', () => {
    expect(resolveNotificationTarget({ ...base, sessionId: 's1', topic: 'SESSION_COMPLETED' }, coach)).toEqual({
      kind: 'coach-session',
      sessionId: 's1',
    });
    expect(resolveNotificationTarget({ ...base, incidentId: 'i1', topic: 'INCIDENT_CRITICAL' }, coach)).toEqual({
      incidentId: 'i1',
      kind: 'coach-incident',
    });
    expect(resolveNotificationTarget({ ...base, clientId: 'c1', topic: 'CLIENT_INACTIVE_3D' }, coach)).toEqual({
      clientId: 'c1',
      kind: 'coach-chat',
    });
    expect(resolveNotificationTarget({ ...base, clientId: 'c1', topic: 'ADHERENCE_LOW_WEEKLY' }, coach)).toEqual({
      clientId: 'c1',
      kind: 'coach-chat',
    });
  });

  it('opens the client session and ignores incomplete data', () => {
    expect(resolveNotificationTarget({ ...base, sessionId: 's1', topic: 'CLIENT_REMINDER' }, client)).toEqual({
      kind: 'client-session',
      sessionId: 's1',
    });
    expect(resolveNotificationTarget({ ...base, topic: 'CLIENT_REMINDER' }, client)).toBeNull();
    expect(resolveNotificationTarget({ topic: 'SESSION_COMPLETED' }, coach)).toBeNull();
    expect(resolveNotificationTarget(undefined, coach)).toBeNull();
  });
});
