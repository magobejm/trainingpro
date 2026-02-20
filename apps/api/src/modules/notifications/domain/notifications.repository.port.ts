import type { AuthContext } from '../../../common/auth-context/auth-context';

export const NOTIFICATIONS_REPOSITORY = Symbol('NOTIFICATIONS_REPOSITORY');

export type NotificationTopic =
  | 'ADHERENCE_LOW_WEEKLY'
  | 'CLIENT_INACTIVE_3D'
  | 'CLIENT_REMINDER'
  | 'INCIDENT_CRITICAL'
  | 'SESSION_COMPLETED';

export type NotificationPreferenceView = {
  coachMembershipId: string;
  enabled: boolean;
  topic: NotificationTopic;
};

export type RegisterDeviceTokenInput = {
  platform: string;
  token: string;
};

export type NotificationEventInput = {
  clientId?: string;
  coachMembershipId?: string;
  dedupeKey?: string;
  organizationId: string;
  payloadJson?: Record<string, unknown>;
  topic: NotificationTopic;
};

export interface NotificationsRepositoryPort {
  emitIncidentCriticalEvent(incidentId: string): Promise<void>;
  emitSessionCompletedEvent(sessionId: string): Promise<void>;
  listPreferencesForCoach(context: AuthContext): Promise<NotificationPreferenceView[]>;
  registerDeviceToken(
    context: AuthContext,
    input: RegisterDeviceTokenInput,
  ): Promise<void>;
  runBatchJobs(now: Date): Promise<{ createdEvents: number }>;
  setPreferenceForCoach(
    context: AuthContext,
    topic: NotificationTopic,
    enabled: boolean,
  ): Promise<NotificationPreferenceView>;
}
