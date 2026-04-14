import { useQuery } from '@tanstack/react-query';
import { createApiClient } from '../api-client';
import { useAuthStore } from '../../store/auth.store';

export type SessionProgressPoint = {
  sessionDate: string;
  sessionId: string;
  sessionTonnage: number;
  sessionInol: number | null;
  sessionRpe: number | null;
  effortIndex: number | null;
  trainingLoad: number | null;
  sessionEfficiency: number | null;
};

type QueryInput = {
  clientId?: string;
  templateId: string;
  dayIndex?: number;
  from: string;
  to: string;
};

export function useSessionProgressQuery(input: QueryInput, options?: { enabled?: boolean }) {
  const auth = useAuth();
  return useQuery({
    enabled: Boolean(auth) && Boolean(input.templateId) && (options?.enabled ?? true),
    queryFn: () => fetchSessionProgress(auth, input),
    queryKey: ['progress', 'session', input.clientId, input.templateId, input.dayIndex, input.from, input.to],
  });
}

function useAuth() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const activeRole = useAuthStore((state) => state.activeRole);
  if (!accessToken || !activeRole) return null;
  return { accessToken, activeRole };
}

async function fetchSessionProgress(auth: ReturnType<typeof useAuth>, input: QueryInput): Promise<SessionProgressPoint[]> {
  if (!auth) throw new Error('Missing auth');
  const query = new URLSearchParams({ templateId: input.templateId, from: input.from, to: input.to });
  if (input.clientId) query.set('clientId', input.clientId);
  if (input.dayIndex !== undefined) query.set('dayIndex', String(input.dayIndex));
  return createApiClient(auth).get<SessionProgressPoint[]>(`/progress/session?${query}`);
}
