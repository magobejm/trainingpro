import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createApiClient } from '../api-client';
import { useAuthStore } from '../../store/auth.store';
import { QUERY_CACHE_MS } from '../query-persistence';

export type NeatLog = { date: string; done: boolean; neatId: string; value: number | null };
type PendingNeat = { date: string; done: boolean; neatId: string };
const QUEUE_KEY = 'trainerpro.mobile.neat-queue';

export function useClientNeatLogs(date: string) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const query = useQuery({
    enabled: Boolean(auth),
    gcTime: QUERY_CACHE_MS,
    networkMode: 'offlineFirst',
    queryFn: () => fetchLogs(auth, date),
    queryKey: ['clients', 'me', 'neat-logs', date],
  });
  const save = useMutation({
    mutationFn: (input: PendingNeat) => saveLog(auth, input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ['clients', 'me', 'neat-logs', input.date] });
      const previous = queryClient.getQueryData<NeatLog[]>(['clients', 'me', 'neat-logs', input.date]);
      queryClient.setQueryData<NeatLog[]>(['clients', 'me', 'neat-logs', input.date], (current) =>
        mergeLog(current ?? [], input),
      );
      return { previous };
    },
    onError: (_error, input) => {
      rememberPending(input);
    },
  });
  useEffect(() => flushWhenOnline(auth), [auth]);
  return {
    logs: query.data ?? [],
    toggle: (neatId: string, done: boolean) => save.mutate({ date, done, neatId }),
  };
}

function useAuth() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const activeRole = useAuthStore((state) => state.activeRole);
  if (!accessToken || !activeRole) return null;
  return { accessToken, activeRole };
}

function fetchLogs(auth: ReturnType<typeof useAuth>, date: string): Promise<NeatLog[]> {
  if (!auth) throw new Error('Missing authenticated context');
  return createApiClient(auth)
    .get<{ logs: NeatLog[] }>(`/clients/me/neat-logs?date=${date}`)
    .then((body) => body.logs);
}

function saveLog(auth: ReturnType<typeof useAuth>, input: PendingNeat): Promise<NeatLog> {
  if (!auth) throw new Error('Missing authenticated context');
  return createApiClient(auth).put<NeatLog>(`/clients/me/neat-logs/${input.neatId}/${input.date}`, { done: input.done });
}

function mergeLog(logs: NeatLog[], input: PendingNeat): NeatLog[] {
  const next = logs.filter((log) => log.neatId !== input.neatId);
  next.push({ date: input.date, done: input.done, neatId: input.neatId, value: null });
  return next;
}

function rememberPending(input: PendingNeat): void {
  const storage = globalThis.localStorage;
  if (!storage) return;
  const current = readQueue().filter((item) => item.neatId !== input.neatId || item.date !== input.date);
  storage.setItem(QUEUE_KEY, JSON.stringify([...current, input]));
}

function readQueue(): PendingNeat[] {
  const raw = globalThis.localStorage?.getItem(QUEUE_KEY);
  if (!raw) return [];
  const parsed = JSON.parse(raw) as PendingNeat[];
  return Array.isArray(parsed) ? parsed : [];
}

function flushWhenOnline(auth: ReturnType<typeof useAuth>): () => void {
  const flush = () => {
    if (!auth) return;
    const pending = readQueue();
    if (pending.length === 0) return;
    void Promise.all(pending.map((input) => saveLog(auth, input))).then(() => {
      globalThis.localStorage?.removeItem(QUEUE_KEY);
    });
  };
  const browser = globalThis as {
    addEventListener?: (type: string, listener: () => void) => void;
    removeEventListener?: (type: string, listener: () => void) => void;
  };
  browser.addEventListener?.('online', flush);
  const subscription = AppState.addEventListener('change', (state) => {
    if (state === 'active') flush();
  });
  return () => {
    browser.removeEventListener?.('online', flush);
    subscription.remove();
  };
}
