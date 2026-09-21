import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import { createApiClient } from '../api-client';
import { useAuthStore } from '../../store/auth.store';
import type {
  CheckpointWriteInput,
  MealWriteInput,
  NutritionCheckpoint,
  NutritionMeal,
  NutritionPlan,
  PlanWriteInput,
} from '../../screens/coach/nutrition/nutrition.types';

type ListResponse<T> = { items: T[] };

function useAuth() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const activeRole = useAuthStore((state) => state.activeRole);
  if (!accessToken || !activeRole) return null;
  return { accessToken, activeRole };
}

export function useNutritionMealsQuery(): UseQueryResult<NutritionMeal[], Error> {
  const auth = useAuth();
  return useQuery({
    enabled: Boolean(auth),
    queryFn: async () => {
      const response = await createApiClient(auth!).get<ListResponse<NutritionMeal>>('/nutrition/meals');
      return response.items;
    },
    queryKey: ['nutrition', 'meals', auth?.activeRole, auth?.accessToken],
  });
}

export function useCreateMealMutation() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MealWriteInput) => createApiClient(auth!).post<NutritionMeal>('/nutrition/meals', input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['nutrition', 'meals'] }),
  });
}

export function useUpdateMealMutation() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { mealId: string; payload: Partial<MealWriteInput> }) =>
      createApiClient(auth!).patch<NutritionMeal>(`/nutrition/meals/${input.mealId}`, input.payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['nutrition', 'meals'] }),
  });
}

export function useDeleteMealMutation() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (mealId: string) => createApiClient(auth!).delete(`/nutrition/meals/${mealId}`),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['nutrition', 'meals'] }),
  });
}

export function useNutritionPlansQuery(): UseQueryResult<NutritionPlan[], Error> {
  const auth = useAuth();
  return useQuery({
    enabled: Boolean(auth),
    queryFn: async () => {
      const response = await createApiClient(auth!).get<ListResponse<NutritionPlan>>('/nutrition/plans');
      return response.items;
    },
    queryKey: ['nutrition', 'plans', auth?.activeRole, auth?.accessToken],
  });
}

export function useCreatePlanMutation() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PlanWriteInput) => createApiClient(auth!).post<NutritionPlan>('/nutrition/plans', input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['nutrition', 'plans'] }),
  });
}

export function useUpdatePlanMutation() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { payload: Partial<PlanWriteInput>; planId: string }) =>
      createApiClient(auth!).patch<NutritionPlan>(`/nutrition/plans/${input.planId}`, input.payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['nutrition'] }),
  });
}

export function useDeletePlanMutation() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (planId: string) => createApiClient(auth!).delete(`/nutrition/plans/${planId}`),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['nutrition', 'plans'] }),
  });
}

export function useAssignPlanMutation() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { clientId: string; planId: string }) =>
      createApiClient(auth!).post<NutritionPlan>(`/nutrition/plans/${input.planId}/assign`, {
        clientId: input.clientId,
      }),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['nutrition'] });
      void queryClient.invalidateQueries({ queryKey: ['nutrition', 'client-plans', variables.clientId] });
    },
  });
}

export function useClientNutritionPlansQuery(clientId: string): UseQueryResult<NutritionPlan[], Error> {
  const auth = useAuth();
  return useQuery({
    enabled: Boolean(auth) && Boolean(clientId),
    queryFn: async () => {
      const response = await createApiClient(auth!).get<ListResponse<NutritionPlan>>(`/nutrition/clients/${clientId}/plans`);
      return response.items;
    },
    queryKey: ['nutrition', 'client-plans', clientId, auth?.activeRole, auth?.accessToken],
  });
}

export function useNutritionCheckpointsQuery(planId: string): UseQueryResult<NutritionCheckpoint[], Error> {
  const auth = useAuth();
  return useQuery({
    enabled: Boolean(auth) && Boolean(planId),
    queryFn: async () => {
      const response = await createApiClient(auth!).get<ListResponse<NutritionCheckpoint>>(
        `/nutrition/plans/${planId}/checkpoints`,
      );
      return response.items;
    },
    queryKey: ['nutrition', 'checkpoints', planId, auth?.activeRole, auth?.accessToken],
  });
}

export function useCreateCheckpointMutation() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { payload: CheckpointWriteInput; planId: string }) =>
      createApiClient(auth!).post<NutritionCheckpoint>(`/nutrition/plans/${input.planId}/checkpoints`, input.payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['nutrition', 'checkpoints', variables.planId] });
      void queryClient.invalidateQueries({ queryKey: ['nutrition', 'plans'] });
      void queryClient.invalidateQueries({ queryKey: ['nutrition', 'client-plans'] });
    },
  });
}
