import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { useAuthStore } from '../../store/auth.store';
import { createApiClient } from '../api-client';
import { QUERY_CACHE_MS } from '../query-persistence';

import { clientPlanDayBatchResponseSchema, type ClientRoutine, type ClientRoutineDay } from '@trainerpro/shared';
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
    queryFn: () =>
      createApiClient({ accessToken: accessToken ?? '', activeRole: 'client' }).get<ClientRoutine>('/clients/me/routine'),
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
    queryFn: () => {
      const date = on ? `?on=${on}` : '';
      return createApiClient({ accessToken: accessToken ?? '', activeRole: 'client' }).get<ClientRoutineDay>(
        `/clients/me/plan-days/${planDayId}${date}`,
      );
    },
    gcTime: QUERY_CACHE_MS,
    networkMode: 'offlineFirst',
    queryKey: ['clients', 'me', 'plan-days', planDayId, on ?? 'today'],
    refetchOnMount: 'always',
    staleTime: 0,
  });
}

type PlanDayRequest = { id: string; on: string };

const PLAN_DAY_BATCH_SIZE = 40;

export function usePlanDaysForDates(requests: PlanDayRequest[]): Map<string, ClientRoutineDay> {
  return new Map(usePlanDayBatch(requests));
}

/** La caché persistida no puede guardar un Map: un objeto vacío no es iterable y tumba el calendario. */
export function planDayMapFromCache(data: unknown): Map<string, ClientRoutineDay> {
  if (data instanceof Map) return data;
  if (!Array.isArray(data)) return new Map();
  const entries: Array<[string, ClientRoutineDay]> = [];
  for (const entry of data) {
    if (!Array.isArray(entry) || typeof entry[0] !== 'string' || !isPlanDay(entry[1])) continue;
    entries.push([entry[0], entry[1]]);
  }
  return new Map(entries);
}

function isPlanDay(value: unknown): value is ClientRoutineDay {
  if (typeof value !== 'object' || value === null) return false;
  return 'id' in value && 'exercises' in value && Array.isArray(value.exercises);
}

/** Calendar entries can retain a day from an older assigned revision. */
export function useScheduledPlanDays(ids: string[]): ClientRoutineDay[] {
  const on = localDateKey(new Date());
  const batch = usePlanDayBatch([...new Set(ids)].map((id) => ({ id, on })));
  return [...new Set(ids)].flatMap((id) => {
    const day = batch.get(`${on}|${id}`);
    return day ? [day] : [];
  });
}

/** Una sola consulta con todos los días (por tandas) en vez de una por día. */
function usePlanDayBatch(requests: PlanDayRequest[]): Map<string, ClientRoutineDay> {
  const accessToken = useAuthStore((state) => state.accessToken);
  const unique = uniquePlanDayDates(requests).sort((a, b) => `${a.on}|${a.id}`.localeCompare(`${b.on}|${b.id}`));
  const query = useQuery({
    enabled: Boolean(accessToken) && unique.length > 0,
    gcTime: QUERY_CACHE_MS,
    networkMode: 'offlineFirst',
    queryFn: () => fetchPlanDayBatch(accessToken ?? '', unique),
    queryKey: ['clients', 'me', 'plan-days', 'batch', unique.map((request) => `${request.id}@${request.on}`).join(',')],
    refetchOnMount: 'always',
    staleTime: 0,
  });
  return planDayMapFromCache(query.data);
}

async function fetchPlanDayBatch(
  accessToken: string,
  requests: PlanDayRequest[],
): Promise<Array<[string, ClientRoutineDay]>> {
  const api = createApiClient({ accessToken, activeRole: 'client' });
  const days = new Map<string, ClientRoutineDay>();
  for (let start = 0; start < requests.length; start += PLAN_DAY_BATCH_SIZE) {
    const items = requests
      .slice(start, start + PLAN_DAY_BATCH_SIZE)
      .map((request) => `${request.id}@${request.on}`)
      .join(',');
    const path = `/clients/me/plan-days?items=${encodeURIComponent(items)}`;
    const response = await api.getParsed(path, clientPlanDayBatchResponseSchema);
    for (const item of response.items) days.set(`${item.on}|${item.planDayId}`, item.day);
  }
  return [...days.entries()];
}

function localDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function uniquePlanDayDates(requests: PlanDayRequest[]): PlanDayRequest[] {
  const seen = new Set<string>();
  return requests.filter((request) => {
    const key = `${request.on}|${request.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
