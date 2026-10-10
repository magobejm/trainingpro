import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { ClientListResponse, ClientObjective, ClientView } from '@trainerpro/shared';
import { createApiClient } from '../api-client';
import { useAuthStore } from '../../store/auth.store';

const PRIVATE_MEDIA_REFRESH_MS = 30 * 60 * 1000;

export type { ClientView };
export type ClientObjectiveView = ClientObjective;

type ListClientObjectivesResponse = {
  items: ClientObjectiveView[];
};

export function useClientsQuery(): UseQueryResult<ClientView[], Error> {
  const auth = useAuth();
  return useQuery({
    enabled: Boolean(auth),
    queryFn: () => fetchClients(auth),
    queryKey: ['clients', 'list', auth?.activeRole, auth?.accessToken],
    refetchInterval: PRIVATE_MEDIA_REFRESH_MS,
  });
}

export function useClientByIdQuery(clientId: string): UseQueryResult<ClientView, Error> {
  const auth = useAuth();
  return useQuery({
    enabled: Boolean(auth) && clientId.length > 0,
    queryFn: () => fetchClientById(auth, clientId),
    queryKey: ['clients', 'detail', clientId, auth?.activeRole, auth?.accessToken],
    refetchInterval: PRIVATE_MEDIA_REFRESH_MS,
  });
}

export function useClientObjectivesQuery(): UseQueryResult<ClientObjectiveView[], Error> {
  const auth = useAuth();
  return useQuery({
    enabled: Boolean(auth),
    queryFn: () => fetchClientObjectives(auth),
    queryKey: ['clients', 'objectives', auth?.activeRole, auth?.accessToken],
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

async function fetchClientById(auth: ReturnType<typeof useAuth>, clientId: string) {
  if (!auth) {
    throw new Error('Missing authenticated context');
  }
  return createApiClient(auth).get<ClientView>(`/clients/${clientId}`);
}

async function fetchClients(auth: ReturnType<typeof useAuth>): Promise<ClientView[]> {
  if (!auth) {
    throw new Error('Missing authenticated context');
  }
  const response = await createApiClient(auth).get<ClientListResponse>('/clients');
  return response.items;
}

async function fetchClientObjectives(auth: ReturnType<typeof useAuth>): Promise<ClientObjectiveView[]> {
  if (!auth) {
    throw new Error('Missing authenticated context');
  }
  const response = await createApiClient(auth).get<ListClientObjectivesResponse>('/clients/catalog/objectives');
  return response.items.sort((a, b) => a.label.localeCompare(b.label, 'es'));
}
