import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createApiClient } from '../api-client';
import { useAuthStore } from '../../store/auth.store';
import type { CoachView } from './useCoachesQuery';

export type CreateCoachResult = {
  coach: CoachView;
  credentials: {
    temporaryPassword: null | string;
    userCreated: boolean;
  };
};

export type CoachAction = 'activate' | 'archive' | 'deactivate' | 'restore';

function useAdminClient() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const activeRole = useAuthStore((state) => state.activeRole);
  return () => {
    if (!accessToken || !activeRole) {
      throw new Error('Missing authenticated context');
    }
    return createApiClient({ accessToken, activeRole });
  };
}

export function useCreateCoachMutation() {
  const client = useAdminClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (email: string) => client().post<CreateCoachResult>('/coaches', { email }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['coaches'] });
    },
  });
}

export function useCoachActionMutation() {
  const client = useAdminClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { action: CoachAction; coachMembershipId: string }): Promise<void> => {
      const api = client();
      const id = input.coachMembershipId;
      if (input.action === 'archive') {
        await api.delete(`/coaches/${id}`);
      } else if (input.action === 'restore') {
        await api.post(`/coaches/${id}/restore`);
      } else {
        await api.patch(`/coaches/${id}/${input.action}`);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['coaches'] });
    },
  });
}
