import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import {
  clientListResponseSchema,
  clientMeasurementListSchema,
  clientViewSchema,
  type ClientObjective,
  type ClientView,
} from '@trainerpro/shared';
import { createApiClient } from '../api-client';
import { useAuth } from './use-api-auth';

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

export type ClientMeasurementView = {
  bodyFatPct?: number | null;
  createdAt: string;
  heightCm: number | null;
  hipCm: number | null;
  id: string;
  measuredAt?: string;
  fcMax?: number | null;
  fcRest?: number | null;
  recordedBy: 'client' | 'coach';
  skinfoldsJson?: Record<string, number> | null;
  waistCm: number | null;
  weightKg: number | null;
};

export function useClientMeasurementsQuery(clientId: string): UseQueryResult<ClientMeasurementView[], Error> {
  const auth = useAuth();
  return useQuery({
    enabled: Boolean(auth) && clientId.length > 0,
    queryFn: () => fetchMeasurements(auth, clientId),
    queryKey: ['clients', 'measurements', clientId, auth?.accessToken],
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

async function fetchMeasurements(auth: ReturnType<typeof useAuth>, clientId: string): Promise<ClientMeasurementView[]> {
  if (!auth) throw new Error('Missing authenticated context');
  const path = `/clients/${clientId}/measurements`;
  const response = await createApiClient(auth).getParsed(path, clientMeasurementListSchema);
  return response.items;
}

async function fetchClientObjectives(auth: ReturnType<typeof useAuth>): Promise<ClientObjectiveView[]> {
  if (!auth) {
    throw new Error('Missing authenticated context');
  }
  const response = await createApiClient(auth).get<ListClientObjectivesResponse>('/clients/catalog/objectives');
  return response.items.sort((a, b) => a.label.localeCompare(b.label, 'es'));
}
