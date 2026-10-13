import { useQuery } from '@tanstack/react-query';
import type { ProgressRecordsResponse } from '@trainerpro/shared';
import { createApiClient } from '../api-client';
import { useAuthStore } from '../../store/auth.store';

export function useClientRecordsQuery(clientId: string, from: string, to: string) {
  const auth = useAuth();
  return useQuery({
    enabled: Boolean(auth) && clientId.length > 0 && from.length > 0,
    queryFn: () => fetchRecords(auth, clientId, from, to),
    queryKey: ['progress', 'records', clientId, from, to],
  });
}

export function recentRecordRange(days: number): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - (days - 1));
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

function useAuth() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const activeRole = useAuthStore((state) => state.activeRole);
  if (!accessToken || !activeRole) return null;
  return { accessToken, activeRole };
}

async function fetchRecords(
  auth: ReturnType<typeof useAuth>,
  clientId: string,
  from: string,
  to: string,
): Promise<ProgressRecordsResponse> {
  if (!auth) throw new Error('Not authenticated');
  const query = new URLSearchParams({ clientId, from, to });
  return createApiClient(auth).get<ProgressRecordsResponse>(`/progress/records?${query}`);
}
