import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createApiClient } from '../api-client';
import { useAuthStore } from '../../store/auth.store';

export type FieldModeInput = {
  fieldKey: string;
  mode: 'CLIENT_INPUT' | 'COACH_INPUT' | 'HIDDEN';
};

export type TemplateExerciseInput = {
  displayName: string;
  exerciseLibraryId?: null | string;
  fieldModes: FieldModeInput[];
  notes?: null | string;
  perSetWeightRanges?: { maxKg: null | number; minKg: null | number }[];
  repsMax?: null | number;
  repsMin?: null | number;
  setsPlanned?: null | number;
  sortOrder: number;
  weightRangeMaxKg?: null | number;
  weightRangeMinKg?: null | number;
};

export type TemplateDayInput = {
  dayIndex: number;
  exercises: TemplateExerciseInput[];
  title: string;
};

export type UpsertTemplateInput = {
  days: TemplateDayInput[];
  name: string;
};

export type PlanTemplateView = {
  coachMembershipId: null | string;
  days: TemplateDayInput[];
  id: string;
  name: string;
  scope: 'COACH' | 'GLOBAL';
  templateVersion: number;
};

type ListTemplatesResponse = {
  items: PlanTemplateView[];
};

export function usePlanTemplatesQuery(options?: { summary?: boolean }) {
  const auth = useAuth();
  return useQuery({
    enabled: Boolean(auth),
    queryFn: () => listTemplates(auth, options),
    queryKey: ['plan-templates', auth?.accessToken, auth?.activeRole, options?.summary],
  });
}

export function useCreatePlanTemplateMutation() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpsertTemplateInput) => createTemplate(auth, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['plan-templates'] });
    },
  });
}

export function useUpdatePlanTemplateMutation(templateId: string) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpsertTemplateInput) => updateTemplate(auth, templateId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['plan-templates'] });
    },
  });
}

export function useDeletePlanTemplateMutation() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (templateId: string) => deleteTemplate(auth, templateId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['plan-templates'] });
    },
  });
}

function useAuth() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const activeRole = useAuthStore((state) => state.activeRole);
  if (!accessToken || !activeRole) {
    return null;
  }
  return { accessToken, activeRole };
}

async function createTemplate(auth: ReturnType<typeof useAuth>, input: UpsertTemplateInput) {
  if (!auth) {
    throw new Error('Missing authenticated context');
  }
  return createApiClient(auth).post<PlanTemplateView>('/plans/templates/strength', input);
}

async function listTemplates(
  auth: ReturnType<typeof useAuth>,
  options?: { summary?: boolean },
): Promise<PlanTemplateView[]> {
  if (!auth) {
    throw new Error('Missing authenticated context');
  }
  const response = await createApiClient(auth).get<ListTemplatesResponse>(
    '/plans/templates/strength',
    options?.summary ? { summary: 'true' } : undefined,
  );
  return response.items;
}

async function updateTemplate(
  auth: ReturnType<typeof useAuth>,
  templateId: string,
  input: UpsertTemplateInput,
) {
  if (!auth) {
    throw new Error('Missing authenticated context');
  }
  return createApiClient(auth).patch<PlanTemplateView>(
    `/plans/templates/strength/${templateId}`,
    input,
  );
}

async function deleteTemplate(auth: ReturnType<typeof useAuth>, templateId: string) {
  if (!auth) {
    throw new Error('Missing authenticated context');
  }
  return createApiClient(auth).delete(`/plans/templates/strength/${templateId}`);
}
