import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createApiClient } from '../api-client';
import { useAuthStore } from '../../store/auth.store';

export type CreateIncidentInput = {
  description: string;
  sessionId?: null | string;
  sessionItemId?: null | string;
  severity: 'CRITICAL' | 'HIGH' | 'LOW' | 'MEDIUM';
};

export type IncidentListItem = {
  createdAt: string;
  description: string;
  id: string;
  sessionId: null | string;
  severity: 'CRITICAL' | 'HIGH' | 'LOW' | 'MEDIUM';
  status: 'CLOSED' | 'OPEN' | 'REVIEWED';
};

const INCIDENTS_KEY = ['incidents', 'my'] as const;

export function useIncidentsListQuery() {
  const auth = useAuth();
  return useQuery({
    enabled: Boolean(auth),
    queryFn: () => fetchIncidents(auth),
    queryKey: INCIDENTS_KEY,
  });
}

export function useCreateIncidentMutation() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateIncidentInput) => createIncident(auth, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: INCIDENTS_KEY });
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

async function fetchIncidents(auth: ReturnType<typeof useAuth>): Promise<IncidentListItem[]> {
  if (!auth) throw new Error('Missing authenticated context');
  return createApiClient(auth).get<IncidentListItem[]>('/incidents');
}

async function createIncident(auth: ReturnType<typeof useAuth>, input: CreateIncidentInput) {
  if (!auth) {
    throw new Error('Missing authenticated context');
  }
  return createApiClient(auth).post('/incidents', input);
}
