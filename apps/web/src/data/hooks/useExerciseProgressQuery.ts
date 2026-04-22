import { useQuery } from '@tanstack/react-query';
import { createApiClient } from '../api-client';
import { useAuthStore } from '../../store/auth.store';

export type ExerciseType = 'strength' | 'cardio' | 'plio' | 'mobility' | 'isometric' | 'sport';

export type ExerciseProgressPoint = {
  sessionDate: string;
  sessionId: string;
  sets: number;
  totalReps: number;
  tonnage: number;
  avgRpe: number | null;
  e1rm: number | null;
  inol: number | null;
  totalDurationSeconds: number | null;
  durationMinutes: number | null;
  setDetails: Array<{
    setIndex: number;
    reps: number | null;
    weightKg: number | null;
    rpe: number | null;
    e1rm: number | null;
    inol: number | null;
    tonnage: number;
  }>;
};

type QueryInput = {
  clientId?: string;
  exerciseId: string;
  exerciseType?: ExerciseType;
  from: string;
  to: string;
};

export function useExerciseProgressQuery(input: QueryInput, options?: { enabled?: boolean }) {
  const auth = useAuth();
  return useQuery({
    enabled: Boolean(auth) && Boolean(input.exerciseId) && (options?.enabled ?? true),
    queryFn: () => fetchExerciseProgress(auth, input),
    queryKey: ['progress', 'exercise', input.clientId, input.exerciseId, input.exerciseType, input.from, input.to],
  });
}

function useAuth() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const activeRole = useAuthStore((state) => state.activeRole);
  if (!accessToken || !activeRole) return null;
  return { accessToken, activeRole };
}

async function fetchExerciseProgress(auth: ReturnType<typeof useAuth>, input: QueryInput): Promise<ExerciseProgressPoint[]> {
  if (!auth) throw new Error('Missing auth');
  const query = new URLSearchParams({ exerciseId: input.exerciseId, from: input.from, to: input.to });
  if (input.clientId) query.set('clientId', input.clientId);
  if (input.exerciseType) query.set('exerciseType', input.exerciseType);
  return createApiClient(auth).get<ExerciseProgressPoint[]>(`/progress/exercise?${query}`);
}
