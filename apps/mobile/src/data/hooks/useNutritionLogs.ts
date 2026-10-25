import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import { createApiClient } from '../api-client';
import { useAuthStore } from '../../store/auth.store';

export type EatenItem = {
  amount: number;
  caloriesKcal: number;
  carbsG: number;
  fatG: number;
  foodId: string;
  name: string;
  proteinG: number;
  servingUnit: string | null;
};

export type AiMealEstimate = {
  carbsG: number;
  confidence: number;
  dishes: string[];
  fatG: number;
  kcal: number;
  proteinG: number;
};

export type NutritionMealLog = {
  aiEstimate: AiMealEstimate | null;
  comment: string | null;
  date: string;
  eatenItems: EatenItem[];
  id: string;
  mealKey: string;
  mealName: string;
  photoPath: string | null;
  photoUrl: string | null;
  planId: string;
  status: 'CHANGED' | 'DONE' | 'SKIPPED';
};

export type FoodSearchHit = {
  caloriesKcal: number | null;
  carbsG: number | null;
  fatG: number | null;
  foodId: string;
  name: string;
  proteinG: number | null;
  servingUnit: string | null;
};

type LogInput = {
  aiEstimate?: AiMealEstimate | null;
  comment?: string | null;
  date: string;
  eatenItems?: Array<{ amount: number; foodId: string }>;
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

export function useDeleteNutritionLog(date: string) {
  const auth = useLogAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => createApiClient(auth!).delete<{ deleted: boolean }>(`/clients/me/nutrition/logs/${id}`),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...LOGS_KEY, date] }),
  });
}

export function useNutritionFoodSearch(query: string): UseQueryResult<FoodSearchHit[], Error> {
  const auth = useLogAuth();
  const term = query.trim();
  return useQuery({
    enabled: Boolean(auth) && term.length >= 2,
    queryFn: async () => {
      const response = await createApiClient(auth!).get<{ items: FoodSearchHit[] }>(
        `/clients/me/nutrition/foods?query=${encodeURIComponent(term)}`,
      );
      return response.items;
    },
    queryKey: ['clients', 'me', 'nutrition', 'foods', term, auth?.accessToken],
  });
}

function useLogAuth() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const activeRole = useAuthStore((state) => state.activeRole);
  if (!accessToken || activeRole !== 'client') return null;
  return { accessToken, activeRole };
}

export function useNutritionApi() {
  const auth = useLogAuth();
  return auth ? createApiClient(auth) : null;
}

export async function fetchFoodByBarcode(
  api: NonNullable<ReturnType<typeof useNutritionApi>>,
  code: string,
): Promise<FoodSearchHit | null> {
  try {
    return await api.get<FoodSearchHit>(`/clients/me/nutrition/foods/barcode/${encodeURIComponent(code)}`);
  } catch (error) {
    if (error instanceof Error && 'status' in error && (error as { status: number }).status === 404) return null;
    throw error;
  }
}
