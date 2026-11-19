import { useQuery, useQueries, type UseQueryResult } from '@tanstack/react-query';
import { useAuthStore } from '../../store/auth.store';
import { createApiClient, UnauthorizedApiError } from '../api-client';
import { handleUnauthorized } from '../auth-service';
import { QUERY_CACHE_MS } from '../query-persistence';

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
    gcTime: QUERY_CACHE_MS,
    networkMode: 'offlineFirst',
    queryKey: ['clients', 'me', 'routine'],
    refetchOnMount: 'always',
    staleTime: 0,
  });
}

export function useClientPlanDayQuery(
  planDayId: string | null,
  on?: string | null,
): UseQueryResult<ClientRoutineDay, Error> {
  const accessToken = useAuthStore((state) => state.accessToken);
  return useQuery({
    enabled: Boolean(accessToken && planDayId),
    queryFn: async () => {
      try {
        const date = on ? `?on=${on}` : '';
        return await createApiClient({ accessToken: accessToken ?? '', activeRole: 'client' }).get<ClientRoutineDay>(
          `/clients/me/plan-days/${planDayId}${date}`,
        );
      } catch (error) {
        if (error instanceof UnauthorizedApiError) {
          void handleUnauthorized();
        }
        throw error;
      }
    },
    gcTime: QUERY_CACHE_MS,
    networkMode: 'offlineFirst',
    queryKey: ['clients', 'me', 'plan-days', planDayId, on ?? 'today'],
    refetchOnMount: 'always',
    staleTime: 0,
  });
}

export function usePlanDaysForDates(requests: Array<{ id: string; on: string }>): Map<string, ClientRoutineDay> {
  const accessToken = useAuthStore((state) => state.accessToken);
  const unique = uniquePlanDayDates(requests);
  const queries = useQueries({
    queries: unique.map((request) => ({
      enabled: Boolean(accessToken),
      gcTime: QUERY_CACHE_MS,
      networkMode: 'offlineFirst' as const,
      queryFn: () =>
        createApiClient({ accessToken: accessToken ?? '', activeRole: 'client' }).get<ClientRoutineDay>(
          `/clients/me/plan-days/${request.id}?on=${request.on}`,
        ),
      queryKey: ['clients', 'me', 'plan-days', request.id, request.on],
      refetchOnMount: 'always' as const,
      staleTime: 0,
    })),
  });
  const days = new Map<string, ClientRoutineDay>();
  unique.forEach((request, index) => {
    const day = queries[index]?.data;
    if (day) days.set(`${request.on}|${request.id}`, day);
  });
  return days;
}

function uniquePlanDayDates(requests: Array<{ id: string; on: string }>): Array<{ id: string; on: string }> {
  const seen = new Set<string>();
  return requests.filter((request) => {
    const key = `${request.on}|${request.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Calendar entries can retain a day from an older assigned revision. */
export function useScheduledPlanDays(ids: string[]): ClientRoutineDay[] {
  const accessToken = useAuthStore((state) => state.accessToken);
  return useQueries({
    queries: [...new Set(ids)].map((id) => ({
      enabled: Boolean(accessToken),
      gcTime: QUERY_CACHE_MS,
      networkMode: 'offlineFirst',
      queryKey: ['clients', 'me', 'plan-days', id],
      queryFn: () =>
        createApiClient({ accessToken: accessToken ?? '', activeRole: 'client' }).get<ClientRoutineDay>(
          `/clients/me/plan-days/${id}`,
        ),
    })),
  }).flatMap((query) => (query.data ? [query.data] : []));
}
