import { useQuery } from '@tanstack/react-query';
import { createApiClient } from '../api-client';
import { useAuthStore } from '../../store/auth.store';

export type PerformedTemplateItem = {
  id: string;
  name: string;
};

export type PerformedTemplatesResult = {
  templates: PerformedTemplateItem[];
};

type QueryInput = {
  clientId?: string;
  from: string;
  to: string;
};

export function usePerformedTemplatesQuery(input: QueryInput, options?: { enabled?: boolean }) {
  const auth = useAuth();
  return useQuery({
    enabled: Boolean(auth) && (options?.enabled ?? true),
    queryFn: () => fetchPerformedTemplates(auth, input),
    queryKey: ['progress', 'performed-templates', input.clientId, input.from, input.to],
  });
}

function useAuth() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const activeRole = useAuthStore((state) => state.activeRole);
  if (!accessToken || !activeRole) return null;
  return { accessToken, activeRole };
}

async function fetchPerformedTemplates(
  auth: ReturnType<typeof useAuth>,
  input: QueryInput,
): Promise<PerformedTemplatesResult> {
  if (!auth) throw new Error('Missing auth');
  const query = new URLSearchParams({ from: input.from, to: input.to });
  if (input.clientId) query.set('clientId', input.clientId);
  return createApiClient(auth).get<PerformedTemplatesResult>(`/progress/performed-templates?${query}`);
}
