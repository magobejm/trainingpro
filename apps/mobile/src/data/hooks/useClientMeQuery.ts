import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { createApiClient } from '../api-client';
import { useAuthStore } from '../../store/auth.store';

export type ClientProgressPhoto = {
  archived: boolean;
  clientId: string;
  createdAt: string;
  id: string;
  imageUrl: string;
  updatedAt: string;
};

export type ClientMe = {
  allergies: null | string;
  avatarUrl: null | string;
  birthDate: null | string;
  considerations: null | string;
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
  objective: string;
  objectiveId: string;
  phone: null | string;
  progressPhotos: ClientProgressPhoto[];
  secondaryObjectives: string[];
  sex: null | string;
  trainingPlan?: { id: string; name: string };
  trainingPlanId: null | string;
  waistCm: null | number;
  weightKg: null | number;
};

export function useClientMeQuery(): UseQueryResult<ClientMe, Error> {
  const accessToken = useAuthStore((state) => state.accessToken);
  return useQuery({
    enabled: Boolean(accessToken),
    queryFn: () => createApiClient({ accessToken: accessToken ?? '', activeRole: 'client' }).get<ClientMe>('/clients/me'),
    queryKey: ['clients', 'me'],
  });
}

export function resolveDisplayName(client: ClientMe | undefined): string {
  if (!client) {
    return '';
  }
  const parts = [client.firstName, client.lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : client.email;
}
