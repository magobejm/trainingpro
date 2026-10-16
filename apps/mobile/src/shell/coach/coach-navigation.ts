import type { NotificationTarget } from '../../data/notification-routing';
export type CoachTab = 'home' | 'clients' | 'calendar' | 'chat' | 'more';
export type CoachRoute =
  | { kind: 'client'; clientId: string }
  | { kind: 'chat'; clientId: string }
  | { kind: 'feature'; feature: string; clientId?: string }
  | { kind: 'session'; sessionId: string }
  | { kind: 'incident'; incidentId: string }
  | { kind: 'client-create' };
export type CoachNavigation = { tab: CoachTab; stack: CoachRoute[] };
export const initialCoachNavigation = (): CoachNavigation => ({ tab: 'home', stack: [] });
export const selectCoachTab = (state: CoachNavigation, tab: CoachTab): CoachNavigation => ({ ...state, tab, stack: [] });
export const openCoachRoute = (state: CoachNavigation, route: CoachRoute): CoachNavigation => ({
  ...state,
  stack: [...state.stack, route],
});
export const backCoachRoute = (state: CoachNavigation): CoachNavigation => ({ ...state, stack: state.stack.slice(0, -1) });
export function backCoachRouteIfCurrent(state: CoachNavigation, route: CoachRoute): CoachNavigation {
  return state.stack[state.stack.length - 1] === route ? backCoachRoute(state) : state;
}
export function coachNotificationRoute(target: NotificationTarget | null): CoachRoute | null {
  if (target?.kind === 'coach-chat') return { kind: 'chat', clientId: target.clientId };
  if (target?.kind === 'coach-session') return { kind: 'session', sessionId: target.sessionId };
  if (target?.kind === 'coach-incident') return { kind: 'incident', incidentId: target.incidentId };
  return null;
}
