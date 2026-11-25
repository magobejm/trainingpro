import { useQuery } from '@tanstack/react-query';
import { createApiClient } from '../api-client';
import { useAuth } from './use-api-auth';
import type { SessionCompareItem } from '../../screens/coach/progress/session-compare.helpers';

export type CoachSessionDetail = {
  outcome?: import('@trainerpro/shared').SessionOutcome;
  isCompleted?: boolean;
  originDate?: string | null;
  skippedAt?: string | null;
  skipReason?: string | null;
  finishedAt: string | null;
  id: string;
  isIncomplete: boolean;
  items: SessionCompareItem[];
  sessionDate: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING';
};

export function useSessionDetailQuery(sessionId: string | null) {
  const auth = useAuth();
  return useQuery({
    enabled: Boolean(auth) && Boolean(sessionId),
    queryFn: () => fetchSessionDetail(auth, sessionId!),
    queryKey: ['sessions', sessionId, auth?.accessToken],
  });
}

async function fetchSessionDetail(auth: ReturnType<typeof useAuth>, sessionId: string): Promise<CoachSessionDetail> {
  if (!auth) throw new Error('Missing auth');
  return createApiClient(auth).get<CoachSessionDetail>(`/sessions/${sessionId}?includeOutcome=true`);
}
