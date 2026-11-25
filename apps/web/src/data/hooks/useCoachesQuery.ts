import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { createApiClient } from '../api-client';
import { useAuth } from './use-api-auth';

export type CoachView = {
  archivedAt: null | string;
  coachMembershipId: string;
  email: string;
  isActive: boolean;
  userId: string;
};

export function useCoachesQuery(): UseQueryResult<CoachView[], Error> {
  const auth = useAuth();
  return useQuery({
    enabled: Boolean(auth),
    queryFn: () => fetchCoaches(auth),
    queryKey: ['coaches', 'list', 'active', auth?.activeRole, auth?.accessToken],
  });
}

export function useArchivedCoachesQuery(): UseQueryResult<CoachView[], Error> {
  const auth = useAuth();
  return useQuery({
    enabled: Boolean(auth),
    queryFn: () => fetchArchivedCoaches(auth),
    queryKey: ['coaches', 'list', 'archived', auth?.activeRole, auth?.accessToken],
  });
}

async function fetchCoaches(auth: ReturnType<typeof useAuth>): Promise<CoachView[]> {
  if (!auth) {
    throw new Error('Missing authenticated context');
  }
  return createApiClient(auth).get<CoachView[]>('/coaches');
}

async function fetchArchivedCoaches(auth: ReturnType<typeof useAuth>): Promise<CoachView[]> {
  if (!auth) {
    throw new Error('Missing authenticated context');
  }
  return createApiClient(auth).get<CoachView[]>('/coaches', { archived: 'true' });
}
