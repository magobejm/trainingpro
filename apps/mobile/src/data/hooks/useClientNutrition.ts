import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { createApiClient } from '../api-client';
import { useAuthStore } from '../../store/auth.store';

export type NutritionPlanType = 'ESTRUCTURADO' | 'LIBRE';

export type NutritionCheckpoint = {
  content: unknown;
  createdAt: string;
  endDate: null | string;
  id: string;
  note: null | string;
  planId: string;
  planName: null | string;
  setupData: unknown;
  startDate: null | string;
};

export type NutritionPlan = {
  checkpoints: NutritionCheckpoint[];
  clientId: null | string;
  content: unknown;
  description: null | string;
  id: string;
  name: string;
  setupData: unknown;
  sourcePlanId: null | string;
  strategy: null | string;
  type: NutritionPlanType;
};

export type ClientNutrition = {
  estructuradoPlan?: NutritionPlan;
  librePlan?: NutritionPlan;
};

const NUTRITION_KEY = ['clients', 'me', 'nutrition'] as const;

export function useClientNutritionQuery(): UseQueryResult<ClientNutrition, Error> {
  const auth = useAuth();
  return useQuery({
    enabled: Boolean(auth),
    queryFn: () => fetchClientNutrition(auth),
    queryKey: NUTRITION_KEY,
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

async function fetchClientNutrition(auth: ReturnType<typeof useAuth>): Promise<ClientNutrition> {
  if (!auth) throw new Error('Missing authenticated context');
  return createApiClient(auth).get<ClientNutrition>('/clients/me/nutrition');
}
