import { useQuery } from '@tanstack/react-query';
import {
  dateChunks,
  mergeDailyResults,
  type DateRange,
  type ProgressExerciseDaily,
  type ProgressExerciseRef,
  type ProgressRoutineCatalog,
  type ProgressRoutineDetail,
} from '@trainerpro/shared';

export type ProgressExerciseCard = ProgressExerciseRef & {
  mediaUrl: string | null;
  muscleGroup: string | null;
  sessionCount: number;
  maxWeightKg: number | null;
  recordE1rm: number | null;
};

type PerformedItem = {
  id: string;
  name: string;
  mediaUrl?: string | null;
  muscleGroup?: string | null;
  sessionCount?: number;
  maxWeightKg?: number | null;
  recordE1rm?: number | null;
};
import { createApiClient } from '../../../data/api-client';
import { useAuthStore } from '../../../store/auth.store';

function useAuth() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const activeRole = useAuthStore((state) => state.activeRole);
  return accessToken && activeRole ? { accessToken, activeRole } : null;
}

type Auth = NonNullable<ReturnType<typeof useAuth>>;

function maxOf(left: number | null | undefined, right: number | null | undefined): number | null {
  const values = [left, right].filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  return values.length ? Math.max(...values) : null;
}

function qs(params: Record<string, string>): string {
  return new URLSearchParams(params).toString();
}

export function useProgressRoutines() {
  const auth = useAuth();
  return useQuery({
    enabled: Boolean(auth),
    queryFn: () => createApiClient(auth as Auth).get<ProgressRoutineCatalog>('/progress/routines'),
    queryKey: ['client-progress', 'routines', auth?.activeRole],
  });
}

export function useProgressRoutine(assignmentId: string | null) {
  const auth = useAuth();
  return useQuery({
    enabled: Boolean(auth && assignmentId),
    queryFn: () =>
      createApiClient(auth as Auth).get<ProgressRoutineDetail>(`/progress/routines/${assignmentId}`, {
        'x-timezone-offset': String(-new Date().getTimezoneOffset()),
      }),
    queryKey: ['client-progress', 'routine', assignmentId, auth?.activeRole],
  });
}

export function useProgressExercises(range: DateRange) {
  const auth = useAuth();
  return useQuery({
    enabled: Boolean(auth),
    queryFn: async () => {
      const found = new Map<string, ProgressExerciseCard>();
      for (const part of dateChunks(range)) {
        const groups = await createApiClient(auth as Auth).get<Record<string, PerformedItem[]>>(
          `/progress/performed-exercises?${qs(part)}`,
        );
        for (const [type, items] of Object.entries(groups)) {
          for (const item of items) {
            const key = `${type}:${item.id}`;
            const previous = found.get(key);
            found.set(key, {
              exerciseId: item.id,
              exerciseType: type as ProgressExerciseRef['exerciseType'],
              name: item.name,
              mediaUrl: item.mediaUrl ?? previous?.mediaUrl ?? null,
              muscleGroup: item.muscleGroup ?? previous?.muscleGroup ?? null,
              sessionCount: (previous?.sessionCount ?? 0) + (item.sessionCount ?? 0),
              maxWeightKg: maxOf(previous?.maxWeightKg, item.maxWeightKg),
              recordE1rm: maxOf(previous?.recordE1rm, item.recordE1rm),
            });
          }
        }
      }
      return [...found.values()].sort((a, b) => a.name.localeCompare(b.name));
    },
    queryKey: ['client-progress', 'exercises', range.from, range.to, auth?.activeRole],
  });
}

export function useProgressDaily(exercise: ProgressExerciseRef, range: DateRange) {
  const auth = useAuth();
  return useQuery({
    enabled: Boolean(auth),
    queryFn: async () => {
      const results: ProgressExerciseDaily[] = [];
      for (const part of dateChunks(range)) {
        const params = qs({ exerciseId: exercise.exerciseId, exerciseType: exercise.exerciseType, ...part });
        results.push(await createApiClient(auth as Auth).get<ProgressExerciseDaily>(`/progress/exercise/daily?${params}`));
      }
      return mergeDailyResults(results);
    },
    queryKey: [
      'client-progress',
      'daily',
      exercise.exerciseType,
      exercise.exerciseId,
      range.from,
      range.to,
      auth?.activeRole,
    ],
  });
}
