import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { createApiClient } from '../api-client';
import { useAuthStore } from '../../store/auth.store';

export type NutritionConsideration = {
  code: string;
  priority: 'P1' | 'P2' | 'P3' | 'P4';
  tone: 'bad' | 'good' | 'neutral';
  values?: { x?: number };
  variant: number;
};

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
  foods?: Array<{
    considerations?: NutritionConsideration[];
    id: string;
    name: string;
  }>;
  librePlan?: NutritionPlan;
  meals?: Array<{
    considerations?: NutritionConsideration[];
    id: string;
    name: string;
  }>;
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
