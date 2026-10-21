import { allSessionPages } from './recent-session-pages';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@trainerpro/ui';
import { useAuthStore } from '../../store/auth.store';
import { createApiClient } from '../api-client';

export type CoachWrite = { path: string; method?: 'POST' | 'PATCH' | 'DELETE' | 'PUT'; body?: unknown };
export function useCoachAuth() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const activeRole = useAuthStore((s) => s.activeRole);
  const userId = useAuthStore((s) => s.userId);
  return { accessToken: accessToken ?? undefined, activeRole: activeRole ?? 'coach', userId };
}

export function useCoachQuery<T>(path: string | null, options?: { allSessions?: boolean }) {
  const offset = -new Date().getTimezoneOffset();
  const auth = useCoachAuth();
  return useQuery<T>({
    queryKey: [
      'coach',
      auth.userId,
      auth.activeRole,
      path,
      options?.allSessions,
      path?.startsWith('/progress/adherence?') ? offset : null,
    ],
    enabled: Boolean(path && auth.accessToken && auth.activeRole === 'coach'),
    queryFn: async () => {
      const api = createApiClient(auth);
      if (options?.allSessions) {
        const rows = await allSessionPages<{ sessionDate: string; sessionId: string }>((cursor) => {
          const params = new URLSearchParams(cursor as Record<string, string>);
          return api.get(`${path}&${params}`);
        });
        return rows as T;
      }
      return api.get<T>(
        path!,
        path?.startsWith('/progress/adherence?') ? { 'x-timezone-offset': String(offset) } : undefined,
      );
    },
  });
}

export function useCoachWrite<T = unknown>() {
  const auth = useCoachAuth();
  const client = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  const running = useRef(false);
  return useMutation<T, Error, CoachWrite>({
    networkMode: 'always',
    retry: false,
    mutationFn: async ({ path, method = 'POST', body }) => {
      const current = useAuthStore.getState();
      if (
        current.userId !== auth.userId ||
        current.activeRole !== auth.activeRole ||
        current.accessToken !== auth.accessToken
      )
        throw new Error(t('coachWorkspace.sessionRequired'));
      if (!auth.accessToken || auth.activeRole !== 'coach') throw new Error(t('coachWorkspace.sessionRequired'));
      const browser = globalThis as { navigator?: { onLine?: boolean } };
      if (browser.navigator?.onLine === false) throw new Error(t('coachWorkspace.offlineWrite'));
      if (running.current) throw new Error(t('coachWorkspace.saving'));
      running.current = true;
      const api = createApiClient(auth);
      try {
        if (method === 'DELETE') return await api.delete<T>(path, body);
        if (method === 'PATCH') return await api.patch<T>(path, body);
        if (method === 'PUT') return await api.put<T>(path, body);
        return await api.post<T>(path, body);
      } finally {
        running.current = false;
      }
    },
    onSuccess: () => {
      toast.success(t('coachWorkspace.saved'));
      // The server can update sessions, calls and assigned plans in a single operation.
      void client.invalidateQueries({
        predicate: (q) => ['coach', 'clients', 'chat-messages', 'calendar', 'nutrition'].includes(String(q.queryKey[0])),
      });
    },
    onError: (error) => toast.error(error.message || t('coachWorkspace.saveError')),
  });
}
