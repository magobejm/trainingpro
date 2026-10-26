import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createApiClient } from '../api-client';
import { useAuthStore } from '../../store/auth.store';

export type BulkAction =
  | { action: 'assignNutritionPlan'; planId: string }
  | { action: 'assignRoutine'; templateId: string }
  | { action: 'broadcastMessage'; message: string }
  | { action: 'scheduleTest'; date: string; physicalTestId: string };

export type BulkRow = { clientId: string; message?: string; status: 'error' | 'ok' };
export type BulkResult = { results: BulkRow[] };

export function useBulkClientsMutation() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { action: BulkAction; clientIds: string[] }) =>
      createApiClient({ accessToken: accessToken ?? '', activeRole: 'coach' }).post<BulkResult>('/clients/bulk', input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['clients'] });
      void queryClient.invalidateQueries({ queryKey: ['nutrition'] });
      void queryClient.invalidateQueries({ queryKey: ['chat'] });
    },
  });
}
