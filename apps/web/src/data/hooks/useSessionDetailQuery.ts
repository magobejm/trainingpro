import { useQuery } from '@tanstack/react-query';
import { createApiClient } from '../api-client';
import { useAuthStore } from '../../store/auth.store';
import type { SessionCompareItem } from '../../screens/coach/progress/session-compare.helpers';

export type CoachSessionDetail = {
  id: string;
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

function useAuth() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const activeRole = useAuthStore((state) => state.activeRole);
  if (!accessToken || !activeRole) return null;
  return { accessToken, activeRole };
}

async function fetchSessionDetail(auth: ReturnType<typeof useAuth>, sessionId: string): Promise<CoachSessionDetail> {
  if (!auth) throw new Error('Missing auth');
  return createApiClient(auth).get<CoachSessionDetail>(`/sessions/${sessionId}`);
}
