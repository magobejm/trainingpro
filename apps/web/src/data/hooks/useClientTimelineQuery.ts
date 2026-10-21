import { useInfiniteQuery } from '@tanstack/react-query';
import type { ClientTimelineResponse } from '@trainerpro/shared';
import { createApiClient } from '../api-client';
import { useAuthStore } from '../../store/auth.store';

type Cursor = { before: string; beforeId: string } | null;

export function useClientTimelineQuery(clientId: string) {
  const auth = useAuth();
  return useInfiniteQuery({
    enabled: Boolean(auth) && clientId.length > 0,
    getNextPageParam: (last: ClientTimelineResponse) =>
      last.nextBefore && last.nextBeforeId ? { before: last.nextBefore, beforeId: last.nextBeforeId } : undefined,
    initialPageParam: null as Cursor,
    queryFn: ({ pageParam }) => fetchTimeline(auth, clientId, pageParam),
    queryKey: ['clients', 'timeline', clientId],
  });
}

function useAuth() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const activeRole = useAuthStore((state) => state.activeRole);
  if (!accessToken || !activeRole) return null;
  return { accessToken, activeRole };
}

async function fetchTimeline(
  auth: ReturnType<typeof useAuth>,
  clientId: string,
  cursor: Cursor,
): Promise<ClientTimelineResponse> {
  if (!auth) throw new Error('Not authenticated');
  const params = new URLSearchParams({ limit: '30' });
  if (cursor) {
    params.set('before', cursor.before);
    params.set('beforeId', cursor.beforeId);
  }
  return createApiClient(auth).get<ClientTimelineResponse>(`/clients/${clientId}/timeline?includeOutcome=true&${params}`);
}
