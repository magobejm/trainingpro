import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createApiClient } from '../api-client';
import { useAuthStore } from '../../store/auth.store';

export type NotificationPreference = {
  coachMembershipId: string;
  enabled: boolean;
  topic:
    | 'ADHERENCE_LOW_WEEKLY'
    | 'CLIENT_INACTIVE_3D'
    | 'CLIENT_REMINDER'
    | 'INCIDENT_CRITICAL'
    | 'SESSION_COMPLETED';
};

export function useNotificationPreferencesQuery() {
  const auth = useAuth();
  return useQuery({
    enabled: Boolean(auth) && auth?.activeRole === 'coach',
    queryFn: () => createApiClient(auth!).get<NotificationPreference[]>('/notifications/preferences'),
    queryKey: ['notifications-preferences', auth?.activeRole],
  });
}

export function useSetNotificationPreferenceMutation() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { enabled: boolean; topic: NotificationPreference['topic'] }) => {
      if (!auth) {
        throw new Error('Missing authenticated context');
      }
      return createApiClient(auth).post('/notifications/preferences', input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['notifications-preferences', auth?.activeRole],
      });
    },
  });
}

function useAuth() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const activeRole = useAuthStore((state) => state.activeRole);
  if (!accessToken || !activeRole) {
    return null;
  }
  return { accessToken, activeRole };
}
