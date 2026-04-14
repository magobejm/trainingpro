import { useQuery } from '@tanstack/react-query';
import { createApiClient } from '../api-client';
import { useAuthStore } from '../../store/auth.store';

export type RecentSessionSummary = {
  sessionDate: string;
  sessionId: string;
  exerciseCount: number;
  totalTonnage: number;
  sessionInol: number | null;
  avgRpe: number | null;
  durationMinutes: number | null;
};

type QueryInput = {
  clientId?: string;
  exerciseId?: string;
  templateId?: string;
  from: string;
  to: string;
  limit?: number;
};

export function useRecentSessionsQuery(input: QueryInput, options?: { enabled?: boolean }) {
  const auth = useAuth();
  return useQuery({
    enabled: Boolean(auth) && (options?.enabled ?? true),
    queryFn: () => fetchRecentSessions(auth, input),
    queryKey: ['progress', 'sessions', input.clientId, input.exerciseId, input.templateId, input.from, input.to],
  });
}

function useAuth() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const activeRole = useAuthStore((state) => state.activeRole);
  if (!accessToken || !activeRole) return null;
  return { accessToken, activeRole };
}

async function fetchRecentSessions(auth: ReturnType<typeof useAuth>, input: QueryInput): Promise<RecentSessionSummary[]> {
  if (!auth) throw new Error('Missing auth');
  const query = new URLSearchParams({ from: input.from, to: input.to });
  if (input.clientId) query.set('clientId', input.clientId);
  if (input.exerciseId) query.set('exerciseId', input.exerciseId);
  if (input.templateId) query.set('templateId', input.templateId);
  if (input.limit !== undefined) query.set('limit', String(input.limit));
  return createApiClient(auth).get<RecentSessionSummary[]>(`/progress/sessions?${query}`);
}
