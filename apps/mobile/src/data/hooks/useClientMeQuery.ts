import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { createApiClient, UnauthorizedApiError } from '../api-client';
import { useAuthStore } from '../../store/auth.store';

// Signed private media URLs expire after an hour. Remount refetches immediately;
// this interval refreshes a screen that stays open.
const PRIVATE_MEDIA_REFRESH_MS = 30 * 60 * 1000;

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
  const clearSession = useAuthStore((state) => state.clearSession);
  return useQuery({
    enabled: Boolean(accessToken),
    queryFn: async () => {
      try {
        return await createApiClient({ accessToken: accessToken ?? '', activeRole: 'client' }).get<ClientMe>('/clients/me');
      } catch (error) {
        if (error instanceof UnauthorizedApiError) {
          clearSession();
        }
        throw error;
      }
    },
    queryKey: ['clients', 'me'],
    refetchInterval: PRIVATE_MEDIA_REFRESH_MS,
  });
}

export function resolveDisplayName(client: ClientMe | undefined): string {
  if (!client) {
    return '';
  }
  const parts = [client.firstName, client.lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : client.email;
}
