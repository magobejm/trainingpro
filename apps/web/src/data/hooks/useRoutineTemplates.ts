import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import { createApiClient } from '../api-client';
import { useAuthStore } from '../../store/auth.store';

/* ── Types ── */

export type RoutineStrengthBlockInput = {
  displayName: string;
  exerciseLibraryId?: null | string;
  fieldModes: { fieldKey: string; mode: 'CLIENT_INPUT' | 'COACH_INPUT' | 'HIDDEN' }[];
  notes?: null | string;
  perSetWeightRanges?: { maxKg: null | number; minKg: null | number }[];
  repsMax?: null | number;
  repsMin?: null | number;
  restSeconds?: null | number;
  setsPlanned?: null | number;
  sortOrder: number;
  targetRir?: null | number;
  targetRpe?: null | number;
  weightRangeMaxKg?: null | number;
  weightRangeMinKg?: null | number;
};

export type RoutineCardioBlockInput = {
  cardioMethodLibraryId?: null | string;
  displayName: string;
  fieldModes: { fieldKey: string; mode: 'CLIENT_INPUT' | 'COACH_INPUT' | 'HIDDEN' }[];
  methodType: string;
  notes?: null | string;
  restSeconds: number;
  roundsPlanned: number;
  sortOrder: number;
  targetDistanceMeters?: null | number;
  targetRpe?: null | number;
  workSeconds: number;
};

export type RoutinePlioBlockInput = {
  displayName: string;
  notes?: null | string;
  plioExerciseLibraryId?: null | string;
  restSeconds: number;
  roundsPlanned: number;
  sortOrder: number;
  targetRpe?: null | number;
  workSeconds: number;
};

export type RoutineWarmupBlockInput = {
  displayName: string;
  notes?: null | string;
  restSeconds: number;
  roundsPlanned: number;
  sortOrder: number;
  targetRpe?: null | number;
  warmupExerciseLibraryId?: null | string;
  workSeconds: number;
};

export type RoutineSportBlockInput = {
  displayName: string;
  durationMinutes: number;
  notes?: null | string;
  sortOrder: number;
  sportLibraryId?: null | string;
  targetRpe?: null | number;
};

export type RoutineDayInput = {
  cardioBlocks?: RoutineCardioBlockInput[];
  dayIndex: number;
  exercises?: RoutineStrengthBlockInput[];
  plioBlocks?: RoutinePlioBlockInput[];
  sportBlocks?: RoutineSportBlockInput[];
  title: string;
  warmupBlocks?: RoutineWarmupBlockInput[];
  warmupTemplates?: Array<{ id: string; name: string }>;
};

export type RoutineNeatInput = {
  title: string;
  description?: string;
};

export type UpsertRoutineInput = {
  days: RoutineDayInput[];
  expectedCompletionDays?: null | number;
  name: string;
  neats?: RoutineNeatInput[];
  objectiveIds?: string[];
};

export type RoutineTemplateView = {
  assignedClientsCount?: number;
  coachMembershipId: null | string;
  days: RoutineDayInput[];
  expectedCompletionDays?: null | number;
  id: string;
  isAssigned?: boolean;
  name: string;
  neats?: RoutineNeatInput[];
  objectiveIds?: string[];
  objectives?: Array<{
    code: string;
    id: string;
    isDefault: boolean;
    label: string;
    sortOrder: number;
  }>;
  scope: 'COACH' | 'GLOBAL';
  templateVersion: number;
};

type ListResponse = { items: RoutineTemplateView[] };

/* ── Hooks ── */

export function useRoutineTemplatesQuery(options?: { summary?: boolean }) {
  const auth = useAuth();
  return useQuery({
    enabled: Boolean(auth),
    queryFn: () => listRoutines(auth, options),
    queryKey: ['routine-templates', auth?.accessToken, auth?.activeRole, options?.summary],
  });
}

export function useCreateRoutineTemplateMutation() {
  const auth = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpsertRoutineInput) => createRoutine(auth, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['routine-templates'] });
    },
  });
}

export function useUpdateRoutineTemplateMutation(templateId: string) {
  const auth = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpsertRoutineInput) => updateRoutine(auth, templateId, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['routine-templates'] });
    },
  });
}

export function useDeleteRoutineTemplateMutation() {
  const auth = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (templateId: string) => deleteRoutine(auth, templateId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['routine-templates'] });
    },
  });
}

/* ── Routine Objectives catalog ── */

export type RoutineObjectiveView = {
  code: string;
  id: string;
  isDefault: boolean;
  label: string;
  sortOrder: number;
};

type ListRoutineObjectivesResponse = { items: RoutineObjectiveView[] };

export function useRoutineObjectivesQuery(): UseQueryResult<RoutineObjectiveView[], Error> {
  const auth = useAuth();
  return useQuery({
    enabled: Boolean(auth),
    queryFn: () => fetchRoutineObjectives(auth),
    queryKey: ['routine-objectives', auth?.activeRole, auth?.accessToken],
  });
}

async function fetchRoutineObjectives(auth: Auth): Promise<RoutineObjectiveView[]> {
  if (!auth) throw new Error('Missing authenticated context');
  const res = await createApiClient(auth).get<ListRoutineObjectivesResponse>('/plans/templates/routines/catalog/objectives');
  return res.items.sort((a, b) => a.label.localeCompare(b.label, 'es'));
}

/* ── Auth helper ── */

function useAuth() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const activeRole = useAuthStore((s) => s.activeRole);
  return accessToken && activeRole ? { accessToken, activeRole } : null;
}

/* ── API calls ── */

type Auth = ReturnType<typeof useAuth>;

async function createRoutine(auth: Auth, input: UpsertRoutineInput) {
  if (!auth) throw new Error('Missing authenticated context');
  return createApiClient(auth).post<RoutineTemplateView>('/plans/templates/routines', input);
}

async function listRoutines(auth: Auth, options?: { summary?: boolean }): Promise<RoutineTemplateView[]> {
  if (!auth) throw new Error('Missing authenticated context');
  const res = await createApiClient(auth).get<ListResponse>(
    '/plans/templates/routines',
    options?.summary ? { summary: 'true' } : undefined,
  );
  return res.items;
}

async function updateRoutine(auth: Auth, templateId: string, input: UpsertRoutineInput) {
  if (!auth) throw new Error('Missing authenticated context');
  return createApiClient(auth).patch<RoutineTemplateView>(`/plans/templates/routines/${templateId}`, input);
}

async function deleteRoutine(auth: Auth, templateId: string) {
  if (!auth) throw new Error('Missing authenticated context');
  return createApiClient(auth).delete(`/plans/templates/routines/${templateId}`);
}
