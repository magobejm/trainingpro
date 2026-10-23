import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import { createApiClient } from '../api-client';
import { useAuthStore } from '../../store/auth.store';

export type NutritionMealLog = {
  comment: string | null;
  date: string;
  id: string;
  mealKey: string;
  mealName: string;
  photoPath: string | null;
  planId: string;
  status: 'CHANGED' | 'DONE' | 'SKIPPED';
};

type LogInput = {
  comment?: string | null;
  date: string;
  mealKey: string;
  mealName: string;
  photoPath?: string | null;
  planId: string;
  status: NutritionMealLog['status'];
};

const LOGS_KEY = ['clients', 'me', 'nutrition', 'logs'] as const;

export function useNutritionLogs(date: string): UseQueryResult<NutritionMealLog[], Error> {
  const auth = useLogAuth();
  return useQuery({
    enabled: Boolean(auth),
    queryFn: async () => {
      const response = await createApiClient(auth!).get<{ items: NutritionMealLog[] }>(
        `/clients/me/nutrition/logs?from=${date}&to=${date}`,
      );
      return response.items;
    },
    queryKey: [...LOGS_KEY, date, auth?.accessToken],
  });
}

export function useSaveNutritionLog(date: string) {
  const auth = useLogAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: LogInput) => createApiClient(auth!).put<NutritionMealLog>('/clients/me/nutrition/logs', input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...LOGS_KEY, date] }),
  });
}

function useLogAuth() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const activeRole = useAuthStore((state) => state.activeRole);
  if (!accessToken || activeRole !== 'client') return null;
  return { accessToken, activeRole };
}
