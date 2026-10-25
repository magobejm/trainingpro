import { useQuery } from '@tanstack/react-query';
import { createApiClient } from '../api-client';
import { useAuthStore } from '../../store/auth.store';
export type AdherenceResult = {
  from: string;
  to: string;
  cutoffDate: string;
  percent: number | null;
  plannedCount: number;
  counts: Record<'done' | 'incomplete' | 'skipped' | 'pending' | 'in_progress', number>;
  unplannedSessionsCount: number;
  neat?: { done: number; expected: number; percent: number | null };
};
export function useAdherenceQuery(input: { clientId: string; from: string; to: string; templateId?: string | null }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const activeRole = useAuthStore((s) => s.activeRole);
  const offset = -new Date().getTimezoneOffset();
  return useQuery({
    queryKey: ['progress', 'adherence', input.clientId, input.from, input.to, input.templateId, offset],
    enabled: Boolean(accessToken && activeRole && input.clientId),
    queryFn: () => {
      const params = new URLSearchParams({ clientId: input.clientId, from: input.from, to: input.to });
      if (input.templateId) params.set('templateId', input.templateId);
      return createApiClient({ accessToken: accessToken!, activeRole: activeRole! }).get<AdherenceResult>(
        '/progress/adherence?' + params,
        undefined,
        { 'x-timezone-offset': String(offset) },
      );
    },
  });
}
