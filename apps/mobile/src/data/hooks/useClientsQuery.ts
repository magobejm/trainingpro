import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { clientListResponseSchema, clientViewSchema, type ClientView } from '@trainerpro/shared';
import { createApiClient } from '../api-client';
import { useAuth } from './use-api-auth';

export type { ClientView };

export function useClientsQuery(): UseQueryResult<ClientView[], Error> {
  const auth = useAuth();
  return useQuery({
    enabled: Boolean(auth),
    queryFn: () => fetchClients(auth),
    queryKey: ['clients', 'list', auth?.activeRole, auth?.accessToken],
  });
}

export function useClientByIdQuery(clientId: string): UseQueryResult<ClientView, Error> {
  const auth = useAuth();
  return useQuery({
    enabled: Boolean(auth) && clientId.length > 0,
    queryFn: () => fetchClientById(auth, clientId),
    queryKey: ['clients', 'detail', clientId, auth?.activeRole, auth?.accessToken],
  });
}

async function fetchClientById(auth: ReturnType<typeof useAuth>, clientId: string) {
  if (!auth) {
    throw new Error('Missing authenticated context');
  }
  return createApiClient(auth).getParsed(`/clients/${clientId}`, clientViewSchema);
}

async function fetchClients(auth: ReturnType<typeof useAuth>): Promise<ClientView[]> {
  if (!auth) {
    throw new Error('Missing authenticated context');
  }
  const response = await createApiClient(auth).getParsed('/clients', clientListResponseSchema);
  return response.items;
}
