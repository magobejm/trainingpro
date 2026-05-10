import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createApiClient } from '../api-client';
import { useAuthStore } from '../../store/auth.store';

export type OrgOccupancy = {
  activeClientCount: number;
  clientLimit: number;
  organizationId: string;
};

export function useOrgSubscriptionOccupancyQuery() {
  const auth = useAuth();
  return useQuery({
    enabled: Boolean(auth),
    queryFn: () => {
      if (!auth) {
        throw new Error('Missing authenticated context');
      }
      return fetchOccupancy(auth);
    },
    queryKey: ['org', 'subscription', 'occupancy', auth?.activeRole, auth?.accessToken],
  });
}

export function useUpdateOrgClientLimitMutation() {
  const auth = useAuthStrict();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (clientLimit: number) =>
      createApiClient(auth).patch<OrgOccupancy>('/org/subscription/limit', { clientLimit }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['org', 'subscription'] });
    },
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

function useAuthStrict() {
  const auth = useAuth();
  if (!auth) {
    throw new Error('Missing authenticated context');
  }
  return auth;
}

async function fetchOccupancy(auth: NonNullable<ReturnType<typeof useAuth>>): Promise<OrgOccupancy> {
  return createApiClient(auth).get<OrgOccupancy>('/org/subscription/occupancy');
}
