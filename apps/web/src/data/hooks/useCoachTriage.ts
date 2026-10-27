import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createApiClient } from '../api-client';
import { useAuthStore } from '../../store/auth.store';
import type { Triage } from '../../screens/coach/coach-triage.sections';

export function useCoachTriage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const activeRole = useAuthStore((state) => state.activeRole);
  const client = useQueryClient();
  const queryKey = ['coach', 'triage', accessToken];
  const api = () => createApiClient({ accessToken: accessToken ?? '', activeRole: activeRole ?? 'coach' });
  const query = useQuery({
    enabled: Boolean(accessToken && activeRole === 'coach'),
    queryFn: () => api().get<Triage>('/coach/triage'),
    queryKey,
    refetchInterval: 60_000,
  });
  const collapse = useMutation({
    mutationFn: (collapsed: string[]) => api().put<{ collapsed: string[] }>('/coach/triage/collapsed', { collapsed }),
    onMutate: (collapsed) => {
      client.setQueryData<Triage>(queryKey, (old) => (old ? { ...old, collapsed } : old));
    },
    onError: () => void client.invalidateQueries({ queryKey }),
  });
  return { collapse, query };
}
