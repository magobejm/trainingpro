import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createApiClient } from '../api-client';
import { useAuthStore } from '../../store/auth.store';

export type IncidentDetail = {
  coachResponse: null | string;
  description: string;
  id: string;
  severity: 'CRITICAL' | 'HIGH' | 'LOW' | 'MEDIUM';
  status: 'CLOSED' | 'OPEN' | 'REVIEWED';
};

export function useIncidentQuery(incidentId: string) {
  const auth = useAuth();
  return useQuery({
    enabled: Boolean(auth) && incidentId.length > 0,
    queryFn: () => readIncident(auth, incidentId),
    queryKey: incidentKey(incidentId),
  });
}

export function useReviewIncidentMutation(incidentId: string) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => postIncident(auth, incidentId, 'review'),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: incidentKey(incidentId) });
    },
  });
}

export function useRespondIncidentMutation(incidentId: string) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (response: string) => postIncident(auth, incidentId, 'respond', { response }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: incidentKey(incidentId) });
    },
  });
}

function incidentKey(incidentId: string) {
  return ['incident', incidentId] as const;
}

function useAuth() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const activeRole = useAuthStore((state) => state.activeRole);
  if (!accessToken || !activeRole) {
    return null;
  }
  return { accessToken, activeRole };
}

async function readIncident(auth: ReturnType<typeof useAuth>, incidentId: string): Promise<IncidentDetail> {
  if (!auth) {
    throw new Error('Missing authenticated context');
  }
  return createApiClient(auth).get<IncidentDetail>(`/incidents/${incidentId}`);
}

async function postIncident(
  auth: ReturnType<typeof useAuth>,
  incidentId: string,
  action: 'respond' | 'review',
  body?: { response: string },
): Promise<IncidentDetail> {
  if (!auth) {
    throw new Error('Missing authenticated context');
  }
  return createApiClient(auth).post<IncidentDetail>(`/incidents/${incidentId}/${action}`, body ?? {});
}
