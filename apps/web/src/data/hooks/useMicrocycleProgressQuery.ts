import { useQuery } from '@tanstack/react-query';
import { createApiClient } from '../api-client';
import { useAuthStore } from '../../store/auth.store';
import type { SessionProgressCategory } from '../types/session-progress';

export type MicrocycleProgressPoint = {
  weekStart: string;
  totalTonnage: number;
  avgRpe: number | null;
  totalTrainingLoad: number | null;
  sessionsCount: number;
};

export type MicrocycleProgressResult = {
  cycleDays: number;
  points: MicrocycleProgressPoint[];
};

type QueryInput = {
  clientId?: string;
  templateId?: string;
  category?: SessionProgressCategory;
  from: string;
  to: string;
};

export function useMicrocycleProgressQuery(input: QueryInput, options?: { enabled?: boolean }) {
  const auth = useAuth();
  return useQuery({
    enabled: Boolean(auth) && (options?.enabled ?? true),
    queryFn: () => fetchMicrocycleProgress(auth, input),
    queryKey: ['progress', 'microcycle', input.clientId, input.templateId ?? '', input.category ?? '', input.from, input.to],
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
): Promise<MicrocycleProgressResult> {
  if (!auth) throw new Error('Missing auth');
  const query = new URLSearchParams({ from: input.from, to: input.to });
  if (input.clientId) query.set('clientId', input.clientId);
  if (input.templateId) query.set('templateId', input.templateId);
  if (input.category) query.set('category', input.category);
  return createApiClient(auth).get<MicrocycleProgressResult>(`/progress/microcycle?${query}`);
}
