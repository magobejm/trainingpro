import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { createApiClient } from '../../data/api-client';
import { useAuthStore } from '../../store/auth.store';
import type { WearableMetric } from './wearable-day';

export type ClientWearables = {
  activities: Array<{ durationS: number; id: string; source: string; sportType: string }>;
  connections: Array<{ provider: string; status: string }>;
  metrics: WearableMetric[];
};

export function useClientWearables(clientId: string): UseQueryResult<ClientWearables, Error> {
  const accessToken = useAuthStore((state) => state.accessToken);
  const activeRole = useAuthStore((state) => state.activeRole);
  return useQuery({
    enabled: Boolean(clientId && accessToken),
    queryFn: () =>
      createApiClient({ accessToken: accessToken ?? '', activeRole: activeRole ?? 'coach' }).get<ClientWearables>(
        `/clients/${clientId}/wearables`,
      ),
    queryKey: ['coach', 'wearables', clientId],
  });
}
