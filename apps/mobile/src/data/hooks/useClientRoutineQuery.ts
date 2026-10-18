import { useQuery, useQueries, type UseQueryResult } from '@tanstack/react-query';
import { useAuthStore } from '../../store/auth.store';
import { createApiClient, UnauthorizedApiError } from '../api-client';
import { handleUnauthorized } from '../auth-service';

import type { ClientRoutine, ClientRoutineDay } from '@trainerpro/shared';
export type {
  ClientRoutine,
  ClientRoutineDay,
  ClientRoutineExercise,
  ClientRoutineSet,
  ClientRoutineNeat,
} from '@trainerpro/shared';

export function useClientRoutineQuery(): UseQueryResult<ClientRoutine, Error> {
  const accessToken = useAuthStore((state) => state.accessToken);
  return useQuery({
    enabled: Boolean(accessToken),
    queryFn: async () => {
      try {
        return await createApiClient({ accessToken: accessToken ?? '', activeRole: 'client' }).get<ClientRoutine>(
          '/clients/me/routine',
        );
      } catch (error) {
        if (error instanceof UnauthorizedApiError) {
          void handleUnauthorized();
        }
        throw error;
      }
    },
    queryKey: ['clients', 'me', 'routine', accessToken],
    refetchOnMount: 'always',
    staleTime: 0,
  });
}

export function useClientPlanDayQuery(planDayId: string | null): UseQueryResult<ClientRoutineDay, Error> {
  const accessToken = useAuthStore((state) => state.accessToken);
  return useQuery({
    enabled: Boolean(accessToken && planDayId),
    queryFn: async () => {
      try {
        return await createApiClient({ accessToken: accessToken ?? '', activeRole: 'client' }).get<ClientRoutineDay>(
          `/clients/me/plan-days/${planDayId}`,
        );
      } catch (error) {
        if (error instanceof UnauthorizedApiError) {
          void handleUnauthorized();
        }
        throw error;
      }
    },
    queryKey: ['clients', 'me', 'plan-days', planDayId, accessToken],
    refetchOnMount: 'always',
    staleTime: 0,
  });
}

/** Calendar entries can retain a day from an older assigned revision. */
export function useScheduledPlanDays(ids: string[]): ClientRoutineDay[] {
  const accessToken = useAuthStore((state) => state.accessToken);
  return useQueries({
    queries: [...new Set(ids)].map((id) => ({
      enabled: Boolean(accessToken),
      queryKey: ['clients', 'me', 'plan-days', id, accessToken],
      queryFn: () =>
        createApiClient({ accessToken: accessToken ?? '', activeRole: 'client' }).get<ClientRoutineDay>(
          `/clients/me/plan-days/${id}`,
        ),
    })),
  }).flatMap((query) => (query.data ? [query.data] : []));
}
