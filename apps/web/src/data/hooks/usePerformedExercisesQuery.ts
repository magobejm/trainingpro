import { useQuery } from '@tanstack/react-query';
import { createApiClient } from '../api-client';
import { useAuthStore } from '../../store/auth.store';

export type PerformedExerciseItem = {
  id: string;
  name: string;
};

export type PerformedExercisesResult = {
  strength: PerformedExerciseItem[];
  cardio: PerformedExerciseItem[];
  plio: PerformedExerciseItem[];
  mobility: PerformedExerciseItem[];
  isometric: PerformedExerciseItem[];
  sport: PerformedExerciseItem[];
};

type QueryInput = {
  clientId?: string;
  from: string;
  to: string;
};

export function usePerformedExercisesQuery(input: QueryInput, options?: { enabled?: boolean }) {
  const auth = useAuth();
  return useQuery({
    enabled: Boolean(auth) && (options?.enabled ?? true),
    queryFn: () => fetchPerformedExercises(auth, input),
    queryKey: ['progress', 'performed-exercises', input.clientId, input.from, input.to],
  });
}

function useAuth() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const activeRole = useAuthStore((state) => state.activeRole);
  if (!accessToken || !activeRole) return null;
  return { accessToken, activeRole };
}

async function fetchPerformedExercises(
  auth: ReturnType<typeof useAuth>,
  input: QueryInput,
): Promise<PerformedExercisesResult> {
  if (!auth) throw new Error('Missing auth');
  const query = new URLSearchParams({ from: input.from, to: input.to });
  if (input.clientId) query.set('clientId', input.clientId);
  return createApiClient(auth).get<PerformedExercisesResult>(`/progress/performed-exercises?${query}`);
}
