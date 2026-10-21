import { allSessionPages } from './recent-session-pages';
import type { SessionOutcome } from '@trainerpro/shared';
import { useQuery } from '@tanstack/react-query';
import { createApiClient } from '../api-client';
import { useAuthStore } from '../../store/auth.store';

export type RecentSessionSummary = {
  outcome?: SessionOutcome;
  originDate?: string | null;
  skipReason?: string | null;
  hasRecordedData?: boolean;
  metricCoverage?: Record<string, { validSamples: number; eligibleSamples: number; unit: string; weightSeconds?: number }>;
  sessionDate: string;
  sessionId: string;
  exerciseCount: number;
  totalTonnage: number | null;
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
  all?: boolean;
  dayIndex?: number;
  category?: string;
};

export function useRecentSessionsQuery(input: QueryInput, options?: { enabled?: boolean }) {
  const auth = useAuth();
  return useQuery({
    enabled: Boolean(auth) && (options?.enabled ?? true),
    queryFn: () => fetchRecentSessions(auth, input),
    queryKey: [
      'progress',
      'sessions',
      input.clientId,
      input.exerciseId,
      input.templateId,
      input.from,
      input.to,
      input.limit,
      input.all,
      input.dayIndex,
      input.category,
    ],
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
  if (input.limit !== undefined || input.all) query.set('limit', String(input.limit ?? 200));
  if (input.dayIndex !== undefined) query.set('dayIndex', String(input.dayIndex));
  if (input.category) query.set('category', input.category);
  const fetchPage = ({ beforeDate, beforeId }: { beforeDate?: string; beforeId?: string }) => {
    const pageQuery = new URLSearchParams(query);
    if (beforeDate) pageQuery.set('beforeDate', beforeDate);
    if (beforeId) pageQuery.set('beforeId', beforeId);
    return createApiClient(auth).get<RecentSessionSummary[]>(`/progress/sessions?${pageQuery}`);
  };
  return input.all ? allSessionPages(fetchPage, input.limit ?? 200) : fetchPage({});
}
