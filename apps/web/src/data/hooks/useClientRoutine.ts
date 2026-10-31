import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { RoutineEditorResponse, RoutineEditorSetPatch, RoutineEditorWeek } from '@trainerpro/shared';
import { createApiClient } from '../api-client';
import { useAuthStore } from '../../store/auth.store';
import { decodeUserKey } from '../../theme/appearance.logic';

function useRoutineAuth() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const activeRole = useAuthStore((state) => state.activeRole);
  return { accessToken, activeRole, userId: decodeUserKey(accessToken) };
}

type Auth = ReturnType<typeof useRoutineAuth>;
const api = (auth: Auth) => createApiClient(auth as Parameters<typeof createApiClient>[0]);
const key = (auth: Auth, clientId: string, ...rest: string[]) => [
  'client-routine',
  auth.userId,
  auth.activeRole,
  clientId,
  ...rest,
];

export function useClientRoutineQuery(clientId: string) {
  const auth = useRoutineAuth();
  return useQuery({
    enabled: Boolean(clientId && auth.accessToken && auth.activeRole),
    queryFn: () => api(auth).get<RoutineEditorResponse>(`/clients/${clientId}/routine`),
    queryKey: key(auth, clientId),
  });
}

/** One week on demand: weeks older than the visible window are not part of the main response. */
export function useClientRoutineWeekQuery(clientId: string, weekId: null | string) {
  const auth = useRoutineAuth();
  return useQuery({
    enabled: Boolean(weekId && auth.accessToken && auth.activeRole),
    queryFn: () => api(auth).get<RoutineEditorWeek>(`/clients/${clientId}/routine/weeks/${weekId}`),
    queryKey: key(auth, clientId, 'week', weekId ?? ''),
  });
}

type NewExercise = { displayName: string; exerciseLibraryId: string; sets: Array<{ reps?: number | null }> };

/** Every edit answers with the updated week; later weeks may have changed too, so everything is refreshed. */
export function useClientRoutineActions(clientId: string, weekId: string) {
  const auth = useRoutineAuth();
  const queryClient = useQueryClient();
  const base = `/clients/${clientId}/routine/weeks/${weekId}`;
  const refresh = () => queryClient.invalidateQueries({ queryKey: key(auth, clientId) });
  const updateSet = useMutation({
    mutationFn: (input: { patch: RoutineEditorSetPatch; setId: string }) =>
      api(auth).patch<RoutineEditorWeek>(`${base}/sets/${input.setId}`, input.patch),
    onSuccess: refresh,
  });
  const addExercise = useMutation({
    mutationFn: (input: { dayId: string; exercise: NewExercise }) =>
      api(auth).post<RoutineEditorWeek>(`${base}/days/${input.dayId}/exercises`, input.exercise),
    onSuccess: refresh,
  });
  const replaceExercise = useMutation({
    mutationFn: (input: { displayName: string; exerciseId: string; exerciseLibraryId: string }) =>
      api(auth).patch<RoutineEditorWeek>(`${base}/exercises/${input.exerciseId}`, {
        displayName: input.displayName,
        exerciseLibraryId: input.exerciseLibraryId,
      }),
    onSuccess: refresh,
  });
  const removeExercise = useMutation({
    mutationFn: (exerciseId: string) => api(auth).delete<RoutineEditorWeek>(`${base}/exercises/${exerciseId}`),
    onSuccess: refresh,
  });
  const setGroup = useMutation({
    mutationFn: (input: { dayId: string; exerciseIds: string[]; groupType: 'CIRCUIT' | 'SUPERSET' | null }) =>
      api(auth).put<RoutineEditorWeek>(`${base}/days/${input.dayId}/groups`, {
        exerciseIds: input.exerciseIds,
        groupType: input.groupType,
      }),
    onSuccess: refresh,
  });
  const addBlock = useMutation({
    mutationFn: (input: { block: { displayName: string; kind: string; libraryId: string }; dayId: string }) =>
      api(auth).post<RoutineEditorWeek>(base + '/days/' + input.dayId + '/blocks', input.block),
    onSuccess: refresh,
  });
  const setWarmups = useMutation({
    mutationFn: (input: { dayId: string; warmupTemplateIds: string[] }) =>
      api(auth).put<RoutineEditorWeek>(base + '/days/' + input.dayId + '/warmups', {
        warmupTemplateIds: input.warmupTemplateIds,
      }),
    onSuccess: refresh,
  });
  return { addBlock, addExercise, removeExercise, replaceExercise, setGroup, setWarmups, updateSet };
}
