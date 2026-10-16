import {
  backCoachRoute,
  backCoachRouteIfCurrent,
  coachNotificationRoute,
  initialCoachNavigation,
  openCoachRoute,
  selectCoachTab,
} from '../coach-navigation';
describe('coach navigation', () => {
  it('does not let a late archive response close a different or reopened route', () => {
    const route = { kind: 'client' as const, clientId: 'a' };
    const first = openCoachRoute(initialCoachNavigation(), route);
    const second = openCoachRoute(backCoachRoute(first), { kind: 'client', clientId: 'b' });
    expect(backCoachRouteIfCurrent(second, route)).toBe(second);
    expect(backCoachRouteIfCurrent(first, route).stack).toEqual([]);
    const reopened = openCoachRoute(backCoachRoute(first), { ...route });
    expect(backCoachRouteIfCurrent(reopened, route)).toBe(reopened);
  });
  it('starts at home and restores the origin when returning from a client detail', () => {
    let s = initialCoachNavigation();
    s = selectCoachTab(s, 'clients');
    s = openCoachRoute(s, { kind: 'client', clientId: 'a' });
    s = openCoachRoute(s, { kind: 'feature', feature: 'notes', clientId: 'a' });
    expect(backCoachRoute(s).stack).toEqual([{ kind: 'client', clientId: 'a' }]);
    expect(backCoachRoute(backCoachRoute(s))).toEqual({ tab: 'clients', stack: [] });
  });
  it('switching tabs clears another client context', () => {
    const s = openCoachRoute(initialCoachNavigation(), { kind: 'chat', clientId: 'a' });
    expect(selectCoachTab(s, 'chat')).toEqual({ tab: 'chat', stack: [] });
  });
  it('only maps coach notification targets', () => {
    expect(coachNotificationRoute({ kind: 'coach-chat', clientId: 'a' })).toEqual({ kind: 'chat', clientId: 'a' });
    expect(coachNotificationRoute({ kind: 'client-session', sessionId: 's' })).toBeNull();
  });
});
