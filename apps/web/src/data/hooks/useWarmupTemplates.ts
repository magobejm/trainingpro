import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createApiClient } from '../api-client';
import { useAuthStore } from '../../store/auth.store';

type BlockType = 'cardio' | 'isometric' | 'mobility' | 'plio' | 'sport' | 'strength';

export type WarmupTemplateGroupInput = {
  groupType: 'CIRCUIT';
  id: string;
  note?: null | string;
  sortOrder: number;
};

export type WarmupTemplateGroupView = {
  groupType: string;
  id: string;
  note?: null | string;
  sortOrder: number;
};

export type WarmupTemplateItemInput = {
  blockType: BlockType;
  cardioMethodLibraryId?: null | string;
  displayName: string;
  durationMinutes?: null | number;
  exerciseLibraryId?: null | string;
  groupId?: null | string;
  isometricExerciseLibraryId?: null | string;
  metadataJson?: null | Record<string, unknown>;
  notes?: null | string;
  plioExerciseLibraryId?: null | string;
  repsMax?: null | number;
  repsMin?: null | number;
  restSeconds?: null | number;
  roundsPlanned?: null | number;
  setsPlanned?: null | number;
  sortOrder: number;
  sportLibraryId?: null | string;
  targetRir?: null | number;
  targetRpe?: null | number;
  warmupExerciseLibraryId?: null | string;
  workSeconds?: null | number;
};

export type UpsertWarmupTemplateInput = {
  groups?: WarmupTemplateGroupInput[];
  items: WarmupTemplateItemInput[];
  name: string;
};

export type WarmupTemplateView = {
  coachMembershipId: null | string;
  createdAt: string;
  groups: WarmupTemplateGroupView[];
  id: string;
  items: WarmupTemplateItemInput[];
  name: string;
  scope: 'COACH' | 'GLOBAL';
  templateVersion: number;
  updatedAt: string;
};

type ListResponse = { items: WarmupTemplateView[] };

export function useWarmupTemplatesQuery(options?: { summary?: boolean }) {
  const auth = useAuth();
  return useQuery({
    enabled: Boolean(auth),
    queryFn: () => listTemplates(auth, options),
    queryKey: ['warmup-templates', auth?.accessToken, auth?.activeRole, options?.summary],
  });
}

export function useCreateWarmupTemplateMutation() {
  const auth = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpsertWarmupTemplateInput) => createTemplate(auth, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['warmup-templates'] });
    },
  });
}

export function useUpdateWarmupTemplateMutation(templateId: string) {
  const auth = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpsertWarmupTemplateInput) => updateTemplate(auth, templateId, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['warmup-templates'] });
    },
  });
}

export function useDeleteWarmupTemplateMutation() {
  const auth = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (templateId: string) => deleteTemplate(auth, templateId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['warmup-templates'] });
    },
  });
}

function useAuth() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const activeRole = useAuthStore((state) => state.activeRole);
  return accessToken && activeRole ? { accessToken, activeRole } : null;
}

type Auth = ReturnType<typeof useAuth>;

async function listTemplates(auth: Auth, options?: { summary?: boolean }): Promise<WarmupTemplateView[]> {
  if (!auth) {
    throw new Error('Missing authenticated context');
  }
  const response = await createApiClient(auth).get<ListResponse>(
    '/plans/templates/warmups',
    options?.summary ? { summary: 'true' } : undefined,
  );
  return response.items;
}

async function createTemplate(auth: Auth, input: UpsertWarmupTemplateInput) {
  if (!auth) {
    throw new Error('Missing authenticated context');
  }
  return createApiClient(auth).post<WarmupTemplateView>('/plans/templates/warmups', input);
}

async function updateTemplate(auth: Auth, templateId: string, input: UpsertWarmupTemplateInput) {
  if (!auth) {
    throw new Error('Missing authenticated context');
  }
  return createApiClient(auth).patch<WarmupTemplateView>(`/plans/templates/warmups/${templateId}`, input);
}

async function deleteTemplate(auth: Auth, templateId: string) {
  if (!auth) {
    throw new Error('Missing authenticated context');
  }
  return createApiClient(auth).delete(`/plans/templates/warmups/${templateId}`);
}
