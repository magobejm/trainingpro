import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { createApiClient } from '../api-client';
import { useAuthStore } from '../../store/auth.store';

export type CoachView = {
  archivedAt: null | string;
  coachMembershipId: string;
  email: string;
  isActive: boolean;
  userId: string;
};

export function useCoachesQuery(archived: boolean): UseQueryResult<CoachView[], Error> {
  const accessToken = useAuthStore((state) => state.accessToken);
  const activeRole = useAuthStore((state) => state.activeRole);
  return useQuery({
    enabled: Boolean(accessToken && activeRole),
    queryFn: () =>
      createApiClient({ accessToken: accessToken ?? '', activeRole: activeRole ?? 'admin' }).get<CoachView[]>(
        archived ? '/coaches?archived=true' : '/coaches',
      ),
    queryKey: ['coaches', 'list', archived ? 'archived' : 'active', activeRole, accessToken],
  });
}
