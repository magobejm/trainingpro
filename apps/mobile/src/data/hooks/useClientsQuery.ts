import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { createApiClient } from '../api-client';
import { useAuthStore } from '../../store/auth.store';

export type ClientView = {
  birthDate: null | string;
  coachMembershipId: string;
  createdAt: string;
  email: string;
  firstName: string;
  heightCm: null | number;
  id: string;
  lastName: string;
  notes: null | string;
  objective: null | string;
  organizationId: string;
  phone: null | string;
  sex: null | string;
  updatedAt: string;
};

type ListClientsResponse = {
  items: ClientView[];
};

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
  const response = await createApiClient(auth).get<ListClientsResponse>('/clients');
  return response.items;
}
