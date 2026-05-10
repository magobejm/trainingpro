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

export function useArchiveCoachMutation() {
  return useCoachMutation((auth, coachMembershipId) => createApiClient(auth).delete(`/coaches/${coachMembershipId}`));
}

export function useRestoreCoachMutation() {
  return useCoachMutation((auth, coachMembershipId) => createApiClient(auth).post(`/coaches/${coachMembershipId}/restore`));
}

export function useCreateCoachMutation() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (email: string) => createApiClient(auth).post<CreateCoachResult>('/coaches', { email }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['coaches'] });
    },
  });
}

export function useToggleCoachMutation() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { coachMembershipId: string; isActive: boolean }) =>
      toggleCoach(auth, input.coachMembershipId, input.isActive),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['coaches'] });
    },
  });
}

function useCoachMutation(run: (auth: AuthState, coachMembershipId: string) => Promise<unknown>) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (coachMembershipId: string) => run(auth, coachMembershipId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['coaches'] });
    },
  });
}

type AuthState = {
  accessToken: string;
  activeRole: 'admin' | 'client' | 'coach';
};

function useAuth(): AuthState {
  const accessToken = useAuthStore((state) => state.accessToken);
  const activeRole = useAuthStore((state) => state.activeRole);
  if (!accessToken || !activeRole) {
    throw new Error('Missing authenticated context');
  }
  return { accessToken, activeRole };
}

async function toggleCoach(auth: AuthState, coachMembershipId: string, isActive: boolean): Promise<void> {
  const action = isActive ? 'deactivate' : 'activate';
  await createApiClient(auth).patch(`/coaches/${coachMembershipId}/${action}`);
}
