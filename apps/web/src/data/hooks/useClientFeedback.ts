import { useQuery } from '@tanstack/react-query';
import type { FeedbackCategoryKey } from '@trainerpro/shared';
import { createApiClient } from '../api-client';
import { useAuthStore } from '../../store/auth.store';
import { decodeUserKey } from '../../theme/appearance.logic';

export type FeedbackIncident = {
  category: FeedbackCategoryKey;
  createdAt: string;
  description: string;
  id: string;
  severity: 'CRITICAL' | 'HIGH' | 'LOW' | 'MEDIUM';
  status: 'CLOSED' | 'OPEN' | 'REVIEWED';
  tag: null | string;
};

export type FeedbackNote = {
  category: FeedbackCategoryKey;
  createdAt: string;
  exerciseName: null | string;
  id: string;
  text: string;
};

/** Read-only: the coach looks at what the client wrote, nothing here changes a status. */
export function useClientFeedback(clientId: string, enabled: boolean) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const activeRole = useAuthStore((state) => state.activeRole);
  const auth = { accessToken, activeRole, userId: decodeUserKey(accessToken) };
  const client = () => createApiClient(auth as Parameters<typeof createApiClient>[0]);
  const on = enabled && Boolean(accessToken && activeRole);
  const incidents = useQuery({
    enabled: on,
    queryFn: () => client().get<FeedbackIncident[]>(`/incidents?clientId=${clientId}`),
    queryKey: ['client-feedback', 'incidents', auth.userId, clientId],
  });
  const notes = useQuery({
    enabled: on,
    queryFn: () => client().get<FeedbackNote[]>(`/client-notes?clientId=${clientId}`),
    queryKey: ['client-feedback', 'notes', auth.userId, clientId],
  });
  return {
    incidents: incidents.data ?? [],
    isError: incidents.isError || notes.isError,
    isLoading: incidents.isLoading || notes.isLoading,
    notes: notes.data ?? [],
  };
}
