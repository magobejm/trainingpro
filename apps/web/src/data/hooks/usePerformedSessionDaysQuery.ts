import { useQuery } from '@tanstack/react-query';
import { createApiClient } from '../api-client';
import { useAuthStore } from '../../store/auth.store';

export type PerformedSessionDay = { dayIndex: number; title: string };

type QueryInput = {
  clientId?: string;
  templateId: string;
  from: string;
  to: string;
};

function useAuth() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const activeRole = useAuthStore((state) => state.activeRole);
  if (!accessToken || !activeRole) return null;
  return { accessToken, activeRole };
}

export function usePerformedSessionDaysQuery(input: QueryInput, options?: { enabled?: boolean }) {
  const auth = useAuth();
  return useQuery({
    enabled: Boolean(auth) && Boolean(input.templateId) && (options?.enabled ?? true),
    queryKey: ['progress', 'session', 'days', input.clientId, input.templateId, input.from, input.to],
    queryFn: async () => {
      if (!auth) throw new Error('Missing auth');
      const q = new URLSearchParams({ templateId: input.templateId, from: input.from, to: input.to });
      if (input.clientId) q.set('clientId', input.clientId);
      const res = await createApiClient(auth).get<{ days: PerformedSessionDay[] }>(`/progress/session/days?${q}`);
      return res.days ?? [];
    },
  });
}
