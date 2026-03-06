import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { createApiClient } from '../api-client';
import { useAuthStore } from '../../store/auth.store';

export type ClientView = {
  allergies: null | string;
  avatarUrl: null | string;
  birthDate: null | string;
  coachMembershipId: string;
  considerations: null | string;
  createdAt: string;
  email: string;
  fcMax: null | number;
  fcRest: null | number;
  firstName: string;
  fitnessLevel: null | string;
  heightCm: null | number;
  hipCm: null | number;
  id: string;
  injuries: null | string;
  lastName: string;
  notes: null | string;
  objective: null | string;
  objectiveId: string;
  organizationId: string;
  phone: null | string;
  secondaryObjectives: string[];
  sex: null | string;
  updatedAt: string;
  waistCm: null | number;
  weightKg: null | number;
  trainingPlanId: string | null;
  trainingPlan?: { id: string; name: string };
  objectiveOptions?: ClientObjectiveView[];
  progressPhotos: ClientProgressPhotoView[];
};

export type ClientProgressPhotoView = {
  archived: boolean;
  clientId: string;
  createdAt: string;
  id: string;
  imagePath?: string;
  imageUrl: string;
  updatedAt: string;
};

type ListClientsResponse = {
  items: ClientView[];
};

export type ClientObjectiveView = {
  code: string;
  id: string;
  isDefault: boolean;
  label: string;
  sortOrder: number;
};

type ListClientObjectivesResponse = {
  items: ClientObjectiveView[];
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
  const response = await createApiClient(auth).get<ListClientsResponse>('/clients');
  return response.items;
}

async function fetchClientObjectives(
  auth: ReturnType<typeof useAuth>,
): Promise<ClientObjectiveView[]> {
  if (!auth) {
    throw new Error('Missing authenticated context');
  }
  const response = await createApiClient(auth).get<ListClientObjectivesResponse>(
    '/clients/catalog/objectives',
  );
  return response.items;
}
