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
  id: string;
  name: string;
  templateVersion: number;
  days: TemplateDayInput[];
};

type ListTemplatesResponse = {
  items: PlanTemplateView[];
};

export function usePlanTemplatesQuery() {
  const auth = useAuth();
  return useQuery({
    enabled: Boolean(auth),
    queryFn: () => listTemplates(auth),
    queryKey: ['plan-templates', auth?.accessToken, auth?.activeRole],
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

async function listTemplates(auth: ReturnType<typeof useAuth>): Promise<PlanTemplateView[]> {
  if (!auth) {
    throw new Error('Missing authenticated context');
  }
  const response = await createApiClient(auth).get<ListTemplatesResponse>('/plans/templates/strength');
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
