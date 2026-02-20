import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createApiClient } from '../api-client';
import { useAuthStore } from '../../store/auth.store';

type FieldModeInput = {
  fieldKey: string;
  mode: 'CLIENT_INPUT' | 'COACH_INPUT' | 'HIDDEN';
};

type CardioTemplateBlockInput = {
  cardioMethodLibraryId?: null | string;
  displayName: string;
  fieldModes: FieldModeInput[];
  methodType?: null | string;
  notes?: null | string;
  restSeconds?: number;
  roundsPlanned?: number;
  sortOrder: number;
  targetDistanceMeters?: null | number;
  targetRpe?: null | number;
  workSeconds: number;
};

type CardioTemplateDayInput = {
  cardioBlocks: CardioTemplateBlockInput[];
  dayIndex: number;
  title: string;
};

export type UpsertCardioTemplateInput = {
  days: CardioTemplateDayInput[];
  name: string;
};

export type CardioTemplateView = {
  days: CardioTemplateDayInput[];
  id: string;
  name: string;
  templateVersion: number;
};

type ListTemplatesResponse = {
  items: CardioTemplateView[];
};

export function useCardioTemplatesQuery() {
  const auth = useAuth();
  return useQuery({
    enabled: Boolean(auth),
    queryFn: () => listTemplates(auth),
    queryKey: ['cardio-templates', auth?.accessToken, auth?.activeRole],
  });
}

export function useCreateCardioTemplateMutation() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpsertCardioTemplateInput) => createTemplate(auth, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['cardio-templates'] });
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

async function createTemplate(
  auth: ReturnType<typeof useAuth>,
  input: UpsertCardioTemplateInput,
) {
  if (!auth) {
    throw new Error('Missing authenticated context');
  }
  return createApiClient(auth).post<CardioTemplateView>('/plans/templates/cardio', input);
}

async function listTemplates(auth: ReturnType<typeof useAuth>): Promise<CardioTemplateView[]> {
  if (!auth) {
    throw new Error('Missing authenticated context');
  }
  const response = await createApiClient(auth).get<ListTemplatesResponse>('/plans/templates/cardio');
  return response.items;
}
