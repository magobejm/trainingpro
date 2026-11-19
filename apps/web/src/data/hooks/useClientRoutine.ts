import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  RoutineEditorItemKind,
  RoutineEditorItemMeta,
  RoutineEditorResponse,
  RoutineEditorSetPatch,
  RoutineEditorWeek,
} from '@trainerpro/shared';
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
    mutationFn: (input: {
      dayId: string;
      groupType: 'CIRCUIT' | 'SUPERSET' | null;
      items: Array<{ id: string; kind: string }>;
    }) =>
      api(auth).put<RoutineEditorWeek>(`${base}/days/${input.dayId}/groups`, {
        groupType: input.groupType,
        items: input.items,
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
  return {
    addBlock,
    addExercise,
    removeExercise,
    replaceExercise,
    setGroup,
    setWarmups,
    updateSet,
    ...useItemActions(auth, base, refresh),
    ...useWarmupActions(auth, base, refresh),
  };
}

export type WarmupRef = { dayId: string; warmupId: string };
export type WarmupItemRef = WarmupRef & { itemId: string };

/** Edits on the exercises of a day's warm-up. They only touch the client's own copy of that warm-up. */
function useWarmupActions(auth: Auth, base: string, refresh: () => Promise<void>) {
  const warmup = (ref: WarmupRef) => `${base}/days/${ref.dayId}/warmups/${ref.warmupId}/items`;
  const at = (ref: WarmupItemRef) => `${warmup(ref)}/${ref.itemId}`;
  const options = { onSuccess: refresh };
  const addWarmupItem = useMutation({
    mutationFn: (input: { item: { displayName: string; kind: RoutineEditorItemKind; libraryId: string }; ref: WarmupRef }) =>
      api(auth).post<RoutineEditorWeek>(warmup(input.ref), input.item),
    ...options,
  });
  const updateWarmupItem = useMutation({
    mutationFn: (input: { meta: RoutineEditorItemMeta; ref: WarmupItemRef }) =>
      api(auth).patch<RoutineEditorWeek>(at(input.ref), input.meta),
    ...options,
  });
  const replaceWarmupItem = useMutation({
    mutationFn: (input: { displayName: string; libraryId: string; ref: WarmupItemRef }) =>
      api(auth).post<RoutineEditorWeek>(`${at(input.ref)}/replace`, {
        displayName: input.displayName,
        libraryId: input.libraryId,
      }),
    ...options,
  });
  const removeWarmupItem = useMutation({
    mutationFn: (ref: WarmupItemRef) => api(auth).delete<RoutineEditorWeek>(at(ref)),
    ...options,
  });
  const addWarmupSet = useMutation({
    mutationFn: (ref: WarmupItemRef) => api(auth).post<RoutineEditorWeek>(`${at(ref)}/sets`, {}),
    ...options,
  });
  const removeWarmupSet = useMutation({
    mutationFn: (input: { ref: WarmupItemRef; setId: string }) =>
      api(auth).delete<RoutineEditorWeek>(`${at(input.ref)}/sets/${input.setId}`),
    ...options,
  });
  const patchWarmupSet = useMutation({
    mutationFn: (input: { patch: Record<string, unknown>; ref: WarmupItemRef; setId: string }) =>
      api(auth).patch<RoutineEditorWeek>(`${at(input.ref)}/sets/${input.setId}`, input.patch),
    ...options,
  });
  return {
    addWarmupItem,
    addWarmupSet,
    patchWarmupSet,
    removeWarmupItem,
    removeWarmupSet,
    replaceWarmupItem,
    updateWarmupItem,
  };
}

export type ItemRef = { id: string; kind: RoutineEditorItemKind };

/** Edits on one exercise or block: its sets, notes, locked variables, position and copies. */
function useItemActions(auth: Auth, base: string, refresh: () => Promise<void>) {
  const at = (ref: ItemRef) => `${base}/items/${ref.kind}/${ref.id}`;
  const options = { onSuccess: refresh };
  const addSet = useMutation({
    mutationFn: (ref: ItemRef) => api(auth).post<RoutineEditorWeek>(`${at(ref)}/sets`, {}),
    ...options,
  });
  const removeSet = useMutation({
    mutationFn: (input: { ref: ItemRef; setId: string }) =>
      api(auth).delete<RoutineEditorWeek>(`${at(input.ref)}/sets/${input.setId}`),
    ...options,
  });
  const patchItemSet = useMutation({
    mutationFn: (input: { patch: Record<string, unknown>; ref: ItemRef; setId: string }) =>
      api(auth).patch<RoutineEditorWeek>(`${at(input.ref)}/sets/${input.setId}`, input.patch),
    ...options,
  });
  const updateMeta = useMutation({
    mutationFn: (input: { meta: RoutineEditorItemMeta; ref: ItemRef }) =>
      api(auth).patch<RoutineEditorWeek>(at(input.ref), input.meta),
    ...options,
  });
  const replaceItem = useMutation({
    mutationFn: (input: { displayName: string; libraryId: string; ref: ItemRef }) =>
      api(auth).post<RoutineEditorWeek>(`${at(input.ref)}/replace`, {
        displayName: input.displayName,
        libraryId: input.libraryId,
      }),
    ...options,
  });
  const duplicateItem = useMutation({
    mutationFn: (ref: ItemRef) => api(auth).post<RoutineEditorWeek>(`${at(ref)}/duplicate`, {}),
    ...options,
  });
  const moveItem = useMutation({
    mutationFn: (input: { direction: 'down' | 'up'; ref: ItemRef } | { ref: ItemRef; toIndex: number }) =>
      api(auth).post<RoutineEditorWeek>(
        `${at(input.ref)}/move`,
        'toIndex' in input ? { toIndex: input.toIndex } : { direction: input.direction },
      ),
    ...options,
  });
  const removeItem = useMutation({
    mutationFn: (ref: ItemRef) => api(auth).delete<RoutineEditorWeek>(at(ref)),
    ...options,
  });
  return { addSet, duplicateItem, moveItem, patchItemSet, removeItem, removeSet, replaceItem, updateMeta };
}
