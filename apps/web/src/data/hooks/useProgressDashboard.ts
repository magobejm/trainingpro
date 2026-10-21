import { useQuery } from '@tanstack/react-query';
import type {
  ProgressExerciseDaily,
  ProgressExerciseRef,
  ProgressRoutineCatalog,
  ProgressRoutineDetail,
} from '@trainerpro/shared';
import { createApiClient } from '../api-client';
import { useAuthStore } from '../../store/auth.store';
import { dateChunks, mergeDailyResults } from '../../screens/coach/progress/dashboard-model';
import type { DateRange } from '../../screens/coach/progress/progress-screen.types';

function useDashboardAuth() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const activeRole = useAuthStore((s) => s.activeRole);
  return { accessToken, activeRole };
}

function dashboardApi(auth: ReturnType<typeof useDashboardAuth>) {
  if (!auth.accessToken || !auth.activeRole) throw new Error('Missing auth');
  return createApiClient({ accessToken: auth.accessToken, activeRole: auth.activeRole });
}

export function useProgressRoutines(clientId: string) {
  const auth = useDashboardAuth();
  return useQuery({
    queryKey: ['progress-dashboard', auth.accessToken, auth.activeRole, clientId, 'routines'],
    enabled: Boolean(clientId && auth.accessToken && auth.activeRole),
    queryFn: () => dashboardApi(auth).get<ProgressRoutineCatalog>('/progress/routines', { clientId }),
  });
}

export function useProgressRoutine(clientId: string, assignmentId: string | null) {
  const auth = useDashboardAuth();
  return useQuery({
    queryKey: ['progress-dashboard', auth.accessToken, auth.activeRole, clientId, assignmentId],
    enabled: Boolean(clientId && assignmentId && auth.accessToken && auth.activeRole),
    queryFn: () =>
      dashboardApi(auth).get<ProgressRoutineDetail>(
        `/progress/routines/${assignmentId}`,
        { clientId },
        { 'x-timezone-offset': String(-new Date().getTimezoneOffset()) },
      ),
  });
}

export function useProgressDaily(input: {
  clientId: string;
  exercise: ProgressExerciseRef | null;
  range: DateRange;
  assignmentId: string | null;
  cycles: number[];
}) {
  const auth = useDashboardAuth();
  return useQuery({
    queryKey: ['progress-dashboard', auth.accessToken, auth.activeRole, input],
    enabled: Boolean(input.clientId && input.exercise && auth.accessToken && auth.activeRole),
    queryFn: async () => {
      const results: ProgressExerciseDaily[] = [];
      for (const range of dateChunks(input.range)) {
        const params: Record<string, string> = {
          clientId: input.clientId,
          exerciseId: input.exercise!.exerciseId,
          exerciseType: input.exercise!.exerciseType,
          ...range,
        };
        if (input.assignmentId) params.assignmentId = input.assignmentId;
        if (input.cycles.length) params.cycles = input.cycles.join(',');
        results.push(await dashboardApi(auth).get<ProgressExerciseDaily>('/progress/exercise/daily', params));
      }
      return mergeDailyResults(results);
    },
  });
}

export function useProgressExercises(clientId: string, range: DateRange, enabled: boolean) {
  const auth = useDashboardAuth();
  return useQuery({
    queryKey: ['progress-dashboard', auth.accessToken, auth.activeRole, clientId, 'exercises', range],
    enabled: Boolean(enabled && clientId && auth.accessToken && auth.activeRole),
    queryFn: async () => {
      const found = new Map<string, ProgressExerciseRef>();
      for (const part of dateChunks(range)) {
        const groups = await dashboardApi(auth).get<Record<string, Array<{ id: string; name: string }>>>(
          '/progress/performed-exercises',
          { clientId, ...part },
        );
        for (const [type, items] of Object.entries(groups))
          for (const item of items) {
            found.set(`${type}:${item.id}`, {
              exerciseId: item.id,
              exerciseType: type as ProgressExerciseRef['exerciseType'],
              name: item.name,
            });
          }
      }
      return [...found.values()].sort((a, b) => a.name.localeCompare(b.name));
    },
  });
}
