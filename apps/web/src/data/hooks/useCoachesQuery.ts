import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { createApiClient } from '../api-client';
import { useAuthStore } from '../../store/auth.store';

export type CoachView = {
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
    queryKey: ['coaches', 'list', auth?.activeRole, auth?.accessToken],
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

async function fetchCoaches(auth: ReturnType<typeof useAuth>): Promise<CoachView[]> {
  if (!auth) {
    throw new Error('Missing authenticated context');
  }
  return createApiClient(auth).get<CoachView[]>('/coaches');
}
