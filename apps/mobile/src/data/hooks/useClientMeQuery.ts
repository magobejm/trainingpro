import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { useAuthStore } from '../../store/auth.store';
import { createApiClient } from '../api-client';

// Signed private media URLs expire after an hour. Remount refetches immediately;
// this interval refreshes a screen that stays open.
const PRIVATE_MEDIA_REFRESH_MS = 30 * 60 * 1000;

export type ProgressPose = 'back' | 'front' | 'side';

export type ClientProgressPhoto = {
  archived: boolean;
  clientId: string;
  createdAt: string;
  id: string;
  imageUrl: string;
  pose?: ProgressPose | null;
  updatedAt: string;
  uploadedBy?: 'client' | 'coach';
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
    queryKey: ['clients', 'me', accessToken],
    refetchInterval: PRIVATE_MEDIA_REFRESH_MS,
    refetchIntervalInBackground: false,
  });
}

export function resolveDisplayName(client: ClientMe | undefined): string {
  if (!client) {
    return '';
  }
  const parts = [client.firstName, client.lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : client.email;
}
