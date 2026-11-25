import { useInfiniteQuery } from '@tanstack/react-query';
import { clientTimelineResponseSchema, type ClientTimelineResponse } from '@trainerpro/shared';
import { createApiClient } from '../api-client';
import { useAuth } from './use-api-auth';

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
  return createApiClient(auth).getParsed(
    `/clients/${clientId}/timeline?includeOutcome=true&${params}`,
    clientTimelineResponseSchema,
  );
}
