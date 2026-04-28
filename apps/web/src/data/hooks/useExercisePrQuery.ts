import { useQuery } from '@tanstack/react-query';
import { createApiClient } from '../api-client';
import { useAuthStore } from '../../store/auth.store';

type QueryInput = {
  clientId?: string;
  exerciseId: string;
};

export function useExercisePrQuery(input: QueryInput, options?: { enabled?: boolean }) {
  const auth = useAuth();
  return useQuery({
    enabled: Boolean(auth) && Boolean(input.exerciseId) && (options?.enabled ?? true),
    queryFn: () => fetchExercisePr(auth, input),
    queryKey: ['progress', 'exercise-pr', input.clientId, input.exerciseId],
  });
}

function useAuth() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const activeRole = useAuthStore((state) => state.activeRole);
  if (!accessToken || !activeRole) return null;
  return { accessToken, activeRole };
}

async function fetchExercisePr(auth: ReturnType<typeof useAuth>, input: QueryInput): Promise<number | null> {
  if (!auth) throw new Error('Missing auth');
  const query = new URLSearchParams({ exerciseId: input.exerciseId });
  if (input.clientId) query.set('clientId', input.clientId);
  return createApiClient(auth).get<number | null>(`/progress/exercise-pr?${query}`);
}
