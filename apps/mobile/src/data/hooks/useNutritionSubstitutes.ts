import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { createApiClient } from '../api-client';
import { useAuthStore } from '../../store/auth.store';

export type NutritionSubstitute = { foodId: string; grams: number; name: string };

export function useNutritionSubstitutes(foodId: string | null, grams: number): UseQueryResult<NutritionSubstitute[], Error> {
  const accessToken = useAuthStore((state) => state.accessToken);
  const activeRole = useAuthStore((state) => state.activeRole);
  const auth = accessToken && activeRole === 'client' ? { accessToken, activeRole } : null;
  return useQuery({
    enabled: Boolean(auth) && Boolean(foodId),
    queryFn: async () => {
      const response = await createApiClient(auth!).get<{ items: NutritionSubstitute[] }>(
        `/clients/me/nutrition/substitutes?foodId=${foodId}&grams=${grams}`,
      );
      return response.items;
    },
    queryKey: ['clients', 'me', 'nutrition', 'substitutes', foodId, grams, accessToken],
  });
}
