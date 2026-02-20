import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createApiClient } from '../api-client';
import { useAuthStore } from '../../store/auth.store';

export type IncidentView = {
  adjustmentDraft: null | string;
  clientId: string;
  coachAlertedAt: null | string;
  coachResponse: null | string;
  createdAt: string;
  description: string;
  id: string;
  reviewedAt: null | string;
  severity: 'CRITICAL' | 'HIGH' | 'LOW' | 'MEDIUM';
  status: 'CLOSED' | 'OPEN' | 'REVIEWED';
  tag: null | string;
};

type ListQuery = {
  clientId?: string;
  status?: 'CLOSED' | 'OPEN' | 'REVIEWED';
};

export function useIncidentsQuery(query?: ListQuery) {
  const auth = useAuth();
  return useQuery({
    enabled: Boolean(auth),
    queryFn: () => readIncidents(auth, query),
    queryKey: ['incidents', auth?.activeRole, query?.clientId, query?.status],
  });
}

export function useReviewIncidentMutation() {
  return useSimpleIncidentMutation((auth, id) =>
    createApiClient(auth).post(`/incidents/${id}/review`, {}),
  );
}

export function useRespondIncidentMutation() {
  return useSimpleIncidentMutation((auth, id, payload) =>
    createApiClient(auth).post(`/incidents/${id}/respond`, payload),
  );
}

export function useTagIncidentMutation() {
  return useSimpleIncidentMutation((auth, id, payload) =>
    createApiClient(auth).post(`/incidents/${id}/tag`, payload),
  );
}

export function useAdjustmentDraftMutation() {
  return useSimpleIncidentMutation((auth, id, payload) =>
    createApiClient(auth).post(`/incidents/${id}/adjustment-draft`, payload),
  );
}

function useSimpleIncidentMutation(
  executor: (
    auth: NonNullable<ReturnType<typeof useAuth>>,
    id: string,
    payload?: unknown,
  ) => Promise<unknown>,
) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; payload?: unknown }) => runMutation(auth, executor, args),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['incidents'] });
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

async function readIncidents(
  auth: ReturnType<typeof useAuth>,
  query?: ListQuery,
): Promise<IncidentView[]> {
  if (!auth) {
    throw new Error('Missing authenticated context');
  }
  const params = new URLSearchParams();
  if (query?.clientId) {
    params.set('clientId', query.clientId);
  }
  if (query?.status) {
    params.set('status', query.status);
  }
  const suffix = params.toString();
  const path = suffix ? `/incidents?${suffix}` : '/incidents';
  return createApiClient(auth).get<IncidentView[]>(path);
}

async function runMutation(
  auth: ReturnType<typeof useAuth>,
  executor: (
    auth: NonNullable<ReturnType<typeof useAuth>>,
    id: string,
    payload?: unknown,
  ) => Promise<unknown>,
  args: { id: string; payload?: unknown },
) {
  if (!auth) {
    throw new Error('Missing authenticated context');
  }
  return executor(auth, args.id, args.payload);
}
