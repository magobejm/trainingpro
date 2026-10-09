export type NotificationTarget =
  | { clientId: string; kind: 'coach-chat' }
  | { incidentId: string; kind: 'coach-incident' }
  | { kind: 'coach-session'; sessionId: string }
  | { kind: 'client-session'; sessionId: string };

type NotificationAuth = {
  role: 'client' | 'coach' | null;
  userId: string | null;
};

export function resolveNotificationTarget(
  data: Record<string, unknown> | null | undefined,
  auth: NotificationAuth,
): NotificationTarget | null {
  if (!data || !auth.userId || !auth.role) {
    return null;
  }
  if (data.recipientUserId !== auth.userId) {
    return null;
  }
  return targetForRole(data, auth.role);
}

function targetForRole(data: Record<string, unknown>, role: 'client' | 'coach'): NotificationTarget | null {
  if (role === 'client') {
    return clientTarget(data);
  }
  return coachTarget(data);
}

function clientTarget(data: Record<string, unknown>): NotificationTarget | null {
  if (data.topic === 'CLIENT_REMINDER' && typeof data.sessionId === 'string' && data.sessionId.length > 0) {
    return { kind: 'client-session', sessionId: data.sessionId };
  }
  return null;
}

function coachTarget(data: Record<string, unknown>): NotificationTarget | null {
  if (data.topic === 'SESSION_COMPLETED' && isId(data.sessionId)) {
    return { kind: 'coach-session', sessionId: data.sessionId };
  }
  if (data.topic === 'INCIDENT_CRITICAL' && isId(data.incidentId)) {
    return { incidentId: data.incidentId, kind: 'coach-incident' };
  }
  if ((data.topic === 'CLIENT_INACTIVE_3D' || data.topic === 'ADHERENCE_LOW_WEEKLY') && isId(data.clientId)) {
    return { clientId: data.clientId, kind: 'coach-chat' };
  }
  return null;
}

function isId(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}
