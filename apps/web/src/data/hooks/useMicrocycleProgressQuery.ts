import { useQuery } from '@tanstack/react-query';
import { createApiClient } from '../api-client';
import { useAuthStore } from '../../store/auth.store';

export type MicrocycleProgressPoint = {
  weekStart: string;
  totalTonnage: number;
  avgRpe: number | null;
  totalTrainingLoad: number | null;
  sessionsCount: number;
};

type QueryInput = {
  clientId?: string;
  templateId: string;
  from: string;
  to: string;
};

export function useMicrocycleProgressQuery(input: QueryInput, options?: { enabled?: boolean }) {
  const auth = useAuth();
  return useQuery({
    enabled: Boolean(auth) && Boolean(input.templateId) && (options?.enabled ?? true),
    queryFn: () => fetchMicrocycleProgress(auth, input),
    queryKey: ['progress', 'microcycle', input.clientId, input.templateId, input.from, input.to],
  });
}

function useAuth() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const activeRole = useAuthStore((state) => state.activeRole);
  if (!accessToken || !activeRole) return null;
  return { accessToken, activeRole };
}

async function fetchMicrocycleProgress(
  auth: ReturnType<typeof useAuth>,
  input: QueryInput,
): Promise<MicrocycleProgressPoint[]> {
  if (!auth) throw new Error('Missing auth');
  const query = new URLSearchParams({ templateId: input.templateId, from: input.from, to: input.to });
  if (input.clientId) query.set('clientId', input.clientId);
  return createApiClient(auth).get<MicrocycleProgressPoint[]>(`/progress/microcycle?${query}`);
}
